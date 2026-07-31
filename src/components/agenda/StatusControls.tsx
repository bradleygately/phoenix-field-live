import { cn } from "@/lib/utils";
import type { Status } from "@/types";

export const AGENDA_STATUSES: Status[] = [
  "Pending",
  "In Position",
  "Filming",
  "Complete",
  "Skipped",
];

const SHORT: Record<string, string> = {
  Pending: "Pending",
  "In Position": "In Position",
  Filming: "Filming",
  Complete: "Complete",
  Skipped: "Skipped",
};

export function StatusControls({
  current,
  onSelect,
  size = "md",
}: {
  current: Status;
  onSelect: (status: Status) => void;
  size?: "md" | "lg";
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {AGENDA_STATUSES.map((status) => {
        const active = current === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onSelect(status)}
            aria-pressed={active}
            className={cn(
              "flex items-center justify-center rounded-md border px-1 text-center text-[11px] font-semibold",
              size === "lg" ? "min-h-12" : "min-h-11",
              active
                ? status === "Complete"
                  ? "border-ok bg-ok text-background"
                  : status === "Skipped"
                    ? "border-destructive text-destructive"
                    : "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-muted-foreground",
            )}
          >
            {SHORT[status]}
          </button>
        );
      })}
    </div>
  );
}
