import type { Commit, Priority, ScheduleItem } from "@/types";

/**
 * Seed schedule. Adding a day = append more rows with a new `date`.
 * `commit` flags mark REAL commitments; advisory lines stay false so they
 * never raise conflicts.
 */

interface Row {
  date: string;
  start: number;
  end: number;
  title: string;
  room: string;
  priority: Priority;
  kind?: "official" | "crew";
  presenter?: string;
  jesse?: string;
  duane?: string;
  brad?: string;
  goal?: string;
  release?: string;
  minors?: boolean;
  move?: boolean;
  soft?: boolean;
  incomplete?: boolean;
  commit?: Partial<Commit>;
}

function hm(h: number, m: number): number {
  return h * 60 + m;
}

function label(min: number): string {
  const h24 = Math.floor(min / 60);
  const mm = min % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

const ROWS: Row[] = [
  {
    date: "2026-07-31",
    start: hm(8, 0),
    end: hm(9, 0),
    room: "Element to Westin",
    priority: "MUST",
    kind: "crew",
    move: true,
    title:
      "Crew prep: Jesse breakfast, gear check, walk to Westin; verify credentials and filming restrictions",
    jesse: "Full kit ready; confirm access",
    goal: "Ready-to-shoot kit; organizer contact confirmed",
    commit: { jesse: true },
  },
  {
    date: "2026-07-31",
    start: hm(9, 0),
    end: hm(10, 30),
    room: "Promenade",
    priority: "MUST",
    title: "Registration & Badge Pickup (2nd level promenade)",
    jesse: "Primary coverage: signage, arrivals, vendors, crowd",
    goal: "Opening montage + venue establishing shots",
    release: "General crowd coverage",
    commit: { jesse: true },
  },
  {
    date: "2026-07-31",
    start: hm(10, 30),
    end: hm(11, 0),
    room: "Main Stage",
    priority: "MUST",
    title: "Welcome Remarks",
    presenter: "Hakim Isler, Anne Palmer",
    jesse: "Clean stage + audience reactions",
    goal: "Event framing and founder remarks",
    release: "Track Hakim interview opportunity",
    commit: { jesse: true },
  },
  {
    date: "2026-07-31",
    start: hm(11, 0),
    end: hm(11, 45),
    room: "Main Stage",
    priority: "HIGH",
    title:
      "Keynote: From Practice to Theory: What Psi Reveals About the Nature of Reality",
    presenter: "Dr. Simon Duan",
    jesse: "Approved stage coverage + transitions",
    commit: { jesse: true },
  },
  {
    date: "2026-07-31",
    start: hm(11, 45),
    end: hm(12, 30),
    room: "Main Stage",
    priority: "HIGH",
    title: "Keynote Fireside Chat",
    presenter: "Anne Palmer + Laura Lynne Jackson",
    jesse: "Stage, audience, entrances/exits",
    commit: { jesse: true },
  },
  {
    date: "2026-07-31",
    start: hm(12, 30),
    end: hm(13, 15),
    room: "Main Stage",
    priority: "HIGH",
    title: "Presentation",
    presenter: "Thomas Campbell",
    jesse: "Recommended primary room",
  },
  {
    date: "2026-07-31",
    start: hm(12, 30),
    end: hm(13, 15),
    room: "Tryon",
    priority: "BACKUP",
    title: "The Science Behind Energy Healing: From Practice to the Lab",
    presenter: "John Kruth",
    jesse: "Cover only if story/access outweighs Main Stage",
  },
  {
    date: "2026-07-31",
    start: hm(12, 30),
    end: hm(13, 15),
    room: "Harris",
    priority: "OPTIONAL",
    title:
      "Born Already Perceiving: What Children Know Before the World Teaches Them to Doubt It",
    presenter: "Dr. Iya Whiteley",
    minors: true,
  },
  {
    date: "2026-07-31",
    start: hm(12, 30),
    end: hm(13, 15),
    room: "Trade",
    priority: "OPTIONAL",
    title: "Behind the Curtain: Lessons from Practical Remote Viewing Work",
    presenter: "Jana Rogge",
  },
  {
    date: "2026-07-31",
    start: hm(15, 30),
    end: hm(16, 15),
    room: "Main Stage",
    priority: "MUST",
    title: "Presentation",
    presenter: "Chris Bledsoe",
    jesse: "Primary professional coverage",
    duane: "Story observation; potential follow-up",
    brad: "Audience reactions + names/timing",
    goal: "High-value speaker anchor",
    commit: { jesse: true, brad: true },
  },
  {
    date: "2026-07-31",
    start: hm(18, 0),
    end: hm(18, 30),
    room: "Main Stage",
    priority: "HIGH",
    title: "Kids Panel: Next Generation of Psioneers",
    presenter:
      "Nicola Farmer, Theo Kowalski, Dalbus Jordan, Axel Desbien, Nikhila Mhetre",
    minors: true,
    brad: "Primary backup coverage; track guardian releases",
    release: "Guardian release required for minors",
    commit: { brad: true },
  },
  {
    date: "2026-07-31",
    start: hm(18, 0),
    end: hm(18, 30),
    room: "Trade",
    priority: "MUST",
    title: "The Magic of Plasma & Consciousness",
    presenter: "Dana Kippel",
    jesse: "Recommended primary coverage",
    duane: "Interview / relationship priority",
    goal: "Priority Dana Kippel session + interview lead",
    commit: { jesse: true, duane: true },
  },
  {
    date: "2026-07-31",
    start: hm(18, 30),
    end: hm(20, 0),
    room: "Main Stage",
    priority: "MUST",
    title: "COMMUNITY EVENT: Superhuman 2 Film Screening + Panel Discussion",
    jesse: "Permitted screening/panel coverage",
    commit: { jesse: true },
  },
];

export const SCHEDULE: ScheduleItem[] = ROWS.map((row, index) => ({
  id: `${row.date}-${String(index + 1).padStart(2, "0")}`,
  date: row.date,
  startMin: row.start,
  endMin: row.end,
  startLabel: label(row.start),
  endLabel: label(row.end),
  title: row.title,
  presenter: row.presenter,
  roomOfficial: row.room,
  room: row.room,
  priority: row.priority,
  kind: row.kind ?? "official",
  jesse: row.jesse,
  duane: row.duane,
  brad: row.brad,
  goal: row.goal,
  release: row.release,
  minors: row.minors,
  incomplete: row.incomplete,
  move: row.move,
  soft: row.soft,
  commit: {
    jesse: row.commit?.jesse ?? false,
    duane: row.commit?.duane ?? false,
    brad: row.commit?.brad ?? false,
  },
}));