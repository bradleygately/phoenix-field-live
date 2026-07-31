import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Panel, PriorityPill, SectionLabel, TapButton } from "@/components/primitives";
import { ChipRow, Field, Sheet, TextArea, TextInput } from "@/components/Sheet";
import { SortableSwipeList } from "@/components/gestures/SortableSwipeList";
import { InterviewSheet } from "@/components/sheets/InterviewSheet";
import { getRecording } from "@/lib/audio-store";
import { useRecorder } from "@/lib/recorder";
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
  const {
    crew,
    patchInterview,
    toggleInterviewTimer,
    deleteInterview,
    restoreInterview,
    reorderInterviews,
    epochMs,
    addLog,
  } = useStore();
  const recorder = useRecorder();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [editing, setEditing] = useState<Interview | null>(null);
  const [adding, setAdding] = useState(false);
  const [undo, setUndo] = useState<Interview | null>(null);

  useEffect(() => {
    if (!undo) return;
    const id = window.setTimeout(() => setUndo(null), 6000);
    return () => window.clearTimeout(id);
  }, [undo]);

  const recording = crew.interviews.find((i) => i.id === recorder.interviewId) ?? null;

  const startRecording = useCallback(
    async (interview: Interview) => {
      const ok = await recorder.start(interview.id);
      if (!ok) return;
      patchInterview(
        interview.id,
        { status: "Recording", runningSince: Date.now() },
        "recording started",
      );
    },
    [patchInterview, recorder],
  );

  const stopRecording = useCallback(async () => {
    const id = recorder.interviewId;
    const result = await recorder.stop();
    if (!id || !result) return;
    const current = crew.interviews.find((i) => i.id === id);
    patchInterview(
      id,
      {
        status: "Recorded",
        runningSince: null,
        elapsedMs: (current?.elapsedMs ?? 0) + result.ms,
        recordingKey: result.key,
        recordingMs: result.ms,
      },
      `recording saved (${Math.round(result.ms / 1000)}s)`,
    );
    addLog({ kind: "interview", text: `Audio saved for ${current?.target ?? "interview"}` });
  }, [addLog, crew.interviews, patchInterview, recorder]);

  const list = crew.interviews.filter((i) => {
    if (filter === "Open") return i.status === "Target" || i.status === "Scheduled";
    if (filter === "Recorded") return i.status === "Recorded" || i.status === "Recording";
    if (filter === "Release open")
      return i.release === "Needed" || i.release === "Restricted";
    return true;
  });

  return (
    <AppShell>
      {/* Start control is pinned so it is always one thumb away. */}
      <div className="sticky top-0 z-20 -mx-3 space-y-1.5 border-b border-border bg-background/95 px-3 py-2 backdrop-blur">
        {recorder.status === "recording" ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive bg-card p-2">
            <span
              aria-hidden
              className="h-3 w-3 animate-pulse rounded-full bg-destructive"
            />
            <div className="min-w-0 flex-1">
              <p className="num text-[10px] tracking-widest text-destructive uppercase">
                Recording live
              </p>
              <p className="truncate text-[12px] font-semibold">
                {recording?.target ?? "Interview"}
              </p>
            </div>
            <span className="num text-sm font-bold">{clock(recorder.elapsedMs)}</span>
            <TapButton
              tone="alert"
              active
              className="h-11 px-3"
              onClick={() => void stopRecording()}
            >
              Stop
            </TapButton>
          </div>
        ) : (
          <TapButton
            tone="gold"
            active
            className="h-14 w-full text-sm"
            onClick={() => setAdding(true)}
          >
            ● Start interview
          </TapButton>
        )}
        {recorder.error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive p-2">
            <p className="min-w-0 flex-1 text-[11px] text-destructive">{recorder.error}</p>
            <TapButton
              className="h-9 px-3 text-[11px]"
              onClick={() => {
                recorder.clearError();
                setAdding(true);
              }}
            >
              Retry
            </TapButton>
          </div>
        )}
      </div>

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

      <p className="text-[10px] text-muted-foreground">
        Hold a tile to drag it into priority order · swipe right to keep · swipe left to
        delete
      </p>

      {undo && (
        <div className="flex items-center justify-between rounded-md border border-border bg-secondary px-2 py-2">
          <span className="text-[11px] text-muted-foreground">
            {undo.target} deleted
          </span>
          <button
            type="button"
            onClick={() => {
              restoreInterview(undo);
              setUndo(null);
            }}
            className="rounded-md border border-primary px-3 py-1.5 text-[11px] font-bold text-primary uppercase"
          >
            Undo
          </button>
        </div>
      )}

      <SortableSwipeList
        items={list}
        getId={(i) => i.id}
        keepLabel="Keep"
        deleteLabel="Delete"
        onReorder={(ids) => reorderInterviews(ids)}
        onKeep={(i) => patchInterview(i.id, { priority: "MUST" }, "kept — priority MUST")}
        onDelete={(i) => {
          if (recorder.interviewId === i.id) return;
          deleteInterview(i.id);
          setUndo(i);
        }}
        renderItem={(i) => {
          const live = recorder.interviewId === i.id;
          const elapsed = live
            ? recorder.elapsedMs
            : i.elapsedMs + (i.runningSince ? epochMs - i.runningSince : 0);
          return (
            <Panel
              tone={
                live
                  ? "alert"
                  : i.release === "Needed" && i.status === "Recorded"
                    ? "alert"
                    : "default"
              }
              className="space-y-1"
            >
              <div className="flex items-center gap-1.5">
                <PriorityPill priority={i.priority} />
                <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">
                  {i.target}
                </span>
                {live && (
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 animate-pulse rounded-full bg-destructive"
                  />
                )}
                <span className="num text-[10px] text-muted-foreground uppercase">
                  {i.status}
                </span>
              </div>
              {i.angle && <p className="text-[11px] text-muted-foreground">{i.angle}</p>}
              <p className="num text-[10px] text-muted-foreground">
                Access {i.access} · Release {i.release} · Owner {i.owner}
                {i.location ? ` · ${i.location}` : ""}
              </p>
              {i.recordingKey && !live && (
                <RecordingPlayer keyName={i.recordingKey} ms={i.recordingMs ?? 0} />
              )}
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                <TapButton
                  tone={live ? "alert" : "gold"}
                  active={live}
                  className="num h-11"
                  onClick={() => {
                    if (live) void stopRecording();
                    else if (recorder.status === "recording") toggleInterviewTimer(i.id);
                    else void startRecording(i);
                  }}
                >
                  {live ? `Stop ${clock(elapsed)}` : elapsed > 0 ? "Record again" : "Start"}
                </TapButton>
                <TapButton
                  tone="ok"
                  active={i.release === "Signed"}
                  className="h-11"
                  onClick={() =>
                    patchInterview(i.id, { release: "Signed" }, "release signed")
                  }
                >
                  Release ✓
                </TapButton>
                <TapButton className="h-11" onClick={() => setEditing(i)}>
                  Edit
                </TapButton>
              </div>
            </Panel>
          );
        }}
      />
      {list.length === 0 && (
        <p className="text-xs text-muted-foreground">Nothing matches this filter.</p>
      )}

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

function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function RecordingPlayer({ keyName, ms }: { keyName: string; ms: number }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoke: string | null = null;
    void getRecording(keyName).then((blob) => {
      if (!blob) return;
      revoke = URL.createObjectURL(blob);
      setUrl(revoke);
    });
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [keyName]);

  if (!url) return null;
  return (
    <div className="space-y-1">
      <p className="num text-[10px] text-ok uppercase">Audio saved · {clock(ms)}</p>
      <audio controls src={url} className="h-9 w-full" />
    </div>
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