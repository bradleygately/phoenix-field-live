import { PhoenixMark } from "./primitives";
import { DAY_LABELS } from "@/lib/time";
import { useStore } from "@/state/store";

export function AppHeader() {
  const { now, simOffsetMs } = useStore();
  const dayLabel = DAY_LABELS[now.date] ?? now.weekday;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex items-center gap-2 px-3 py-2">
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
        <span className="num shrink-0 text-base font-semibold tabular-nums">
          {now.clock}
        </span>
      </div>
    </header>
  );
}