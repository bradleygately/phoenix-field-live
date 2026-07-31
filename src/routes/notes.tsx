import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { SectionLabel } from "@/components/primitives";
import { TextArea } from "@/components/Sheet";
import { useStore } from "@/state/store";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Notes · PSI Games Crew" },
      {
        name: "description",
        content:
          "Crew notes for PSI Games 2026 blocks — quick field notes that stay on the phone.",
      },
      { property: "og:title", content: "Notes · PSI Games Crew" },
      {
        property: "og:description",
        content: "Quick field notes attached to PSI Games 2026 schedule blocks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotesScreen,
});

function NotesScreen() {
  const { schedule, crew, setNote, addLog } = useStore();
  const [scratch, setScratch] = useState(crew.notes["scratch"] ?? "");

  const withNotes = useMemo(
    () =>
      schedule.filter((i) => (crew.notes[i.id] ?? "").trim().length > 0),
    [schedule, crew.notes],
  );

  return (
    <AppShell>
      <h1 className="num text-sm font-bold tracking-widest uppercase">Notes</h1>

      <section>
        <SectionLabel>Day scratchpad</SectionLabel>
        <TextArea
          rows={6}
          value={scratch}
          onChange={(e) => setScratch(e.target.value)}
          onBlur={() => {
            setNote("scratch", scratch);
            addLog({ kind: "note", text: "Scratchpad updated" });
          }}
          placeholder="Anything you need to remember"
        />
      </section>

      <section>
        <SectionLabel>Block notes</SectionLabel>
        {withNotes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            No block notes yet. Tap any agenda item to add one.
          </p>
        ) : (
          <ul className="space-y-2">
            {withNotes.map((item) => (
              <li key={item.id} className="rounded-lg border border-border bg-card p-3">
                <p className="num text-[11px] text-muted-foreground">
                  {item.startLabel} · {item.room}
                </p>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs whitespace-pre-wrap text-muted-foreground">
                  {crew.notes[item.id]}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
