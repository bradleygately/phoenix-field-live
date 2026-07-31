import { estimateTravel, resolveDestination, type TravelEstimate } from "./travel";
import type { TravelSettings } from "./settings";
import type { CrewId, CrewState, ScheduleItem } from "@/types";

export const MANUAL_POSITION_TTL_MS = 90 * 60 * 1000;

const PRIORITY_RANK: Record<ScheduleItem["priority"], number> = {
  MUST: 0,
  HIGH: 1,
  OPTIONAL: 2,
  BACKUP: 3,
};

export function assignmentFor(item: ScheduleItem, role: CrewId): string | undefined {
  return item[role];
}

export function isCommitted(item: ScheduleItem, role: CrewId): boolean {
  return item.commit[role] === true;
}

export function itemsForDate(schedule: ScheduleItem[], date: string): ScheduleItem[] {
  return schedule
    .filter((i) => i.date === date)
    .sort((a, b) => a.startMin - b.startMin || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
}

export function runningNow(items: ScheduleItem[], min: number): ScheduleItem[] {
  return items.filter((i) => min >= i.startMin && min < i.endMin);
}

/** Up to five rooms run at once — choose one lead item for the NOW card. */
export function pickLead(items: ScheduleItem[], role: CrewId): ScheduleItem | null {
  if (items.length === 0) return null;
  const sorted = [...items].sort((a, b) => {
    const aMine = isCommitted(a, role) ? 0 : a[role] ? 1 : 2;
    const bMine = isCommitted(b, role) ? 0 : b[role] ? 1 : 2;
    if (aMine !== bMine) return aMine - bMine;
    const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (p !== 0) return p;
    return a.startMin - b.startMin;
  });
  return sorted[0] ?? null;
}

export function nextItem(items: ScheduleItem[], min: number): ScheduleItem | null {
  return items.find((i) => i.startMin > min) ?? null;
}

export function nextForRole(
  items: ScheduleItem[],
  role: CrewId,
  min: number,
  count = 3,
): ScheduleItem[] {
  return items
    .filter((i) => i.endMin > min && (isCommitted(i, role) || Boolean(i[role])))
    .slice(0, count);
}

/** Manual positions win for 90 minutes; otherwise infer from the schedule. */
export function positionOf(
  crew: CrewState,
  who: CrewId,
  items: ScheduleItem[],
  min: number,
  nowMs: number,
): { room: string; task: string; source: "manual" | "schedule" | "unknown" } {
  const manual = crew.positions[who];
  if (manual && manual.manual && nowMs - manual.at < MANUAL_POSITION_TTL_MS) {
    return { room: manual.room, task: "Manually set", source: "manual" };
  }
  const running = runningNow(items, min).filter(
    (i) => isCommitted(i, who) || Boolean(i[who]),
  );
  const lead = pickLead(running, who);
  if (lead) {
    return {
      room: lead.move ? resolveDestination(lead.room).label : lead.room,
      task: lead[who] ?? lead.title,
      source: "schedule",
    };
  }
  return { room: "Unknown", task: "No assigned block", source: "unknown" };
}

export interface LeaveByPlan {
  target: ScheduleItem;
  fromRoom: string;
  estimate: TravelEstimate;
  leaveByMin: number;
}

/** Next assigned item in a different room, with travel + setup. */
export function computeLeaveBy(
  items: ScheduleItem[],
  role: CrewId,
  currentRoom: string,
  min: number,
  settings: TravelSettings,
): LeaveByPlan | null {
  const upcoming = items.filter(
    (i) => i.startMin > min && (isCommitted(i, role) || Boolean(i[role])),
  );
  for (const target of upcoming) {
    const destination = target.move
      ? resolveDestination(target.room).label
      : target.room;
    if (destination.toLowerCase() === currentRoom.toLowerCase()) continue;
    const estimate = estimateTravel(currentRoom, destination, {
      carryingRig: role === "jesse",
      setup: role === "jesse" ? "fullRig" : "runGun",
      teardown: true,
      settings,
    });
    return {
      target,
      fromRoom: currentRoom,
      estimate,
      leaveByMin: target.startMin - estimate.minutes,
    };
  }
  return null;
}

export interface Warning {
  id: string;
  level: "critical" | "warn";
  text: string;
  itemId?: string;
}

/** Only real commitments raise conflicts — advisory lines are options. */
export function computeWarnings(
  items: ScheduleItem[],
  crew: CrewState,
  min: number,
  settings: TravelSettings,
): Warning[] {
  const warnings: Warning[] = [];
  const roles: CrewId[] = ["jesse", "duane", "brad"];

  for (const role of roles) {
    const committed = items.filter((i) => isCommitted(i, role));
    for (let a = 0; a < committed.length; a += 1) {
      const first = committed[a]!;
      for (let b = a + 1; b < committed.length; b += 1) {
        const second = committed[b]!;
        if (second.startMin >= first.endMin) {
          const from = first.move ? resolveDestination(first.room).label : first.room;
          const to = second.move
            ? resolveDestination(second.room).label
            : second.room;
          if (from.toLowerCase() === to.toLowerCase()) continue;
          const est = estimateTravel(from, to, {
            carryingRig: role === "jesse",
            setup: role === "jesse" ? "fullRig" : "runGun",
            teardown: true,
            settings,
          });
          if (second.startMin - first.endMin < est.minutes) {
            warnings.push({
              id: `travel-${role}-${first.id}-${second.id}`,
              level: "critical",
              itemId: second.id,
              text: `${cap(role)} cannot make ${to} by ${second.startLabel} — needs ${est.minutes}m from ${from}, has ${second.startMin - first.endMin}m`,
            });
          }
          break;
        }
        warnings.push({
          id: `overlap-${role}-${first.id}-${second.id}`,
          level: "critical",
          itemId: second.id,
          text: `${cap(role)} double-booked: "${first.title}" and "${second.title}"`,
        });
      }
    }
  }

  for (const item of items) {
    if (item.minors && !item.release) {
      warnings.push({
        id: `minors-${item.id}`,
        level: "critical",
        itemId: item.id,
        text: `Minors on camera in ${item.room} (${item.startLabel}) — guardian release not recorded`,
      });
    }
    const status = crew.statuses[item.id] ?? "Pending";
    if (
      item.priority === "MUST" &&
      status === "Pending" &&
      min > item.startMin + 5 &&
      min < item.endMin + 60
    ) {
      warnings.push({
        id: `overdue-${item.id}`,
        level: "warn",
        itemId: item.id,
        text: `MUST item still Pending ${min - item.startMin}m after start: ${item.title}`,
      });
    }
  }

  return warnings;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}