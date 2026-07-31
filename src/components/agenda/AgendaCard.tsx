import { Check } from "lucide-react";

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
  marker,
}: {
  item: ScheduleItem;
  filter: CrewFilter;
  status: Status;
  onStatus: (status: Status) => void;
  onOpen: () => void;
  tone?: "default" | "now";
  /** Timeline position badge driven by the current Charlotte clock. */
  marker?: "NOW" | "NEXT" | undefined;
}) {
  const crew = assignedCrew(item);
  const done = status === "Complete";

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-3",
        tone === "now" ? "border-primary" : "border-border",
        marker === "NOW" && "ring-1 ring-primary/60",
        done && "opacity-55",
        status === "Skipped" && "opacity-50",
      )}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
        <button
          type="button"
          aria-pressed={done}
          aria-label={done ? `Mark ${item.title} not done` : `Mark ${item.title} done`}
          onClick={() => onStatus(done ? "Pending" : "Complete")}
          className={cn(
            "tap mt-0.5 flex h-11 w-11 items-center justify-center rounded-lg border",
            done
              ? "border-ok bg-ok text-background"
              : "border-border bg-secondary text-muted-foreground",
          )}
        >
          <Check className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="block w-full space-y-1.5 text-left"
        >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <span className="num flex min-w-0 items-center gap-1.5 truncate text-[12px] font-semibold text-muted-foreground">
            {marker && (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase",
                  marker === "NOW"
                    ? "bg-primary text-primary-foreground"
                    : "border border-primary text-primary",
                )}
              >
                {marker}
              </span>
            )}
            <span className="truncate">
              {item.startLabel} – {item.endLabel}
            </span>
          </span>
          <span className="shrink-0">
            <StatusChip status={status} />
          </span>
        </div>
        <p
          className={cn(
            "text-sm leading-snug font-semibold",
            done && "line-through decoration-1",
          )}
        >
          {item.title}
        </p>
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
      </div>
      <div className="mt-2.5">
        <StatusControls current={status} onSelect={onStatus} />
      </div>
    </div>
  );
}
