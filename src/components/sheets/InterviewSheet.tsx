import { useState } from "react";

import { ChipRow, Field, Sheet, TextArea, TextInput } from "@/components/Sheet";
import { TapButton } from "@/components/primitives";
import { useStore } from "@/state/store";
import {
  ACCESS_STATUSES,
  RELEASE_STATUSES,
  type AccessStatus,
  type Interview,
  type Priority,
  type ReleaseStatus,
  type ScheduleItem,
} from "@/types";

const PRIORITIES: Priority[] = ["MUST", "HIGH", "OPTIONAL", "BACKUP"];

export function InterviewSheet({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: ScheduleItem | null;
}) {
  const { upsertInterview, role, addLog } = useStore();
  const [target, setTarget] = useState("");
  const [location, setLocation] = useState(item?.room ?? "");
  const [angle, setAngle] = useState("");
  const [priority, setPriority] = useState<Priority>("HIGH");
  const [access, setAccess] = useState<AccessStatus>("Confirmed");
  const [release, setRelease] = useState<ReleaseStatus>("Needed");
  const [start, setStart] = useState(true);

  return (
    <Sheet open={open} title="Interview now" onClose={onClose}>
      <Field label="Subject">
        <TextInput value={target} onChange={(e) => setTarget(e.target.value)} />
      </Field>
      <Field label="Room / location">
        <TextInput value={location} onChange={(e) => setLocation(e.target.value)} />
      </Field>
      <Field label="Angle">
        <TextArea value={angle} onChange={(e) => setAngle(e.target.value)} />
      </Field>
      <Field label="Priority">
        <ChipRow options={PRIORITIES} value={priority} onChange={setPriority} />
      </Field>
      <Field label="Access">
        <ChipRow options={ACCESS_STATUSES} value={access} onChange={setAccess} />
      </Field>
      <Field label="Release">
        <ChipRow options={RELEASE_STATUSES} value={release} onChange={setRelease} />
      </Field>
      <label className="flex items-center gap-2 text-[11px]">
        <input
          type="checkbox"
          checked={start}
          onChange={(e) => setStart(e.target.checked)}
          className="h-5 w-5 accent-[oklch(0.78_0.15_75)]"
        />
        Start the interview timer now
      </label>
      {release !== "Signed" && release !== "Not Needed" && (
        <p className="text-[11px] text-destructive">
          Release not signed — do not publish this footage until Brad records it.
        </p>
      )}
      <TapButton
        tone="gold"
        active
        className="h-11 w-full"
        onClick={() => {
          if (!target.trim()) return;
          const now = Date.now();
          const interview: Interview = {
            id: `iv-${now}`,
            priority,
            target: target.trim(),
            angle: angle.trim(),
            window: "",
            location: location.trim(),
            owner: role,
            access,
            release,
            status: start ? "Recording" : "Scheduled",
            contact: "",
            notes: "",
            fileRef: "",
            restrictions: [],
            itemId: item?.id,
            runningSince: start ? now : null,
            elapsedMs: 0,
            updatedAt: now,
          };
          upsertInterview(interview);
          addLog({
            kind: "interview",
            itemId: item?.id,
            text: `${interview.target} — ${start ? "recording started" : "scheduled"} in ${interview.location || "TBD"}`,
          });
          setTarget("");
          setAngle("");
          onClose();
        }}
      >
        Save interview
      </TapButton>
    </Sheet>
  );
}