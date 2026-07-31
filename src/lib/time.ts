const ET = "America/New_York";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: ET,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
});

export interface CharlotteNow {
  /** minutes from midnight, Charlotte wall clock */
  min: number;
  seconds: number;
  /** "2026-07-31" */
  date: string;
  weekday: string;
  clock: string;
}

/** Charlotte wall-clock derived only from Intl parts — never device tz math. */
export function charlotteNow(epochMs: number): CharlotteNow {
  const parts = partsFormatter.formatToParts(new Date(epochMs));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  const second = Number(get("second"));
  return {
    min: hour * 60 + minute,
    seconds: second,
    date: `${get("year")}-${get("month")}-${get("day")}`,
    weekday: parts.find((p) => p.type === "weekday")?.value ?? "",
    clock: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(
      second,
    ).padStart(2, "0")}`,
  };
}

/** 610 -> "10:10 AM" */
export function formatMin(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

/** "10:10 AM" -> 610 */
export function parseTimeInput(value: string): number | null {
  const m = value.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (min > 59) return null;
  const suffix = m[3]?.toLowerCase();
  if (suffix === "pm" && h < 12) h += 12;
  if (suffix === "am" && h === 12) h = 0;
  if (h > 23) return null;
  return h * 60 + min;
}

/** 13 -> "13m", 95 -> "1h 35m", -4 -> "-4m" */
export function formatDuration(mins: number): string {
  const sign = mins < 0 ? "-" : "";
  const a = Math.abs(mins);
  const h = Math.floor(a / 60);
  const m = a % 60;
  return h > 0 ? `${sign}${h}h ${m}m` : `${sign}${m}m`;
}

/** mm:ss countdown from a signed second count. */
export function formatCountdown(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? "-" : "";
  const a = Math.abs(Math.floor(totalSeconds));
  const h = Math.floor(a / 3600);
  const m = Math.floor((a % 3600) / 60);
  const s = a % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${sign}${h}:${pad(m)}:${pad(s)}` : `${sign}${pad(m)}:${pad(s)}`;
}

export const DAY_LABELS: Record<string, string> = {
  "2026-07-31": "Day 1 · Friday",
  "2026-08-01": "Day 2 · Saturday",
  "2026-08-02": "Day 3 · Sunday",
};

export const EVENT_DATES = ["2026-07-31", "2026-08-01", "2026-08-02"];

/** Simulator offset: ms added to real time, plus jump-to-time support. */
export function offsetForTargetMin(
  realEpochMs: number,
  targetMin: number,
  targetDate?: string,
): number {
  const now = charlotteNow(realEpochMs);
  let deltaMin = targetMin - now.min;
  if (targetDate && targetDate !== now.date) {
    const dayDelta =
      (Date.parse(`${targetDate}T00:00:00Z`) - Date.parse(`${now.date}T00:00:00Z`)) /
      86400000;
    deltaMin += dayDelta * 1440;
  }
  return deltaMin * 60000 - now.seconds * 1000;
}