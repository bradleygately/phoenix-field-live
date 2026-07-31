import type { ReleaseRecord } from "./release-types";

const RECORDS_KEY = "mpp.releases.v1";
const DRAFT_PREFIX = "mpp.draft.";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadRecords(): ReleaseRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(RECORDS_KEY);
    return raw ? (JSON.parse(raw) as ReleaseRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveRecords(records: ReleaseRecord[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event("mpp:records-updated"));
  } catch (err) {
    console.error("Unable to persist releases locally", err);
  }
}

export function upsertRecord(record: ReleaseRecord) {
  const records = loadRecords();
  const idx = records.findIndex((r) => r.releaseId === record.releaseId);
  if (idx >= 0) records[idx] = record;
  else records.unshift(record);
  saveRecords(records);
}

export function getRecord(releaseId: string): ReleaseRecord | undefined {
  return loadRecords().find((r) => r.releaseId === releaseId);
}

export function deleteRecord(releaseId: string) {
  saveRecords(loadRecords().filter((r) => r.releaseId !== releaseId));
}

export function loadDraft<T>(key: string): Partial<T> | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_PREFIX + key);
    return raw ? (JSON.parse(raw) as Partial<T>) : null;
  } catch {
    return null;
  }
}

export function saveDraft<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(DRAFT_PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota - ignore */
  }
}

export function clearDraft(key: string) {
  if (!isBrowser()) return;
  window.localStorage.removeItem(DRAFT_PREFIX + key);
}

export function newReleaseId(kind: "adult" | "minor"): string {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  const time = String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0");
  return `PSI26-${kind === "adult" ? "A" : "M"}-${stamp}-${time}-${rand}`;
}
