import { useMemo, useState } from "react";

import { Field, Sheet, TextArea } from "@/components/Sheet";
import { TapButton } from "@/components/primitives";
import { decide } from "@/lib/ops";
import { useStore } from "@/state/store";
import type { ScheduleItem } from "@/types";

export function OpsSheet({
  open,
  onClose,
  candidates,
  fromRoom,
}: {
  open: boolean;
  onClose: () => void;
  candidates: ScheduleItem[];
  fromRoom: string;
}) {
  const { role, now, settings, addLog } = useStore();
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const selected = candidates.filter((c) => picked.includes(c.id));
  const decision = useMemo(
    () =>
      decide({
        candidates: selected,
        role,
        fromRoom,
        min: now.min,
        settings,
      }),
    [selected, role, fromRoom, now.min, settings],
  );

  return (
    <Sheet open={open} title="Ops decision" onClose={onClose}>
      <p className="text-[11px] text-muted-foreground">
        Pick the competing blocks. Same inputs always give the same answer — story
        priority first, then camera feasibility, then logistics cost.
      </p>
      <ul className="space-y-1">
        {candidates.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() =>
                setPicked((p) =>
                  p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id],
                )
              }
              className={`tap flex w-full items-center gap-2 rounded-md border px-2 text-left text-[11px] ${
                picked.includes(c.id)
                  ? "border-primary text-primary"
                  : "border-border bg-secondary"
              }`}
            >
              <span className="num w-14 shrink-0">{c.startLabel}</span>
              <span className="min-w-0 flex-1 truncate">{c.title}</span>
              <span className="num shrink-0 text-[10px] text-muted-foreground">
                {c.priority}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {selected.length > 0 && (
        <div className="rounded-md border border-primary p-2">
          <p className="text-xs font-bold text-primary">
            {decision.recommended?.label}
          </p>
          <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
            {decision.rationale.map((r) => (
              <li key={r}>· {r}</li>
            ))}
          </ul>
          <ul className="num mt-1.5 space-y-0.5 text-[10px]">
            {decision.options.map((o) => (
              <li key={o.id} className="flex justify-between">
                <span className="truncate pr-2">{o.label}</span>
                <span className={o.feasible ? "text-ok" : "text-destructive"}>
                  {o.score} · {o.travelMinutes}m
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Field label="Decision note">
        <TextArea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why this call was made"
        />
      </Field>
      <TapButton
        tone="gold"
        active
        className="h-11 w-full"
        onClick={() => {
          addLog({
            kind: "ops",
            text: decision.recommended
              ? `Ops: ${decision.recommended.label} — ${decision.rationale.join(" | ")}${note ? ` — ${note}` : ""}`
              : `Ops note: ${note}`,
          });
          setPicked([]);
          setNote("");
          onClose();
        }}
      >
        Record decision
      </TapButton>
    </Sheet>
  );
}