import { Link } from "@tanstack/react-router";
import { AlertTriangle, Menu } from "lucide-react";

import { PhoenixMark } from "./primitives";
import { cn } from "@/lib/utils";
import { DAY_LABELS } from "@/lib/time";
import { useStore } from "@/state/store";
import { CREW_IDS, type CrewId } from "@/types";

const SHORT: Record<CrewId, string> = { jesse: "Jesse", duane: "Duane", brad: "Brad" };

export function AppHeader({
  warningCount = 0,
  onWarnings,
}: {
  warningCount?: number | undefined;
  onWarnings?: (() => void) | undefined;
}) {
  const { now, role, setRole, simOffsetMs, ready } = useStore();
  const dayLabel = DAY_LABELS[now.date] ?? now.weekday;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex items-center gap-2 px-3 pt-2 pb-1">
        <PhoenixMark />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="num truncate text-[13px] font-bold tracking-widest">
              PSI GAMES LIVE
            </span>
            {simOffsetMs !== 0 && (
              <span className="num rounded border border-primary px-1 text-[9px] font-bold text-primary">
                SIM
              </span>
            )}
          </div>
          <p className="truncate text-[10px] text-muted-foreground">
            Mojo Phoenix · {dayLabel}
          </p>
        </div>
        <span className="num text-sm font-semibold tabular-nums">{now.clock}</span>
        <button
          type="button"
          onClick={onWarnings}
          aria-label={`${warningCount} warnings`}
          className={cn(
            "num flex h-9 items-center gap-1 rounded-md border px-2 text-xs font-bold",
            warningCount > 0
              ? "border-destructive text-destructive"
              : "border-border text-muted-foreground",
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {warningCount}
        </button>
        <Link
          to="/settings"
          aria-label="Settings and import/export"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground"
        >
          <Menu className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex items-center gap-1 px-3 pb-2">
        {CREW_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setRole(id)}
            className={cn(
              "h-8 flex-1 rounded-md border text-xs font-semibold",
              role === id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-muted-foreground",
            )}
          >
            {SHORT[id]}
          </button>
        ))}
        <span
          className={cn(
            "num ml-1 rounded border px-1.5 py-1 text-[9px] font-semibold tracking-wide uppercase",
            ready ? "border-ok text-ok" : "border-border text-muted-foreground",
          )}
        >
          {ready ? "Local ✓" : "Loading"}
        </span>
      </div>
    </header>
  );
}