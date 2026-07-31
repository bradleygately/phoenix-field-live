import { DEFAULT_SETTINGS, type TravelSettings } from "./settings";
import { EMPTY_CREW_STATE, type CrewState } from "@/types";

export interface PersistedState {
  crew: CrewState;
  settings: TravelSettings;
  version: 1;
}

export const EMPTY_PERSISTED: PersistedState = {
  crew: EMPTY_CREW_STATE,
  settings: DEFAULT_SETTINGS,
  version: 1,
};

/**
 * Data layer boundary. Swap this implementation for a Cloud-backed one later
 * without touching the UI.
 */
export interface StateRepository {
  load(): Promise<PersistedState>;
  save(state: PersistedState): Promise<void>;
  clear(): Promise<void>;
}

const KEY = "psi-games-live-crew-control:v1";

class LocalStorageRepository implements StateRepository {
  async load(): Promise<PersistedState> {
    if (typeof window === "undefined") return EMPTY_PERSISTED;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return EMPTY_PERSISTED;
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      return {
        version: 1,
        crew: { ...EMPTY_CREW_STATE, ...(parsed.crew ?? {}) },
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      };
    } catch {
      return EMPTY_PERSISTED;
    }
  }

  async save(state: PersistedState): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota or private mode — the app stays usable in memory */
    }
  }

  async clear(): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(KEY);
  }
}

export const repository: StateRepository = new LocalStorageRepository();