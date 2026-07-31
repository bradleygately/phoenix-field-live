import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { SCHEDULE } from "@/data/schedule";
import { EMPTY_PERSISTED, repository, type PersistedState } from "@/lib/repository";
import { DEFAULT_SETTINGS, type TravelSettings } from "@/lib/settings";
import { charlotteNow, type CharlotteNow } from "@/lib/time";
import {
  EMPTY_CREW_STATE,
  type CrewId,
  type CrewState,
  type FieldChange,
  type LogEntry,
  type ScheduleItem,
  type Status,
} from "@/types";

export const MANUAL_POSITION_TTL_MIN = 90;

interface StoreValue {
  ready: boolean;
  role: CrewId;
  setRole: (role: CrewId) => void;
  crew: CrewState;
  settings: TravelSettings;
  updateSettings: (patch: Partial<TravelSettings>) => void;
  resetSettings: () => void;
  schedule: ScheduleItem[];
  statusOf: (id: string) => Status;
  setStatus: (id: string, status: Status) => void;
  applyChange: (
    item: ScheduleItem,
    field: keyof ScheduleItem & string,
    value: string,
    reason: string,
  ) => void;
  revertChange: (changeId: string) => void;
  addLog: (entry: Omit<LogEntry, "id" | "at" | "editor"> & { editor?: CrewId }) => void;
  setPosition: (crew: CrewId, room: string) => void;
  clearPosition: (crew: CrewId) => void;
  setNote: (itemId: string, note: string) => void;
  now: CharlotteNow;
  epochMs: number;
  simOffsetMs: number;
  setSimOffsetMs: (ms: number) => void;
  exportState: () => string;
  importState: (json: string) => boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<CrewId>("jesse");
  const [crew, setCrew] = useState<CrewState>(EMPTY_CREW_STATE);
  const [settings, setSettings] = useState<TravelSettings>(DEFAULT_SETTINGS);
  const [simOffsetMs, setSimOffsetMs] = useState(0);
  const [tick, setTick] = useState(() => Date.now());
  const loaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    repository.load().then((state) => {
      if (cancelled) return;
      setCrew(state.crew);
      setSettings(state.settings);
      loaded.current = true;
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    const payload: PersistedState = { ...EMPTY_PERSISTED, crew, settings };
    void repository.save(payload);
  }, [crew, settings]);

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const epochMs = tick + simOffsetMs;
  const now = useMemo(() => charlotteNow(epochMs), [epochMs]);

  const addLog = useCallback<StoreValue["addLog"]>(
    (entry) => {
      setCrew((prev) => ({
        ...prev,
        log: [
          {
            id: uid(),
            at: Date.now(),
            editor: entry.editor ?? role,
            kind: entry.kind,
            text: entry.text,
            itemId: entry.itemId,
          },
          ...prev.log,
        ].slice(0, 500),
      }));
    },
    [role],
  );

  const setStatus = useCallback<StoreValue["setStatus"]>(
    (id, status) => {
      setCrew((prev) => ({ ...prev, statuses: { ...prev.statuses, [id]: status } }));
      addLog({ kind: "status", text: `Status → ${status}`, itemId: id });
    },
    [addLog],
  );

  const applyChange = useCallback<StoreValue["applyChange"]>(
    (item, field, value, reason) => {
      const officialValue = String(
        field === "room" ? item.roomOfficial : ((item[field] as string | undefined) ?? ""),
      );
      const change: FieldChange = {
        id: uid(),
        itemId: item.id,
        field,
        officialValue,
        currentValue: value,
        editor: role,
        at: Date.now(),
        reason,
      };
      setCrew((prev) => ({ ...prev, changes: [change, ...prev.changes] }));
      addLog({
        kind: "change",
        itemId: item.id,
        text: `${field}: "${officialValue}" → "${value}" (${reason})`,
      });
    },
    [addLog, role],
  );

  const revertChange = useCallback<StoreValue["revertChange"]>(
    (changeId) => {
      setCrew((prev) => ({
        ...prev,
        changes: prev.changes.map((c) =>
          c.id === changeId ? { ...c, reverted: true } : c,
        ),
      }));
      addLog({ kind: "change", text: "Reverted to official program value" });
    },
    [addLog],
  );

  const setPosition = useCallback<StoreValue["setPosition"]>((who, room) => {
    setCrew((prev) => ({
      ...prev,
      positions: { ...prev.positions, [who]: { room, at: Date.now(), manual: true } },
    }));
  }, []);

  const clearPosition = useCallback<StoreValue["clearPosition"]>((who) => {
    setCrew((prev) => {
      const positions = { ...prev.positions };
      delete positions[who];
      return { ...prev, positions };
    });
  }, []);

  const setNote = useCallback<StoreValue["setNote"]>((itemId, note) => {
    setCrew((prev) => ({ ...prev, notes: { ...prev.notes, [itemId]: note } }));
  }, []);

  /** Official values are never overwritten: overrides are layered on read. */
  const schedule = useMemo(() => {
    const active = crew.changes.filter((c) => !c.reverted);
    if (active.length === 0) return SCHEDULE;
    return SCHEDULE.map((item) => {
      const mine = active.filter((c) => c.itemId === item.id);
      if (mine.length === 0) return item;
      const next = { ...item };
      for (const c of [...mine].reverse()) {
        (next as unknown as Record<string, unknown>)[c.field] = c.currentValue;
      }
      return next;
    });
  }, [crew.changes]);

  const value: StoreValue = {
    ready,
    role,
    setRole,
    crew,
    settings,
    updateSettings: (patch) => setSettings((prev) => ({ ...prev, ...patch })),
    resetSettings: () => setSettings(DEFAULT_SETTINGS),
    schedule,
    statusOf: (id) => crew.statuses[id] ?? "Pending",
    setStatus,
    applyChange,
    revertChange,
    addLog,
    setPosition,
    clearPosition,
    setNote,
    now,
    epochMs,
    simOffsetMs,
    setSimOffsetMs,
    exportState: () => JSON.stringify({ crew, settings, version: 1 }, null, 2),
    importState: (json) => {
      try {
        const parsed = JSON.parse(json) as Partial<PersistedState>;
        setCrew({ ...EMPTY_CREW_STATE, ...(parsed.crew ?? {}) });
        setSettings({ ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) });
        return true;
      } catch {
        return false;
      }
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}