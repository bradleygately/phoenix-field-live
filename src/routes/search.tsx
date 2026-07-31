import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { EmptyState, SectionLabel, PriorityPill } from "@/components/primitives";
import { ItemSheet } from "@/components/agenda/ItemSheet";
import { TextInput } from "@/components/Sheet";
import {
  COMPETITIONS,
  FEATURED_FACULTY,
  KEYNOTE_SPEAKERS,
  ORG,
} from "@/data/psi-games";
import { DAY_LABELS } from "@/lib/time";
import { useStore } from "@/state/store";
import type { ScheduleItem } from "@/types";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search · PSI Games Crew" },
      {
        name: "description",
        content:
          "Search PSI Games 2026 schedule blocks, interviews, speakers, faculty, competitions and crew notes from one place.",
      },
      { property: "og:title", content: "Search · PSI Games Crew" },
      {
        property: "og:description",
        content:
          "Find any event, interview, speaker or note across the PSI Games crew app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchScreen,
});

type Group = "events" | "interviews" | "people" | "competitions" | "notes";

const GROUPS: { id: Group | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "events", label: "Events" },
  { id: "interviews", label: "Interviews" },
  { id: "people", label: "People" },
  { id: "competitions", label: "Comps" },
  { id: "notes", label: "Notes" },
];

function hit(query: string, ...fields: (string | undefined)[]): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return false;
  const hay = fields.filter(Boolean).join(" ").toLowerCase();
  return terms.every((t) => hay.includes(t));
}

function SearchScreen() {
  const { schedule, crew } = useStore();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<Group | "all">("all");
  const [openItem, setOpenItem] = useState<ScheduleItem | null>(null);

  const query = q.trim();

  const results = useMemo(() => {
    if (!query) {
      return {
        events: [] as ScheduleItem[],
        interviews: [] as typeof crew.interviews,
        people: [] as { name: string; role: string }[],
        competitions: [] as typeof COMPETITIONS,
        notes: [] as { id: string; text: string; item: ScheduleItem | undefined }[],
      };
    }

    const events = schedule.filter((i) =>
      hit(
        query,
        i.title,
        i.room,
        i.roomOfficial,
        i.presenter,
        i.priority,
        i.jesse,
        i.duane,
        i.brad,
        i.goal,
        DAY_LABELS[i.date],
      ),
    );

    const interviews = (crew.interviews ?? []).filter((iv) =>
      hit(query, iv.target, iv.angle, iv.location, iv.window, iv.contact, iv.notes, iv.owner),
    );

    const people = [
      { name: ORG.founder, role: "Founder" },
      ...KEYNOTE_SPEAKERS.map((n) => ({ name: n, role: "Keynote speaker" })),
      ...FEATURED_FACULTY.map((n) => ({ name: n, role: "Featured faculty" })),
    ].filter((p) => hit(query, p.name, p.role));

    const competitions = COMPETITIONS.filter((c) => hit(query, c.name, c.description));

    const notes = (crew.itemNotes ?? [])
      .filter((n) => hit(query, n.text, n.author))
      .map((n) => ({
        id: n.id,
        text: n.text,
        item: schedule.find((i) => i.id === n.itemId),
      }));

    return { events, interviews, people, competitions, notes };
  }, [query, schedule, crew.interviews, crew.itemNotes]);

  const show = (g: Group) => group === "all" || group === g;
  const total =
    results.events.length +
    results.interviews.length +
    results.people.length +
    results.competitions.length +
    results.notes.length;

  return (
    <AppShell>
      <h1 className="num text-sm font-bold tracking-widest uppercase">Search</h1>

      <TextInput
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Event, room, speaker, interview, note…"
        aria-label="Search PSI Games"
      />

      <div className="-mx-3 overflow-x-auto px-3">
        <div className="flex w-max gap-1.5">
          {GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroup(g.id)}
              className={
                "min-h-10 shrink-0 rounded-md border px-3 text-xs font-semibold " +
                (group === g.id
                  ? "border-primary text-primary"
                  : "border-border bg-secondary text-muted-foreground")
              }
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {!query ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          Type to search schedule blocks, interviews, speakers, competitions and notes.
        </p>
      ) : total === 0 ? (
        <EmptyState
          title={`No matches for “${query}”`}
          body="Try a shorter term, a room name, or a crew member. Filters above narrow results by type."
          {...(group === "all"
            ? {}
            : { actionLabel: "Search all types", onAction: () => setGroup("all") })}
        />
      ) : (
        <p className="num text-[11px] text-muted-foreground">
          {total} result{total === 1 ? "" : "s"}
        </p>
      )}

      {show("events") && results.events.length > 0 && (
        <section>
          <SectionLabel>Events ({results.events.length})</SectionLabel>
          <ul className="space-y-1.5">
            {results.events.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => setOpenItem(i)}
                  className="w-full rounded-lg border border-border bg-card p-3 text-left"
                >
                  <p className="num text-[11px] text-muted-foreground">
                    {DAY_LABELS[i.date] ?? i.date} · {i.startLabel}–{i.endLabel} ·{" "}
                    {i.room || "Room TBD"}
                  </p>
                  <p className="text-sm font-semibold">{i.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <PriorityPill
                      priority={i.priority === "BACKUP" ? "OPTIONAL" : i.priority}
                    />
                    {i.presenter && (
                      <span className="truncate text-[11px] text-muted-foreground">
                        {i.presenter}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {show("interviews") && results.interviews.length > 0 && (
        <section>
          <SectionLabel>Interviews ({results.interviews.length})</SectionLabel>
          <ul className="space-y-1.5">
            {results.interviews.map((iv) => (
              <li key={iv.id}>
                <Link
                  to="/interviews"
                  className="block rounded-lg border border-border bg-card p-3"
                >
                  <p className="text-sm font-semibold">{iv.target}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {iv.angle || "No angle set"}
                  </p>
                  <p className="num mt-1 text-[10px] tracking-wide text-muted-foreground uppercase">
                    {iv.owner} · {iv.window || "window TBD"} ·{" "}
                    {iv.location || "location TBD"} · {iv.status}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {show("people") && results.people.length > 0 && (
        <section>
          <SectionLabel>People ({results.people.length})</SectionLabel>
          <ul className="space-y-1.5">
            {results.people.map((p) => (
              <li key={p.name}>
                <Link
                  to="/event/speakers"
                  className="block rounded-lg border border-border bg-card p-2.5"
                >
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="num text-[10px] tracking-widest text-primary uppercase">
                    {p.role}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {show("competitions") && results.competitions.length > 0 && (
        <section>
          <SectionLabel>Competitions ({results.competitions.length})</SectionLabel>
          <ul className="space-y-1.5">
            {results.competitions.map((c) => (
              <li key={c.id}>
                <Link
                  to="/event/competitions"
                  className="block rounded-lg border border-border bg-card p-2.5"
                >
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {show("notes") && results.notes.length > 0 && (
        <section>
          <SectionLabel>Notes ({results.notes.length})</SectionLabel>
          <ul className="space-y-1.5">
            {results.notes.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => n.item && setOpenItem(n.item)}
                  className="w-full rounded-lg border border-border bg-card p-2.5 text-left"
                >
                  <p className="text-xs whitespace-pre-wrap">{n.text}</p>
                  {n.item && (
                    <p className="num mt-1 text-[10px] text-muted-foreground uppercase">
                      {n.item.startLabel} · {n.item.title}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ItemSheet item={openItem} onClose={() => setOpenItem(null)} />
    </AppShell>
  );
}
