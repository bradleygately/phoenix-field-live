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
import {
  EMPTY_PERSISTED,
  INITIAL_CREW_STATE,
  repository,
  type PersistedState,
} from "@/lib/repository";
import { DEFAULT_SETTINGS, type TravelSettings } from "@/lib/settings";
import { charlotteNow, type CharlotteNow } from "@/lib/time";
import {
  canSetCardState,
  type CardState,
  type CrewId,
  type CrewState,
  type FieldChange,
  type GearIssue,
  type Interview,
  type ItemNote,
  type LogEntry,
  type MediaCard,
  type ScheduleItem,
  type Status,
  type SyncState,
  type WrapDay,
} from "@/types";

export const MANUAL_POSITION_TTL_MIN = 90;

export const EMPTY_WRAP_DAY: WrapDay = {
  checks: {},
  nextCall: "",
  firstAssignment: "",
  notes: "",
};

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
  itemNotesFor: (itemId: string) => ItemNote[];
  addItemNote: (itemId: string, text: string) => void;
  deleteItemNote: (noteId: string) => void;
  keepItemNote: (noteId: string) => void;
  restoreItemNote: (note: ItemNote) => void;
  reorderItemNotes: (ids: string[]) => void;
  /** Manual agenda tile order (drag to reorder within a section). */
  agendaOrder: Record<string, number>;
  reorderAgenda: (ids: string[]) => void;
  reassign: (input: {
    item: ScheduleItem;
    who: CrewId;
    assignment: string;
    committed: boolean;
    reason: string;
    effective: string;
  }) => void;
  upsertInterview: (interview: Interview) => void;
  patchInterview: (id: string, patch: Partial<Interview>, note?: string) => void;
  toggleInterviewTimer: (id: string) => void;
  deleteInterview: (id: string) => void;
  restoreInterview: (interview: Interview) => void;
  reorderInterviews: (ids: string[]) => void;
  upsertCard: (card: MediaCard) => void;
  setCardState: (id: string, state: CardState) => boolean;
  addGear: (issue: Omit<GearIssue, "id" | "at" | "resolved">) => void;
  resolveGear: (id: string) => void;
  setWrap: (date: string, patch: Partial<WrapDay>) => void;
  toggleWrapCheck: (date: string, key: string) => void;
  wrapFor: (date: string) => WrapDay;
  syncState: SyncState;
  online: boolean;
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
  const [crew, setCrew] = useState<CrewState>(INITIAL_CREW_STATE);
  const [settings, setSettings] = useState<TravelSettings>(DEFAULT_SETTINGS);
  const [simOffsetMs, setSimOffsetMsState] = useState(0);
  const [tick, setTick] = useState(() => Date.now());
  const [online, setOnline] = useState(true);
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
    const stored = window.sessionStorage.getItem("psi-sim-offset");
    if (stored) setSimOffsetMsState(Number(stored) || 0);
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    const sync = () => setOnline(window.navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const setSimOffsetMs = useCallback((ms: number) => {
    setSimOffsetMsState(ms);
    window.sessionStorage.setItem("psi-sim-offset", String(ms));
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

  const addItemNote = useCallback<StoreValue["addItemNote"]>(
    (itemId, text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const note: ItemNote = {
        id: uid(),
        itemId,
        text: trimmed,
        author: role,
        at: Date.now(),
      };
      setCrew((prev) => ({ ...prev, itemNotes: [note, ...(prev.itemNotes ?? [])] }));
      addLog({ kind: "note", itemId, text: `Note added: ${trimmed}` });
    },
    [addLog, role],
  );

  const deleteItemNote = useCallback<StoreValue["deleteItemNote"]>((noteId) => {
    setCrew((prev) => ({
      ...prev,
      itemNotes: (prev.itemNotes ?? []).filter((n) => n.id !== noteId),
    }));
  }, []);

  const keepItemNote = useCallback<StoreValue["keepItemNote"]>((noteId) => {
    setCrew((prev) => ({
      ...prev,
      itemNotes: (prev.itemNotes ?? []).map((n) =>
        n.id === noteId ? { ...n, kept: true } : n,
      ),
    }));
  }, []);

  const restoreItemNote = useCallback<StoreValue["restoreItemNote"]>((note) => {
    setCrew((prev) => ({
      ...prev,
      itemNotes: [note, ...(prev.itemNotes ?? []).filter((n) => n.id !== note.id)].sort(
        (a, b) => b.at - a.at,
      ),
    }));
  }, []);

  /** Offline edits are queued visibly and never silently dropped. */
  const enqueue = useCallback((summary: string) => {
    if (typeof window !== "undefined" && window.navigator.onLine) return;
    setCrew((prev) => ({
      ...prev,
      queue: [...prev.queue, { id: uid(), at: Date.now(), summary }].slice(-200),
    }));
  }, []);

  /** Manual note order set by dragging tiles. */
  const reorderItemNotes = useCallback<StoreValue["reorderItemNotes"]>((ids) => {
    setCrew((prev) => {
      const rank = new Map(ids.map((id, index) => [id, index]));
      return {
        ...prev,
        itemNotes: (prev.itemNotes ?? []).map((n) =>
          rank.has(n.id) ? { ...n, order: rank.get(n.id)! } : n,
        ),
      };
    });
  }, []);

  /** Manual agenda tile order set by dragging, persisted like everything else. */
  const reorderAgenda = useCallback<StoreValue["reorderAgenda"]>((ids) => {
    setCrew((prev) => {
      const next = { ...(prev.agendaOrder ?? {}) };
      ids.forEach((id, index) => {
        next[id] = index;
      });
      return { ...prev, agendaOrder: next };
    });
  }, []);

  const reassign = useCallback<StoreValue["reassign"]>(
    ({ item, who, assignment, committed, reason, effective }) => {
      const officialAssignment = String(item[who] ?? "");
      const now = Date.now();
      const changes: FieldChange[] = [
        {
          id: uid(),
          itemId: item.id,
          field: who,
          officialValue: officialAssignment,
          currentValue: assignment,
          editor: role,
          at: now,
          reason,
        },
        {
          id: uid(),
          itemId: item.id,
          field: `commit.${who}`,
          officialValue: String(item.commit[who]),
          currentValue: String(committed),
          editor: role,
          at: now,
          reason,
        },
      ];
      setCrew((prev) => ({ ...prev, changes: [...changes, ...prev.changes] }));
      addLog({
        kind: "reassign",
        itemId: item.id,
        text: `${cap(who)} → ${assignment} (${committed ? "COMMITTED" : "advisory"}) from ${effective || "now"} — ${reason}`,
        meta: { who, committed: String(committed), effective },
      });
      enqueue(`Reassign ${who} on ${item.title}`);
    },
    [addLog, enqueue, role],
  );

  const upsertInterview = useCallback<StoreValue["upsertInterview"]>((interview) => {
    setCrew((prev) => {
      const exists = prev.interviews.some((i) => i.id === interview.id);
      const next = { ...interview, updatedAt: Date.now() };
      return {
        ...prev,
        interviews: exists
          ? prev.interviews.map((i) => (i.id === interview.id ? next : i))
          : [next, ...prev.interviews],
      };
    });
  }, []);

  const patchInterview = useCallback<StoreValue["patchInterview"]>(
    (id, patch, note) => {
      let label = "";
      setCrew((prev) => ({
        ...prev,
        interviews: prev.interviews.map((i) => {
          if (i.id !== id) return i;
          label = i.target;
          return { ...i, ...patch, updatedAt: Date.now() };
        }),
      }));
      if (note) addLog({ kind: "interview", text: `${label || "Interview"}: ${note}` });
      enqueue(`Interview update: ${label}`);
    },
    [addLog, enqueue],
  );

  const toggleInterviewTimer = useCallback<StoreValue["toggleInterviewTimer"]>(
    (id) => {
      let note = "";
      setCrew((prev) => ({
        ...prev,
        interviews: prev.interviews.map((i) => {
          if (i.id !== id) return i;
          const now = Date.now();
          if (i.runningSince) {
            note = `stopped timer (${Math.round((now - i.runningSince) / 1000)}s)`;
            return {
              ...i,
              runningSince: null,
              elapsedMs: i.elapsedMs + (now - i.runningSince),
              status: "Recorded",
              updatedAt: now,
            };
          }
          note = "started timer";
          return { ...i, runningSince: now, status: "Recording", updatedAt: now };
        }),
      }));
      const target = crew.interviews.find((i) => i.id === id)?.target ?? "Interview";
      addLog({ kind: "interview", text: `${target} ${note}` });
    },
    [addLog, crew.interviews],
  );

  const deleteInterview = useCallback<StoreValue["deleteInterview"]>((id) => {
    setCrew((prev) => ({
      ...prev,
      interviews: prev.interviews.filter((i) => i.id !== id),
    }));
  }, []);

  const restoreInterview = useCallback<StoreValue["restoreInterview"]>((interview) => {
    setCrew((prev) => ({
      ...prev,
      interviews: [interview, ...prev.interviews.filter((i) => i.id !== interview.id)],
    }));
  }, []);

  /** Manual priority order set by dragging tiles. Persisted like everything else. */
  const reorderInterviews = useCallback<StoreValue["reorderInterviews"]>((ids) => {
    setCrew((prev) => {
      const rank = new Map(ids.map((id, index) => [id, index]));
      return {
        ...prev,
        interviews: [...prev.interviews].sort(
          (a, b) =>
            (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
            (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
        ),
      };
    });
  }, []);

  const upsertCard = useCallback<StoreValue["upsertCard"]>(
    (card) => {
      setCrew((prev) => {
        const exists = prev.cards.some((c) => c.id === card.id);
        const next = { ...card, updatedAt: Date.now() };
        return {
          ...prev,
          cards: exists
            ? prev.cards.map((c) => (c.id === card.id ? next : c))
            : [next, ...prev.cards],
        };
      });
      addLog({
        kind: "card",
        text: `Card ${card.cardId} → ${card.state} (${card.holder})`,
        meta: { cardId: card.cardId, state: card.state },
      });
    },
    [addLog],
  );

  const setCardState = useCallback<StoreValue["setCardState"]>(
    (id, state) => {
      const card = crew.cards.find((c) => c.id === id);
      if (!card) return false;
      if (!canSetCardState(card.state, state)) return false;
      setCrew((prev) => ({
        ...prev,
        cards: prev.cards.map((c) =>
          c.id === id ? { ...c, state, updatedAt: Date.now() } : c,
        ),
      }));
      addLog({ kind: "card", text: `Card ${card.cardId}: ${card.state} → ${state}` });
      return true;
    },
    [addLog, crew.cards],
  );

  const addGear = useCallback<StoreValue["addGear"]>(
    (issue) => {
      setCrew((prev) => ({
        ...prev,
        gear: [
          { ...issue, id: uid(), at: Date.now(), resolved: false },
          ...prev.gear,
        ].slice(0, 200),
      }));
      addLog({ kind: "gear", text: `${issue.kind}: ${issue.text} (${issue.holder})` });
    },
    [addLog],
  );

  const resolveGear = useCallback<StoreValue["resolveGear"]>((id) => {
    setCrew((prev) => ({
      ...prev,
      gear: prev.gear.map((g) => (g.id === id ? { ...g, resolved: true } : g)),
    }));
  }, []);

  const setWrap = useCallback<StoreValue["setWrap"]>((date, patch) => {
    setCrew((prev) => ({
      ...prev,
      wrap: {
        ...prev.wrap,
        [date]: { ...EMPTY_WRAP_DAY, ...(prev.wrap[date] ?? {}), ...patch },
      },
    }));
  }, []);

  const toggleWrapCheck = useCallback<StoreValue["toggleWrapCheck"]>((date, key) => {
    setCrew((prev) => {
      const day = prev.wrap[date] ?? EMPTY_WRAP_DAY;
      return {
        ...prev,
        wrap: {
          ...prev.wrap,
          [date]: { ...day, checks: { ...day.checks, [key]: !day.checks[key] } },
        },
      };
    });
  }, []);

  /** Official values are never overwritten: overrides are layered on read. */
  const schedule = useMemo(() => {
    const active = crew.changes.filter((c) => !c.reverted);
    if (active.length === 0) return SCHEDULE;
    return SCHEDULE.map((item) => {
      const mine = active.filter((c) => c.itemId === item.id);
      if (mine.length === 0) return item;
      const next = { ...item, commit: { ...item.commit } };
      for (const c of [...mine].reverse()) {
        if (c.field.startsWith("commit.")) {
          const who = c.field.slice(7) as CrewId;
          next.commit[who] = c.currentValue === "true";
        } else {
          (next as unknown as Record<string, unknown>)[c.field] = c.currentValue;
        }
      }
      return next;
    });
  }, [crew.changes]);

  const syncState: SyncState = !online
    ? "local"
    : crew.queue.length > 0
      ? "syncing"
      : "local";

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
    itemNotesFor: (itemId) =>
      (crew.itemNotes ?? [])
        .filter((n) => n.itemId === itemId)
        .sort(
          (a, b) =>
            // A dragged order wins; otherwise kept notes float up, then newest first.
            (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
            Number(Boolean(b.kept)) - Number(Boolean(a.kept)) ||
            b.at - a.at,
        ),
    addItemNote,
    deleteItemNote,
    keepItemNote,
    restoreItemNote,
    reorderItemNotes,
    agendaOrder: crew.agendaOrder ?? {},
    reorderAgenda,
    reassign,
    upsertInterview,
    patchInterview,
    toggleInterviewTimer,
    deleteInterview,
    restoreInterview,
    reorderInterviews,
    upsertCard,
    setCardState,
    addGear,
    resolveGear,
    setWrap,
    toggleWrapCheck,
    wrapFor: (date) => crew.wrap[date] ?? EMPTY_WRAP_DAY,
    syncState,
    online,
    now,
    epochMs,
    simOffsetMs,
    setSimOffsetMs,
    exportState: () => JSON.stringify({ crew, settings, version: 1 }, null, 2),
    importState: (json) => {
      try {
        const parsed = JSON.parse(json) as Partial<PersistedState>;
        setCrew({ ...INITIAL_CREW_STATE, ...(parsed.crew ?? {}) });
        setSettings({ ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) });
        return true;
      } catch {
        return false;
      }
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}