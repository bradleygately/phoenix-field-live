import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { EmptyState, SectionLabel } from "@/components/primitives";
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
  const navigate = useNavigate();
  const [scratch, setScratch] = useState(crew.notes["scratch"] ?? "");

  const withNotes = useMemo(() => {
    const list = crew.itemNotes ?? [];
    return schedule
      .map((item) => ({
        item,
        notes: [
          ...list.filter((n) => n.itemId === item.id),
          ...((crew.notes[item.id] ?? "").trim()
            ? [
                {
                  id: `legacy-${item.id}`,
                  itemId: item.id,
                  text: crew.notes[item.id] as string,
                  author: "brad" as const,
                  at: 0,
                },
              ]
            : []),
        ],
      }))
      .filter((entry) => entry.notes.length > 0);
  }, [schedule, crew.itemNotes, crew.notes]);

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
            if (scratch === (crew.notes["scratch"] ?? "")) return;
            setNote("scratch", scratch);
            addLog({ kind: "note", text: "Scratchpad updated" });
            toast.success("Scratchpad saved");
          }}
          placeholder="Anything you need to remember"
        />
      </section>

      <section>
        <SectionLabel>Block notes</SectionLabel>
        {withNotes.length === 0 ? (
          <EmptyState
            title="No block notes yet"
            body="Notes you attach to a schedule block collect here — use the + button or open any agenda item."
            actionLabel="Open agenda"
            onAction={() => void navigate({ to: "/" })}
          />
        ) : (
          <ul className="space-y-2">
            {withNotes.map(({ item, notes }) => (
              <li key={item.id} className="rounded-lg border border-border bg-card p-3">
                <p className="num text-[11px] text-muted-foreground">
                  {item.startLabel} · {item.room}
                </p>
                <p className="text-sm font-semibold">{item.title}</p>
                <ul className="mt-1 space-y-1">
                  {notes.map((n) => (
                    <li
                      key={n.id}
                      className="text-xs whitespace-pre-wrap text-muted-foreground"
                    >
                      • {n.text}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
