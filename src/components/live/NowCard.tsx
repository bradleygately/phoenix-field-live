import { Panel, PriorityPill, RoomPill } from "@/components/primitives";
import { cn } from "@/lib/utils";
import { formatCountdown } from "@/lib/time";
import { CREW, type CrewId, type ScheduleItem, type Status } from "@/types";

export function NowCard({
  item,
  role,
  min,
  seconds,
  status,
}: {
  item: ScheduleItem;
  role: CrewId;
  min: number;
  seconds: number;
  status: Status;
}) {
  const totalSec = (item.endMin - item.startMin) * 60;
  const elapsedSec = (min - item.startMin) * 60 + seconds;
  const remainingSec = totalSec - elapsedSec;
  const progress = Math.max(0, Math.min(100, (elapsedSec / totalSec) * 100));
  const urgent = remainingSec < 5 * 60;
  const overdue =
    item.priority === "MUST" && status === "Pending" && min - item.startMin > 5;
  const changedRoom = item.room !== item.roomOfficial;

  return (
    <Panel tone={overdue ? "alert" : "gold"} className="space-y-3">
      {overdue && (
        <p className="num rounded border border-destructive px-2 py-1 text-[11px] font-bold text-destructive">
          OVERDUE · MUST item running {min - item.startMin}m and still Pending
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityPill priority={item.priority} />
        <RoomPill room={item.room} changed={changedRoom} />
        <span className="num text-[11px] text-muted-foreground">
          {item.startLabel} – {item.endLabel}
        </span>
      </div>

      <div>
        <div
          className={cn(
            "num text-[44px] leading-none font-bold tabular-nums",
            urgent ? "text-destructive" : "text-foreground",
          )}
        >
          {formatCountdown(remainingSec)}
        </div>
        <p className="num mt-1 text-[10px] tracking-wide text-muted-foreground uppercase">
          {remainingSec < 0 ? "over by" : "left in block"}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full", urgent ? "bg-destructive" : "bg-primary")}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div>
        <h1 className="text-base leading-snug font-semibold">{item.title}</h1>
        {item.presenter && (
          <p className="mt-0.5 text-xs text-muted-foreground">{item.presenter}</p>
        )}
        {changedRoom && (
          <p className="num mt-1 text-[10px] text-primary">
            Official room: {item.roomOfficial}
          </p>
        )}
      </div>

      {item.goal && (
        <p className="rounded border border-border bg-secondary px-2 py-1.5 text-xs">
          <span className="num text-[10px] tracking-wide text-muted-foreground uppercase">
            Goal ·{" "}
          </span>
          {item.goal}
        </p>
      )}

      <ul className="space-y-1">
        {CREW.map((member) => {
          const text = item[member.id];
          const committed = item.commit[member.id];
          return (
            <li
              key={member.id}
              className={cn(
                "flex gap-2 rounded border px-2 py-1 text-[11px]",
                member.id === role
                  ? "border-primary bg-secondary"
                  : "border-transparent bg-secondary/40",
              )}
            >
              <span className="num w-12 shrink-0 font-semibold text-muted-foreground uppercase">
                {member.id}
              </span>
              <span className="min-w-0 flex-1">
                {text ?? "—"}
                {text && !committed && (
                  <span className="num ml-1 text-[9px] text-muted-foreground">
                    (advisory)
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      <p
        className={cn(
          "num rounded border px-2 py-1 text-[11px]",
          item.minors && !item.release
            ? "border-destructive text-destructive"
            : "border-border text-muted-foreground",
        )}
      >
        Release: {item.release ?? (item.minors ? "MISSING — minors on camera" : "None recorded")}
      </p>
    </Panel>
  );
}