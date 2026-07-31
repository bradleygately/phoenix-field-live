/** IndexedDB blob store for interview audio. Survives reload, sleep and offline. */
const DB = "psi-audio";
const STORE = "recordings";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = run(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Append a chunk as it arrives so a sleeping screen never loses the take. */
export async function appendChunk(key: string, chunk: Blob): Promise<void> {
  const existing = (await tx<Blob[] | undefined>("readonly", (s) => s.get(key))) ?? [];
  await tx("readwrite", (s) => s.put([...existing, chunk], key));
}

export async function getRecording(key: string): Promise<Blob | null> {
  const chunks = await tx<Blob[] | undefined>("readonly", (s) => s.get(key));
  if (!chunks || chunks.length === 0) return null;
  return new Blob(chunks, { type: chunks[0]!.type || "audio/webm" });
}

export async function deleteRecording(key: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(key));
}
