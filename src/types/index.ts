export type Priority = "MUST" | "HIGH" | "OPTIONAL" | "BACKUP";
export type Kind = "official" | "crew";
export type CrewId = "jesse" | "duane" | "brad";

export type Status =
  | "Pending"
  | "In Position"
  | "Filming"
  | "Complete"
  | "Changed"
  | "Skipped";

export const STATUSES: Status[] = [
  "Pending",
  "In Position",
  "Filming",
  "Complete",
  "Changed",
  "Skipped",
];

export interface Commit {
  jesse: boolean;
  duane: boolean;
  brad: boolean;
}

export interface ScheduleItem {
  id: string;
  /** ISO date, e.g. "2026-07-31" */
  date: string;
  startMin: number;
  endMin: number;
  startLabel: string;
  endLabel: string;
  title: string;
  presenter?: string | undefined;
  /** Room exactly as printed in the official program. Never mutated. */
  roomOfficial: string;
  /** Operational room (may be changed by the crew). */
  room: string;
  priority: Priority;
  kind: Kind;
  jesse?: string | undefined;
  duane?: string | undefined;
  brad?: string | undefined;
  goal?: string | undefined;
  release?: string | undefined;
  minors?: boolean | undefined;
  incomplete?: boolean | undefined;
  /** This block is itself a move/transit block. */
  move?: boolean | undefined;
  /** Soft timing — start/end are approximate. */
  soft?: boolean | undefined;
  commit: Commit;
}

/** A revertible operational override of an official value. */
export interface FieldChange {
  id: string;
  itemId: string;
  field: string;
  officialValue: string;
  currentValue: string;
  editor: CrewId;
  at: number;
  reason: string;
  reverted?: boolean | undefined;
}

export interface LogEntry {
  id: string;
  itemId?: string | undefined;
  kind:
    | "status"
    | "change"
    | "ops"
    | "reassign"
    | "interview"
    | "release"
    | "gear"
    | "note";
  text: string;
  editor: CrewId;
  at: number;
}

export interface CrewPosition {
  room: string;
  at: number;
  manual: boolean;
}

export interface CrewState {
  statuses: Record<string, Status>;
  changes: FieldChange[];
  log: LogEntry[];
  positions: { [K in CrewId]?: CrewPosition | undefined };
  notes: Record<string, string>;
}

export const EMPTY_CREW_STATE: CrewState = {
  statuses: {},
  changes: [],
  log: [],
  positions: {},
  notes: {},
};

export interface CrewMember {
  id: CrewId;
  name: string;
  role: string;
  owns: string;
  building: string;
}

export const CREW: CrewMember[] = [
  {
    id: "jesse",
    name: "Jesse Cudworth",
    role: "Lead cinematographer",
    owns: "Camera & technical feasibility",
    building: "Element",
  },
  {
    id: "duane",
    name: "Duane Mantey",
    role: "Documentary lead",
    owns: "Story priority",
    building: "JW Marriott",
  },
  {
    id: "brad",
    name: "Brad",
    role: "Operations",
    owns: "Logistics, changes, interviews, releases",
    building: "Home2",
  },
];

export const CREW_IDS: CrewId[] = ["jesse", "duane", "brad"];