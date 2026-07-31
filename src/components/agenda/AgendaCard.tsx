import { PriorityPill, StatusChip } from "@/components/primitives";
import { cn } from "@/lib/utils";
import { CREW_LABEL, assignedCrew, coverageNote, type CrewFilter } from "./agenda";
import { StatusControls } from "./StatusControls";
import type { ScheduleItem, Status } from "@/types";

export function AgendaCard({
  item,
  filter,
  status,
  onStatus,
  onOpen,
  tone = "default",
}: {
  item: ScheduleItem;
  filter: CrewFilter;
  status: Status;
  onStatus: (status: Status) => void;
  onOpen: () => void;
  tone?: "default" | "now";
}) {
  const crew = assignedCrew(item);

  return (
    <li
      className={cn(
        "rounded-xl border bg-card p-3",
        tone === "now" ? "border-primary" : "border-border",
        status === "Complete" && "opacity-70",
        status === "Skipped" && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full space-y-1.5 text-left"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <span className="num min-w-0 truncate text-[12px] font-semibold text-muted-foreground">
            {item.startLabel} – {item.endLabel}
          </span>
          <span className="shrink-0">
            <StatusChip status={status} />
          </span>
        </div>
        <p className="text-sm leading-snug font-semibold">{item.title}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <PriorityPill
            priority={item.priority === "BACKUP" ? "OPTIONAL" : item.priority}
          />
          <span className="min-w-0 truncate rounded border border-border bg-secondary px-1.5 py-0.5 text-[11px]">
            {item.room || "Room TBD"}
          </span>
          {crew.length > 0 ? (
            crew.map((id) => (
              <span
                key={id}
                className="num rounded border border-primary/60 px-1.5 py-0.5 text-[10px] font-semibold text-primary uppercase"
              >
                {CREW_LABEL[id]}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-muted-foreground">Unassigned</span>
          )}
        </div>
        <p className="line-clamp-2 text-[11px] text-muted-foreground">
          {coverageNote(item, filter)}
        </p>
      </button>
      <div className="mt-2.5">
        <StatusControls current={status} onSelect={onStatus} />
      </div>
    </li>
  );
}
