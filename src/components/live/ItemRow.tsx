import { PriorityPill, RoomPill, StatusChip, TapButton } from "@/components/primitives";
import { cn } from "@/lib/utils";
import type { CrewId, ScheduleItem, Status } from "@/types";

export function ItemRow({
  item,
  role,
  status,
  onStatus,
  compact,
}: {
  item: ScheduleItem;
  role: CrewId;
  status: Status;
  onStatus: (status: Status) => void;
  compact?: boolean;
}) {
  const assignment = item[role];
  const committed = item.commit[role];

  return (
    <li
      className={cn(
        "rounded-lg border border-border bg-card p-2.5",
        status === "Complete" && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="num text-[11px] font-semibold text-muted-foreground">
          {item.startLabel}
        </span>
        <PriorityPill priority={item.priority} />
        <RoomPill room={item.room} changed={item.room !== item.roomOfficial} />
        <span className="ml-auto">
          <StatusChip status={status} />
        </span>
      </div>
      <p className="mt-1 text-xs leading-snug font-medium">{item.title}</p>
      {!compact && item.presenter && (
        <p className="text-[10px] text-muted-foreground">{item.presenter}</p>
      )}
      {assignment && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          <span className="num font-bold uppercase">{role}</span> · {assignment}
          {!committed && <span className="ml-1 text-[9px]">(advisory)</span>}
        </p>
      )}
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <TapButton
          active={status === "In Position"}
          onClick={() => onStatus("In Position")}
          className="text-[11px]"
        >
          In Position
        </TapButton>
        <TapButton
          tone="gold"
          active={status === "Filming"}
          onClick={() => onStatus("Filming")}
          className="text-[11px]"
        >
          Filming
        </TapButton>
        <TapButton
          tone="ok"
          active={status === "Complete"}
          onClick={() => onStatus("Complete")}
          className="text-[11px]"
        >
          Done
        </TapButton>
      </div>
    </li>
  );
}