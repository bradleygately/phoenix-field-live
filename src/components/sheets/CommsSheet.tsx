import { useState } from "react";

import { Field, Sheet, TextInput } from "@/components/Sheet";
import { TapButton } from "@/components/primitives";
import { useStore } from "@/state/store";

/** Urgent comms: call first, text second. Copy format is WHO / WHERE / WHEN / NEED. */
export function CommsSheet({
  open,
  onClose,
  defaults,
}: {
  open: boolean;
  onClose: () => void;
  defaults: { who: string; where: string; when: string };
}) {
  const { addLog } = useStore();
  const [who, setWho] = useState(defaults.who);
  const [where, setWhere] = useState(defaults.where);
  const [when, setWhen] = useState(defaults.when);
  const [need, setNeed] = useState("");
  const [copied, setCopied] = useState(false);

  const message = `WHO: ${who}\nWHERE: ${where}\nWHEN: ${when}\nNEED: ${need}`;

  return (
    <Sheet open={open} title="Urgent comms" onClose={onClose}>
      <p className="text-[11px] text-primary">Call first. Text second.</p>
      <Field label="Who">
        <TextInput value={who} onChange={(e) => setWho(e.target.value)} />
      </Field>
      <Field label="Where">
        <TextInput value={where} onChange={(e) => setWhere(e.target.value)} />
      </Field>
      <Field label="When">
        <TextInput value={when} onChange={(e) => setWhen(e.target.value)} />
      </Field>
      <Field label="Need">
        <TextInput value={need} onChange={(e) => setNeed(e.target.value)} />
      </Field>
      <pre className="num rounded-md border border-border bg-secondary p-2 text-[11px] whitespace-pre-wrap">
        {message}
      </pre>
      <div className="grid grid-cols-2 gap-1.5">
        <TapButton
          className="h-11"
          onClick={() => {
            void navigator.clipboard?.writeText(message);
            setCopied(true);
          }}
        >
          {copied ? "Copied ✓" : "Copy message"}
        </TapButton>
        <TapButton
          tone="gold"
          active
          className="h-11"
          onClick={() => {
            addLog({ kind: "note", text: `Urgent comms sent — ${who} / ${where} / ${when} / ${need}` });
            onClose();
          }}
        >
          Log as sent
        </TapButton>
      </div>
    </Sheet>
  );
}