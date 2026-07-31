import { useEffect, useState } from "react";

import { PhoenixMark } from "./primitives";
import { DAY_LABELS } from "@/lib/time";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useStore } from "@/state/store";

export function AppHeader() {
  const { now, simOffsetMs } = useStore();
  const { resolved, toggle } = useTheme();
  const dayLabel = DAY_LABELS[now.date] ?? now.weekday;
  // The clock ticks every second, so server HTML can never match the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b backdrop-blur transition-colors duration-700",
        now.isDay
          ? "border-gold/40 bg-surface-2/95"
          : "border-border bg-background/95",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <PhoenixMark />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "num truncate text-[13px] font-bold tracking-widest",
                now.isDay ? "text-gold-bright" : "text-foreground",
              )}
            >
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
        <span
          className={cn(
            "num shrink-0 text-base font-semibold tabular-nums transition-colors duration-700",
            now.isDay ? "text-gold-bright" : "text-foreground",
          )}
        >
          {mounted ? now.clock : ""}
        </span>
        <button
          type="button"
          onClick={toggle}
          aria-label={
            resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          className="tap -mr-1 flex shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-foreground"
        >
          <span aria-hidden="true" className="text-base leading-none">
            {mounted ? (resolved === "dark" ? "☀" : "☾") : "☾"}
          </span>
        </button>
      </div>
    </header>
  );
}