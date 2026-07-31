import { useState } from "react";

import { ChipRow, Field, Sheet, TextInput } from "@/components/Sheet";
import { TapButton } from "@/components/primitives";
import { useStore } from "@/state/store";
import { RELEASE_STATUSES, type ReleaseStatus } from "@/types";

export function ReleaseSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { crew, patchInterview, addLog } = useStore();
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState<ReleaseStatus>("Needed");
  const [minor, setMinor] = useState(false);

  const open_ = crew.interviews.filter(
    (i) => i.release === "Needed" || i.release === "Restricted",
  );

  return (
    <Sheet open={open} title="Release tracking" onClose={onClose}>
      <SectionList
        title={`Outstanding releases (${open_.length})`}
        empty="No outstanding releases."
      >
        {open_.map((i) => (
          <li
            key={i.id}
            className="flex items-center gap-2 rounded-md border border-border p-2"
          >
            <span className="min-w-0 flex-1 truncate text-[11px]">{i.target}</span>
            <TapButton
              tone="ok"
              active
              className="h-9 px-2"
              onClick={() =>
                patchInterview(i.id, { release: "Signed" }, "release signed")
              }
            >
              Signed
            </TapButton>
          </li>
        ))}
      </SectionList>

      <Field label="New release note (subject)">
        <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} />
      </Field>
      <Field label="Status">
        <ChipRow options={RELEASE_STATUSES} value={status} onChange={setStatus} />
      </Field>
      <label className="flex items-center gap-2 text-[11px]">
        <input
          type="checkbox"
          checked={minor}
          onChange={(e) => setMinor(e.target.checked)}
          className="h-5 w-5"
        />
        Minor on camera — guardian release required
      </label>
      {minor && status !== "Signed" && (
        <p className="text-[11px] text-destructive">
          Do not record identifiable footage of a minor until the guardian release is
          signed.
        </p>
      )}
      <TapButton
        tone="gold"
        active
        className="h-11 w-full"
        onClick={() => {
          if (!subject.trim()) return;
          addLog({
            kind: "release",
            text: `${subject.trim()} — release ${status}${minor ? " (minor, guardian required)" : ""}`,
          });
          setSubject("");
          onClose();
        }}
      >
        Log release state
      </TapButton>
    </Sheet>
  );
}

function SectionList({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <div className="space-y-1">
      <p className="num text-[10px] tracking-widest text-muted-foreground uppercase">
        {title}
      </p>
      {children.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1">{children}</ul>
      )}
    </div>
  );
}