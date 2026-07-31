import { TapButton } from "@/components/primitives";
import type { LogEntry } from "@/types";

const ACTIONS: { label: string; kind: LogEntry["kind"]; prompt: string }[] = [
  { label: "Ops decision", kind: "ops", prompt: "Ops decision" },
  { label: "Log change", kind: "change", prompt: "What changed?" },
  { label: "Reassign crew", kind: "reassign", prompt: "Reassignment" },
  { label: "Interview now", kind: "interview", prompt: "Interview subject / room" },
  { label: "Release needed", kind: "release", prompt: "Release needed for" },
  { label: "Gear / card", kind: "gear", prompt: "Gear or card note" },
];

export function QuickActions({
  onAction,
}: {
  onAction: (kind: LogEntry["kind"], text: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {ACTIONS.map((action) => (
        <TapButton
          key={action.kind}
          className="text-[11px] leading-tight"
          onClick={() => {
            const text = window.prompt(action.prompt);
            if (text && text.trim()) onAction(action.kind, text.trim());
          }}
        >
          {action.label}
        </TapButton>
      ))}
    </div>
  );
}