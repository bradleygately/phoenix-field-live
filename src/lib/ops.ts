import { estimateTravel } from "./travel";
import type { TravelSettings } from "./settings";
import type { CrewId, ScheduleItem } from "@/types";

export interface OpsOption {
  id: string;
  label: string;
  room: string;
  priority: ScheduleItem["priority"];
  startLabel: string;
  travelMinutes: number;
  minutesUntil: number;
  feasible: boolean;
  score: number;
  why: string[];
}

export interface OpsDecision {
  recommended: OpsOption | null;
  options: OpsOption[];
  /** Ordered, human-readable rationale for the recommendation. */
  rationale: string[];
}

const PRIORITY_SCORE: Record<ScheduleItem["priority"], number> = {
  MUST: 100,
  HIGH: 60,
  OPTIONAL: 25,
  BACKUP: 10,
};

/**
 * Deterministic: same inputs always produce the same recommendation.
 * Rules, in order — story priority, camera feasibility, then logistics cost.
 */
export function decide(input: {
  candidates: ScheduleItem[];
  role: CrewId;
  fromRoom: string;
  min: number;
  settings: TravelSettings;
}): OpsDecision {
  const { candidates, role, fromRoom, min, settings } = input;

  const options: OpsOption[] = candidates.map((item) => {
    const est = estimateTravel(fromRoom, item.room, {
      carryingRig: role === "jesse",
      setup: role === "jesse" ? "fullRig" : "runGun",
      teardown: true,
      settings,
    });
    const minutesUntil = item.startMin - min;
    const slack = minutesUntil - est.minutes;
    const feasible = slack >= 0 || min >= item.startMin;
    const why: string[] = [];

    let score = PRIORITY_SCORE[item.priority];
    why.push(`${item.priority} priority (+${PRIORITY_SCORE[item.priority]})`);

    if (item.commit[role]) {
      score += 30;
      why.push("already a real commitment for you (+30)");
    } else if (item[role]) {
      why.push("advisory only — not a commitment (+0)");
    }

    if (!feasible) {
      score -= 80;
      why.push(`cannot arrive in time: needs ${est.minutes}m, has ${minutesUntil}m (-80)`);
    } else if (slack < 5) {
      score -= 15;
      why.push(`tight arrival, ${slack}m slack (-15)`);
    } else {
      why.push(`${slack}m slack after travel`);
    }

    const cost = Math.min(30, est.minutes);
    score -= cost;
    why.push(`travel + setup cost ${est.minutes}m (-${cost})`);

    if (item.incomplete) {
      score -= 10;
      why.push("official listing incomplete — verify room with Brad (-10)");
    }
    if (item.minors && !item.release) {
      score -= 25;
      why.push("minors on camera without a recorded guardian release (-25)");
    }

    return {
      id: item.id,
      label: item.title,
      room: item.room,
      priority: item.priority,
      startLabel: item.startLabel,
      travelMinutes: est.minutes,
      minutesUntil,
      feasible,
      score,
      why,
    };
  });

  // Deterministic tie-breaks: score, then earliest start, then id.
  const sorted = [...options].sort(
    (a, b) =>
      b.score - a.score || a.minutesUntil - b.minutesUntil || a.id.localeCompare(b.id),
  );
  const recommended = sorted[0] ?? null;

  const rationale = recommended
    ? [
        `Take: ${recommended.label} (${recommended.room}, ${recommended.startLabel}).`,
        ...recommended.why,
        sorted[1]
          ? `Drop first: ${sorted[sorted.length - 1]!.label} — lowest score (${sorted[sorted.length - 1]!.score}).`
          : "Only one viable option.",
      ]
    : ["No candidate blocks selected."];

  return { recommended, options: sorted, rationale };
}