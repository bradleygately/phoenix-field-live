import { useEffect, useState } from "react";

import { Field, Sheet, TextArea, TextInput } from "@/components/Sheet";
import { PriorityPill } from "@/components/primitives";
import { StatusControls } from "./StatusControls";
import { CREW_LABEL } from "./agenda";
import { useStore } from "@/state/store";
import { CREW_IDS, type CrewId, type ScheduleItem } from "@/types";

export function ItemSheet({
  item,
  onClose,
}: {
  item: ScheduleItem | null;
  onClose: () => void;
}) {
  const { statusOf, setStatus, setNote, crew, reassign } = useStore();
  const [note, setLocalNote] = useState("");
  const [who, setWho] = useState<CrewId>("jesse");
  const [assignment, setAssignment] = useState("");

  useEffect(() => {
    if (!item) return;
    setLocalNote(crew.notes[item.id] ?? "");
    setAssignment("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  if (!item) return null;

  return (
    <Sheet open title={item.title} onClose={onClose}>
      <div className="space-y-1">
        <p className="num text-sm font-semibold">
          {item.startLabel} – {item.endLabel}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <PriorityPill
            priority={item.priority === "BACKUP" ? "OPTIONAL" : item.priority}
          />
          <span className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[11px]">
            {item.room || "Room TBD"}
          </span>
        </div>
        {item.presenter && (
          <p className="text-[11px] text-muted-foreground">{item.presenter}</p>
        )}
        {item.room !== item.roomOfficial && (
          <p className="text-[10px] text-primary">
            Official room: {item.roomOfficial}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-border p-2">
        <p className="num mb-1 text-[10px] tracking-widest text-muted-foreground uppercase">
          Crew responsibilities
        </p>
        <ul className="space-y-1">
          {CREW_IDS.map((id) => (
            <li key={id} className="text-[11px]">
              <span className="num font-bold uppercase">{CREW_LABEL[id]}</span>{" "}
              <span className="text-muted-foreground">{item[id] ?? "—"}</span>
            </li>
          ))}
        </ul>
        {item.goal && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">Goal: {item.goal}</p>
        )}
        {item.release && (
          <p className="text-[11px] text-muted-foreground">Release: {item.release}</p>
        )}
      </div>

      <Field label="Status">
        <StatusControls
          size="lg"
          current={statusOf(item.id)}
          onSelect={(s) => setStatus(item.id, s)}
        />
      </Field>

      <Field label="Notes">
        <TextArea
          value={note}
          onChange={(e) => setLocalNote(e.target.value)}
          onBlur={() => setNote(item.id, note)}
          placeholder="Anything the crew needs to know"
        />
      </Field>

      <Field label="Reassign crew">
        <div className="grid grid-cols-3 gap-1.5">
          {CREW_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setWho(id)}
              className={
                "min-h-11 rounded-md border text-xs font-semibold " +
                (who === id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-muted-foreground")
              }
            >
              {CREW_LABEL[id]}
            </button>
          ))}
        </div>
      </Field>
      <TextInput
        value={assignment}
        onChange={(e) => setAssignment(e.target.value)}
        placeholder={`New assignment for ${CREW_LABEL[who]}`}
      />
      <button
        type="button"
        disabled={!assignment.trim()}
        onClick={() => {
          reassign({
            item,
            who,
            assignment: assignment.trim(),
            committed: true,
            reason: "Field reassign",
            effective: "now",
          });
          setAssignment("");
        }}
        className="min-h-12 w-full rounded-md border border-primary bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-40"
      >
        Save reassignment
      </button>
    </Sheet>
  );
}
