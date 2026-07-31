import { inferCommitment } from "./commit-inference";
import { FRIDAY, SATURDAY, SUNDAY } from "./schedule-source";
import type { Priority, ScheduleItem } from "@/types";

function label(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

const OPEN_END = 1440;

function meridiemOf(token: string): "am" | "pm" | null {
  const m = token.match(/\b(am|pm)\b/i);
  return m ? (m[1]!.toLowerCase() as "am" | "pm") : null;
}

function parseClock(token: string, inherit: "am" | "pm" | null): number | null {
  const t = token.trim();
  if (/^open$/i.test(t)) return null;
  if (/^midnight$/i.test(t)) return 1440;
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  const mm = Number(m[2]);
  const mer = meridiemOf(t) ?? inherit;
  if (mer === "pm") h += 12;
  return h * 60 + mm;
}

export function parseRange(raw: string): { start: number; end: number; soft: boolean } {
  const [leftRaw = "", rightRaw = ""] = raw.split("-");
  const rightMer = meridiemOf(rightRaw);
  const leftMer = meridiemOf(leftRaw);
  let start = parseClock(leftRaw, leftMer ?? rightMer) ?? 0;
  const open = /^\s*open\s*$/i.test(rightRaw);
  let end = parseClock(rightRaw, rightMer ?? leftMer);
  if (end === null) end = start >= OPEN_END ? start + 60 : OPEN_END;
  if (!leftMer && end < start) start -= 720;
  if (end <= start) end = start + 30;
  return { start, end, soft: open };
}

function cell(value: string | undefined): string | undefined {
  const v = (value ?? "").trim();
  if (!v || v === "—" || v === "-" || v.toUpperCase() === "N/A") return undefined;
  return v;
}

function splitPresenter(session: string): { title: string; presenter?: string } {
  if (/incomplete/i.test(session)) return { title: session };
  const idx = session.lastIndexOf(" — ");
  if (idx === -1) return { title: session };
  return {
    title: session.slice(0, idx).trim(),
    presenter: session.slice(idx + 3).trim(),
  };
}

const PRIORITIES: Priority[] = ["MUST", "HIGH", "OPTIONAL", "BACKUP"];

function parseDay(date: string, block: string): ScheduleItem[] {
  return block
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split("|").map((p) => p.trim());
      const [range = "", room = "", priorityRaw = "", session = ""] = parts;
      const { start, end, soft } = parseRange(range);
      const { title, presenter } = splitPresenter(session);
      const priority = (
        PRIORITIES.includes(priorityRaw as Priority) ? priorityRaw : "OPTIONAL"
      ) as Priority;
      const jesse = cell(parts[4]);
      const duane = cell(parts[5]);
      const brad = cell(parts[6]);
      const goal = cell(parts[7]);
      const release = cell(parts[8]);
      const haystack = `${title} ${release ?? ""} ${brad ?? ""}`.toLowerCase();
      return {
        id: `${date}-${String(index + 1).padStart(2, "0")}`,
        date,
        startMin: start,
        endMin: end,
        startLabel: label(start),
        endLabel: soft ? "open" : label(end),
        title,
        presenter,
        roomOfficial: room,
        room,
        priority,
        kind: "official" as const,
        jesse,
        duane,
        brad,
        goal,
        release,
        minors: /child|kids|minor|guardian/.test(haystack) || undefined,
        incomplete: /incomplete/i.test(session) || undefined,
        move: (room.includes("→") || / to /i.test(room)) || undefined,
        soft: soft || undefined,
        commit: {
          jesse: inferCommitment(jesse),
          duane: inferCommitment(duane),
          brad: inferCommitment(brad),
        },
      } satisfies ScheduleItem;
    });
}

export const SCHEDULE: ScheduleItem[] = [
  ...parseDay("2026-07-31", FRIDAY),
  ...parseDay("2026-08-01", SATURDAY),
  ...parseDay("2026-08-02", SUNDAY),
];