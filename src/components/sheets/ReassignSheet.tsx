import { useState } from "react";

import { ChipRow, Field, Sheet, TextArea, TextInput } from "@/components/Sheet";
import { TapButton } from "@/components/primitives";
import { useStore } from "@/state/store";
import { CREW_IDS, type CrewId, type ScheduleItem } from "@/types";

export function ReassignSheet({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: ScheduleItem | null;
}) {
  const { reassign, role } = useStore();
  const [who, setWho] = useState<CrewId>(role);
  const [assignment, setAssignment] = useState("");
  const [committed, setCommitted] = useState(true);
  const [effective, setEffective] = useState("now");
  const [reason, setReason] = useState("");

  if (!item) {
    return (
      <Sheet open={open} title="Reassign crew" onClose={onClose}>
        <p className="text-xs text-muted-foreground">Focus a block first.</p>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} title="Reassign crew" onClose={onClose}>
      <p className="text-[11px] text-muted-foreground">
        {item.startLabel} · {item.room} · {item.title}
      </p>
      <Field label="Who">
        <ChipRow options={CREW_IDS} value={who} onChange={setWho} />
      </Field>
      <p className="text-[10px] text-muted-foreground">
        Official: {item[who] || "—"}
      </p>
      <Field label="New assignment">
        <TextArea
          value={assignment}
          onChange={(e) => setAssignment(e.target.value)}
          placeholder="Primary camera, stage left"
        />
      </Field>
      <Field label="Commitment">
        <div className="grid grid-cols-2 gap-1.5">
          <TapButton
            tone="gold"
            active={committed}
            className="h-10"
            onClick={() => setCommitted(true)}
          >
            Real commitment
          </TapButton>
          <TapButton
            active={!committed}
            className="h-10"
            onClick={() => setCommitted(false)}
          >
            Advisory only
          </TapButton>
        </div>
      </Field>
      <Field label="Effective from">
        <TextInput value={effective} onChange={(e) => setEffective(e.target.value)} />
      </Field>
      <Field label="Reason">
        <TextInput value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <p className="text-[10px] text-primary">
        No one leaves a critical block without a direct handoff — confirm by call, then
        text.
      </p>
      <TapButton
        tone="gold"
        active
        className="h-11 w-full"
        onClick={() => {
          if (!assignment.trim() || !reason.trim()) return;
          reassign({
            item,
            who,
            assignment: assignment.trim(),
            committed,
            reason: reason.trim(),
            effective,
          });
          setAssignment("");
          setReason("");
          onClose();
        }}
      >
        Reassign
      </TapButton>
    </Sheet>
  );
}