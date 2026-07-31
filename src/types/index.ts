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
    | "shot"
    | "card"
    | "release"
    | "gear"
    | "note";
  text: string;
  editor: CrewId;
  at: number;
  meta?: Record<string, string> | undefined;
}

export const LOG_KINDS = [
  "status",
  "change",
  "reassign",
  "ops",
  "interview",
  "shot",
  "release",
  "gear",
  "card",
  "note",
] as const;

export type LogKind = (typeof LOG_KINDS)[number];

/* ------------------------------- interviews ------------------------------ */

export const ACCESS_STATUSES = [
  "Unconfirmed",
  "Requested",
  "Confirmed",
  "Complete",
] as const;
export type AccessStatus = (typeof ACCESS_STATUSES)[number];

export const RELEASE_STATUSES = [
  "Not Needed",
  "Needed",
  "Signed",
  "Restricted",
  "Declined",
] as const;
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number];

export const INTERVIEW_STATUSES = [
  "Target",
  "Scheduled",
  "Recording",
  "Recorded",
  "Dropped",
] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export interface Interview {
  id: string;
  priority: Priority;
  target: string;
  angle: string;
  window: string;
  location: string;
  owner: CrewId;
  access: AccessStatus;
  release: ReleaseStatus;
  status: InterviewStatus;
  contact: string;
  notes: string;
  fileRef: string;
  restrictions: string[];
  itemId?: string | undefined;
  /** epoch ms when the running timer started, null when stopped */
  runningSince: number | null;
  elapsedMs: number;
  updatedAt: number;
}

/* ------------------------------ gear / media ----------------------------- */

export const CARD_STATES = [
  "Empty",
  "Active",
  "Used",
  "Copy 1 Verified",
  "Copy 2 Verified",
  "Safe to Reformat",
] as const;
export type CardState = (typeof CARD_STATES)[number];

export interface MediaCard {
  id: string;
  cardId: string;
  holder: CrewId;
  state: CardState;
  note: string;
  updatedAt: number;
}

/** Two verified copies are the only path to reformat. Enforced here. */
export function canSetCardState(from: CardState, to: CardState): boolean {
  if (to === "Safe to Reformat") return from === "Copy 2 Verified";
  if (to === "Copy 2 Verified") return from === "Copy 1 Verified" || from === "Copy 2 Verified";
  if (to === "Copy 1 Verified") return from === "Used" || from === "Copy 1 Verified" || from === "Copy 2 Verified";
  return true;
}

export interface GearIssue {
  id: string;
  kind: "battery" | "camera" | "audio" | "other";
  text: string;
  holder: CrewId;
  at: number;
  resolved: boolean;
}

/* ---------------------------------- wrap --------------------------------- */

export interface WrapDay {
  checks: Record<string, boolean>;
  nextCall: string;
  firstAssignment: string;
  notes: string;
}

export type SyncState = "local" | "syncing" | "synced" | "conflict";

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
  interviews: Interview[];
  cards: MediaCard[];
  gear: GearIssue[];
  wrap: Record<string, WrapDay>;
  /** edits made while offline that a cloud backend has not accepted yet */
  queue: { id: string; at: number; summary: string }[];
}

export const EMPTY_CREW_STATE: CrewState = {
  statuses: {},
  changes: [],
  log: [],
  positions: {},
  notes: {},
  interviews: [],
  cards: [],
  gear: [],
  wrap: {},
  queue: [],
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