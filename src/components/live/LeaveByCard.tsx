import { Panel, SectionLabel } from "@/components/primitives";
import { cn } from "@/lib/utils";
import { formatMin } from "@/lib/time";
import type { LeaveByPlan } from "@/lib/live";

export function LeaveByCard({
  plan,
  min,
  seconds,
}: {
  plan: LeaveByPlan;
  min: number;
  seconds: number;
}) {
  const remainingSec = (plan.leaveByMin - min) * 60 - seconds;
  const remainingMin = Math.floor(remainingSec / 60);
  const late = remainingSec < 0;
  const soon = !late && remainingSec <= 5 * 60;

  return (
    <Panel tone={late ? "alert" : soon ? "gold" : "default"} className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <SectionLabel>Leave by</SectionLabel>
        <span className="num text-lg font-bold">{formatMin(plan.leaveByMin)}</span>
      </div>

      <div
        className={cn(
          "num text-2xl font-bold",
          late ? "text-destructive" : soon ? "text-primary" : "text-foreground",
        )}
      >
        {late
          ? `LEAVE NOW · ${Math.abs(remainingMin) || 1}m LATE`
          : `LEAVE IN ${remainingMin}m`}
      </div>

      <p className="text-xs">
        <span className="text-muted-foreground">{plan.fromRoom} → </span>
        <span className="font-semibold">{plan.estimate.to.label}</span>
        <span className="text-muted-foreground">
          {" "}
          for {plan.target.startLabel} · {plan.target.title}
        </span>
      </p>

      <ul className="num space-y-0.5 border-t border-border pt-2 text-[11px] text-muted-foreground">
        {plan.estimate.breakdown.map((leg, i) => (
          <li key={`${leg.label}-${i}`} className="flex justify-between gap-2">
            <span className="truncate">{leg.label}</span>
            <span className="tabular-nums">{leg.minutes.toFixed(1)}m</span>
          </li>
        ))}
        <li className="flex justify-between gap-2 border-t border-border pt-1 font-bold text-foreground">
          <span>Total</span>
          <span className="tabular-nums">{plan.estimate.minutes}m</span>
        </li>
      </ul>
    </Panel>
  );
}