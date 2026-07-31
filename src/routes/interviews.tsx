import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Panel, PriorityPill, SectionLabel, TapButton } from "@/components/primitives";
import { ChipRow, Field, Sheet, TextArea, TextInput } from "@/components/Sheet";
import { InterviewSheet } from "@/components/sheets/InterviewSheet";
import { useStore } from "@/state/store";
import {
  ACCESS_STATUSES,
  INTERVIEW_STATUSES,
  RELEASE_STATUSES,
  type Interview,
} from "@/types";

export const Route = createFileRoute("/interviews")({
  head: () => ({
    meta: [
      { title: "Interviews · PSI Games Crew Control" },
      {
        name: "description",
        content:
          "Interview targets, booking state and release tracking for PSI Games 2026.",
      },
      { property: "og:title", content: "Interviews · PSI Games Crew Control" },
      {
        property: "og:description",
        content:
          "Interview targets, booking state and release tracking for PSI Games 2026.",
      },
    ],
  }),
  component: InterviewsScreen,
});

const FILTERS = ["All", "Open", "Recorded", "Release open"] as const;

function InterviewsScreen() {
  const { crew, patchInterview, toggleInterviewTimer, epochMs } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [editing, setEditing] = useState<Interview | null>(null);
  const [adding, setAdding] = useState(false);

  const list = crew.interviews.filter((i) => {
    if (filter === "Open") return i.status === "Target" || i.status === "Scheduled";
    if (filter === "Recorded") return i.status === "Recorded" || i.status === "Recording";
    if (filter === "Release open")
      return i.release === "Needed" || i.release === "Restricted";
    return true;
  });

  return (
    <AppShell>
      <div className="grid grid-cols-4 gap-1.5">
        {FILTERS.map((f) => (
          <TapButton
            key={f}
            tone="gold"
            active={filter === f}
            className="h-9 text-[10px]"
            onClick={() => setFilter(f)}
          >
            {f}
          </TapButton>
        ))}
      </div>
      <TapButton
        tone="gold"
        active
        className="h-11 w-full"
        onClick={() => setAdding(true)}
      >
        + New interview
      </TapButton>

      <ul className="space-y-2">
        {list.map((i) => {
          const elapsed =
            i.elapsedMs + (i.runningSince ? epochMs - i.runningSince : 0);
          return (
            <li key={i.id}>
              <Panel
                tone={i.release === "Needed" && i.status === "Recorded" ? "alert" : "default"}
                className="space-y-1"
              >
                <div className="flex items-center gap-1.5">
                  <PriorityPill priority={i.priority} />
                  <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">
                    {i.target}
                  </span>
                  <span className="num text-[10px] text-muted-foreground uppercase">
                    {i.status}
                  </span>
                </div>
                {i.angle && (
                  <p className="text-[11px] text-muted-foreground">{i.angle}</p>
                )}
                <p className="num text-[10px] text-muted-foreground">
                  Access {i.access} · Release {i.release} · Owner {i.owner}
                  {i.location ? ` · ${i.location}` : ""}
                </p>
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  <TapButton
                    tone="gold"
                    active={Boolean(i.runningSince)}
                    className="num h-10"
                    onClick={() => toggleInterviewTimer(i.id)}
                  >
                    {i.runningSince
                      ? `Stop ${Math.floor(elapsed / 60000)}m`
                      : elapsed > 0
                        ? `Restart · ${Math.floor(elapsed / 60000)}m`
                        : "Start"}
                  </TapButton>
                  <TapButton
                    tone="ok"
                    active={i.release === "Signed"}
                    className="h-10"
                    onClick={() =>
                      patchInterview(i.id, { release: "Signed" }, "release signed")
                    }
                  >
                    Release ✓
                  </TapButton>
                  <TapButton className="h-10" onClick={() => setEditing(i)}>
                    Edit
                  </TapButton>
                </div>
              </Panel>
            </li>
          );
        })}
        {list.length === 0 && (
          <li className="text-xs text-muted-foreground">Nothing matches this filter.</li>
        )}
      </ul>

      <Panel>
        <SectionLabel>Rules</SectionLabel>
        <p className="text-[11px] text-muted-foreground">
          Brad owns interview coordination and releases. Never publish footage without a
          signed release; guardian release is required for anyone under 18.
        </p>
      </Panel>

      <InterviewSheet open={adding} onClose={() => setAdding(false)} item={null} />
      <EditSheet interview={editing} onClose={() => setEditing(null)} />
    </AppShell>
  );
}

function EditSheet({
  interview,
  onClose,
}: {
  interview: Interview | null;
  onClose: () => void;
}) {
  const { patchInterview } = useStore();
  if (!interview) return null;
  return (
    <Sheet open title={interview.target} onClose={onClose}>
      <Field label="Access">
        <ChipRow
          options={ACCESS_STATUSES}
          value={interview.access}
          onChange={(v) => patchInterview(interview.id, { access: v }, `access ${v}`)}
        />
      </Field>
      <Field label="Release">
        <ChipRow
          options={RELEASE_STATUSES}
          value={interview.release}
          onChange={(v) => patchInterview(interview.id, { release: v }, `release ${v}`)}
        />
      </Field>
      <Field label="Status">
        <ChipRow
          options={INTERVIEW_STATUSES}
          value={interview.status}
          onChange={(v) => patchInterview(interview.id, { status: v }, `status ${v}`)}
        />
      </Field>
      <Field label="Window">
        <TextInput
          defaultValue={interview.window}
          onBlur={(e) => patchInterview(interview.id, { window: e.target.value })}
        />
      </Field>
      <Field label="Location">
        <TextInput
          defaultValue={interview.location}
          onBlur={(e) => patchInterview(interview.id, { location: e.target.value })}
        />
      </Field>
      <Field label="Contact">
        <TextInput
          defaultValue={interview.contact}
          onBlur={(e) => patchInterview(interview.id, { contact: e.target.value })}
        />
      </Field>
      <Field label="File reference">
        <TextInput
          defaultValue={interview.fileRef}
          onBlur={(e) => patchInterview(interview.id, { fileRef: e.target.value })}
        />
      </Field>
      <Field label="Notes">
        <TextArea
          defaultValue={interview.notes}
          onBlur={(e) => patchInterview(interview.id, { notes: e.target.value })}
        />
      </Field>
      <TapButton tone="gold" active className="h-11 w-full" onClick={onClose}>
        Done
      </TapButton>
    </Sheet>
  );
}