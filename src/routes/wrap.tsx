import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Panel, SectionLabel, TapButton } from "@/components/primitives";
import { Field, TextInput } from "@/components/Sheet";
import { GearSheet } from "@/components/sheets/GearSheet";
import { DAY_LABELS, EVENT_DATES } from "@/lib/time";
import { useStore } from "@/state/store";

export const Route = createFileRoute("/wrap")({
  head: () => ({
    meta: [
      { title: "Wrap · PSI Games Crew Control" },
      {
        name: "description",
        content:
          "End-of-day wrap: card offload, backups, release checks and next-day prep.",
      },
      { property: "og:title", content: "Wrap · PSI Games Crew Control" },
      {
        property: "og:description",
        content:
          "End-of-day wrap: card offload, backups, release checks and next-day prep.",
      },
    ],
  }),
  component: WrapScreen,
});

const CHECKS: { key: string; label: string }[] = [
  { key: "cards-collected", label: "All cards collected from every camera" },
  { key: "copy-1", label: "Copy 1 offloaded to primary drive" },
  { key: "copy-2", label: "Copy 2 offloaded to second physical drive" },
  { key: "verify", label: "Both copies opened and spot-checked (not just file count)" },
  { key: "audio", label: "Audio files offloaded and matched to camera clips" },
  { key: "releases", label: "Every recorded subject has a release on file" },
  { key: "batteries", label: "All batteries on charge" },
  { key: "notes", label: "Story notes and selects logged for Duane" },
  { key: "handoff", label: "Handoffs confirmed by call, then text" },
];

function WrapScreen() {
  const { crew, now, wrapFor, setWrap, toggleWrapCheck } = useStore();
  const [date, setDate] = useState(
    EVENT_DATES.includes(now.date) ? now.date : EVENT_DATES[0]!,
  );
  const [gearOpen, setGearOpen] = useState(false);
  const day = wrapFor(date);

  const unsafeCards = crew.cards.filter((c) => c.state !== "Safe to Reformat");
  const missingReleases = crew.interviews.filter(
    (i) =>
      (i.status === "Recorded" || i.status === "Recording") &&
      i.release !== "Signed" &&
      i.release !== "Not Needed",
  );
  const openGear = crew.gear.filter((g) => !g.resolved);
  const done = CHECKS.filter((c) => day.checks[c.key]).length;

  return (
    <AppShell>
      <div className="grid grid-cols-3 gap-1.5">
        {EVENT_DATES.map((d) => (
          <TapButton
            key={d}
            tone="gold"
            active={d === date}
            className="h-10 text-[11px]"
            onClick={() => setDate(d)}
          >
            {DAY_LABELS[d]?.split(" · ")[0] ?? d}
          </TapButton>
        ))}
      </div>

      <Panel className="space-y-1.5">
        <SectionLabel>
          Wrap checklist ({done}/{CHECKS.length})
        </SectionLabel>
        <ul className="space-y-1">
          {CHECKS.map((c) => (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => toggleWrapCheck(date, c.key)}
                className={`tap flex w-full items-start gap-2 rounded-md border px-2 py-2 text-left text-[11px] ${
                  day.checks[c.key]
                    ? "border-ok text-ok"
                    : "border-border bg-secondary text-foreground"
                }`}
              >
                <span className="num shrink-0">{day.checks[c.key] ? "✓" : "○"}</span>
                <span>{c.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel tone={unsafeCards.length ? "gold" : "default"} className="space-y-1">
        <SectionLabel>Media cards ({crew.cards.length})</SectionLabel>
        {crew.cards.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No cards tracked yet.</p>
        ) : (
          <ul className="num space-y-0.5 text-[11px]">
            {crew.cards.map((c) => (
              <li key={c.id} className="flex justify-between">
                <span>
                  {c.cardId} · {c.holder}
                </span>
                <span
                  className={
                    c.state === "Safe to Reformat" ? "text-ok" : "text-muted-foreground"
                  }
                >
                  {c.state}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[10px] text-primary">
          Never reformat before two verified copies.
        </p>
        <TapButton className="h-10 w-full" onClick={() => setGearOpen(true)}>
          Manage cards and gear
        </TapButton>
      </Panel>

      <Panel tone={missingReleases.length ? "alert" : "default"}>
        <SectionLabel>Missing releases ({missingReleases.length})</SectionLabel>
        {missingReleases.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            Every recorded subject has a release.
          </p>
        ) : (
          <ul className="space-y-0.5 text-[11px] text-destructive">
            {missingReleases.map((i) => (
              <li key={i.id}>{i.target}</li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel tone={openGear.length ? "gold" : "default"}>
        <SectionLabel>Open gear issues ({openGear.length})</SectionLabel>
        {openGear.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">Nothing outstanding.</p>
        ) : (
          <ul className="space-y-0.5 text-[11px]">
            {openGear.map((g) => (
              <li key={g.id}>
                {g.kind} · {g.text} ({g.holder})
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel className="space-y-2">
        <SectionLabel>Next day</SectionLabel>
        <Field label="Call time">
          <TextInput
            value={day.nextCall}
            onChange={(e) => setWrap(date, { nextCall: e.target.value })}
            placeholder="7:00 AM lobby"
          />
        </Field>
        <Field label="First assignment">
          <TextInput
            value={day.firstAssignment}
            onChange={(e) => setWrap(date, { firstAssignment: e.target.value })}
          />
        </Field>
        <Field label="Notes">
          <TextInput
            value={day.notes}
            onChange={(e) => setWrap(date, { notes: e.target.value })}
          />
        </Field>
      </Panel>

      <GearSheet open={gearOpen} onClose={() => setGearOpen(false)} />
    </AppShell>
  );
}