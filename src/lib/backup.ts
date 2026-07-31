import { DEFAULT_SETTINGS, type TravelSettings } from "./settings";
import { INITIAL_CREW_STATE } from "./repository";
import { etStamp } from "./filename";
import type { CrewState } from "@/types";

export const BACKUP_APP = "phoenix-field-live";

export interface BackupFile {
  app: string;
  version: 1;
  exportedAt: string;
  /** audio takes live in IndexedDB and are intentionally not included */
  includesAudio: false;
  crew: CrewState;
  settings: TravelSettings;
}

export function buildBackup(crew: CrewState, settings: TravelSettings): BackupFile {
  return {
    app: BACKUP_APP,
    version: 1,
    exportedAt: new Date().toISOString(),
    includesAudio: false,
    crew,
    settings,
  };
}

export function backupFilename(epochMs: number): string {
  return `PhoenixFieldLive_Backup_${etStamp(epochMs)}.json`;
}

export function parseBackup(text: string): BackupFile | null {
  try {
    const parsed = JSON.parse(text) as Partial<BackupFile>;
    if (!parsed || typeof parsed !== "object" || !parsed.crew) return null;
    return {
      app: parsed.app ?? BACKUP_APP,
      version: 1,
      exportedAt: parsed.exportedAt ?? "",
      includesAudio: false,
      crew: { ...INITIAL_CREW_STATE, ...parsed.crew },
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    };
  } catch {
    return null;
  }
}

/** How much a backup file holds — shown before the user commits to restoring. */
export function summarize(crew: CrewState): string {
  const notes = (crew.itemNotes ?? []).length;
  const statuses = Object.keys(crew.statuses ?? {}).length;
  return `${statuses} statuses · ${notes} notes · ${crew.interviews.length} interviews · ${crew.log.length} log entries`;
}

function byId<T extends { id: string }>(incoming: T[], existing: T[]): T[] {
  const map = new Map(existing.map((x) => [x.id, x]));
  for (const item of incoming) map.set(item.id, item);
  return [...map.values()];
}

/** Merge keeps everything on this phone and layers the backup on top. */
export function mergeCrew(current: CrewState, incoming: CrewState): CrewState {
  return {
    ...current,
    ...incoming,
    statuses: { ...current.statuses, ...incoming.statuses },
    notes: { ...current.notes, ...incoming.notes },
    positions: { ...current.positions, ...incoming.positions },
    agendaOrder: { ...(current.agendaOrder ?? {}), ...(incoming.agendaOrder ?? {}) },
    wrap: { ...current.wrap, ...incoming.wrap },
    itemNotes: byId(incoming.itemNotes ?? [], current.itemNotes ?? []).sort(
      (a, b) => b.at - a.at,
    ),
    interviews: byId(incoming.interviews, current.interviews),
    changes: byId(incoming.changes, current.changes),
    cards: byId(incoming.cards, current.cards),
    gear: byId(incoming.gear, current.gear),
    log: byId(incoming.log, current.log)
      .sort((a, b) => b.at - a.at)
      .slice(0, 500),
    queue: current.queue,
  };
}
