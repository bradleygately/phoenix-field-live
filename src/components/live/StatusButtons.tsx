import { TapButton } from "@/components/primitives";
import { STATUSES, type Status } from "@/types";

export function StatusButtons({
  current,
  onSelect,
}: {
  current: Status;
  onSelect: (status: Status) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {STATUSES.map((status) => (
        <TapButton
          key={status}
          active={current === status}
          tone={
            status === "Complete" ? "ok" : status === "Skipped" ? "alert" : "gold"
          }
          onClick={() => onSelect(status)}
        >
          {status}
        </TapButton>
      ))}
    </div>
  );
}