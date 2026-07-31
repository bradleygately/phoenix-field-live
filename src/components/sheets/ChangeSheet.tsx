import { useState } from "react";

import { ChipRow, Field, Sheet, TextInput } from "@/components/Sheet";
import { TapButton } from "@/components/primitives";
import { useStore } from "@/state/store";
import type { ScheduleItem } from "@/types";

const FIELDS = ["room", "title", "goal"] as const;
type Editable = (typeof FIELDS)[number];

export function ChangeSheet({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: ScheduleItem | null;
}) {
  const { applyChange } = useStore();
  const [field, setField] = useState<Editable>("room");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");

  if (!item) {
    return (
      <Sheet open={open} title="Log change" onClose={onClose}>
        <p className="text-xs text-muted-foreground">
          Focus a block on the Live or Timeline screen first.
        </p>
      </Sheet>
    );
  }

  const official =
    field === "room" ? item.roomOfficial : ((item[field] as string | undefined) ?? "");

  return (
    <Sheet open={open} title="Log change" onClose={onClose}>
      <p className="text-[11px] text-muted-foreground">{item.title}</p>
      <Field label="Field">
        <ChipRow options={FIELDS} value={field} onChange={setField} />
      </Field>
      <p className="num text-[10px] text-muted-foreground">
        Official: {official || "—"} (never overwritten, always revertible)
      </p>
      <Field label="New operational value">
        <TextInput value={value} onChange={(e) => setValue(e.target.value)} />
      </Field>
      <Field label="Reason">
        <TextInput
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Verified with Brad at the door"
        />
      </Field>
      <TapButton
        tone="gold"
        active
        className="h-11 w-full"
        onClick={() => {
          if (!value.trim() || !reason.trim()) return;
          applyChange(item, field, value.trim(), reason.trim());
          setValue("");
          setReason("");
          onClose();
        }}
      >
        Apply change
      </TapButton>
    </Sheet>
  );
}