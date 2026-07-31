import type { CrewId, ScheduleItem } from "@/types";
import { CREW_IDS } from "@/types";

export type CrewFilter = "all" | CrewId;

export const CREW_LABEL: Record<CrewId, string> = {
  jesse: "Jesse",
  duane: "Duane",
  brad: "Brad",
};

/** Crew named on an item (committed or advisory). */
export function assignedCrew(item: ScheduleItem): CrewId[] {
  return CREW_IDS.filter((id) => Boolean(item[id]));
}

export function matchesCrew(item: ScheduleItem, filter: CrewFilter): boolean {
  return filter === "all" ? true : Boolean(item[filter]);
}

/** One-line responsibility/coverage note for the agenda row. */
export function coverageNote(item: ScheduleItem, filter: CrewFilter): string {
  if (filter !== "all" && item[filter]) return item[filter]!;
  if (item.goal) return item.goal;
  const first = assignedCrew(item)[0];
  if (first && item[first]) return `${CREW_LABEL[first]}: ${item[first]}`;
  return "No coverage assigned";
}
