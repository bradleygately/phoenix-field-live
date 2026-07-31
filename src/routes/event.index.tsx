import { Link, createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { SectionLabel } from "@/components/primitives";
import {
  EDUCATION,
  EVENT,
  ORG,
  TICKETS,
  VENUE_SPACES,
} from "@/data/psi-games";

export const Route = createFileRoute("/event/")({
  head: () => ({
    meta: [
      { title: "Event Info · PSI Games 2026" },
      {
        name: "description",
        content:
          "Official PSI Games International reference: venue spaces, ticket tiers, education tracks and organizers at the Westin Charlotte.",
      },
      { property: "og:title", content: "Event Info · PSI Games 2026" },
      {
        property: "og:description",
        content:
          "Venue spaces, ticket tiers and education tracks for PSI Games at the Westin Charlotte.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventScreen,
});

function EventScreen() {
  return (
    <AppShell>
      <h1 className="num text-sm font-bold tracking-widest uppercase">Event info</h1>
      <p className="text-xs text-muted-foreground">
        {ORG.name} · {EVENT.name} · {EVENT.venue}, {EVENT.city} {EVENT.state} ·{" "}
        {EVENT.duration}
      </p>
      <p className="text-[11px] text-muted-foreground">{ORG.description}</p>
      <p className="text-[11px] text-muted-foreground">
        Founder: <span className="font-semibold text-foreground">{ORG.founder}</span>
      </p>

      <section>
        <SectionLabel>Reference</SectionLabel>
        <ul className="space-y-2">
          {[
            {
              to: "/event/speakers",
              label: "Speakers & faculty",
              hint: "Keynotes and featured faculty",
            },
            {
              to: "/event/competitions",
              label: "Competitions",
              hint: "Five competitive disciplines",
            },
          ].map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className="block rounded-lg border border-border bg-card p-3"
              >
                <p className="text-sm font-semibold">{l.label}</p>
                <p className="text-[11px] text-muted-foreground">{l.hint}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionLabel>Education tracks</SectionLabel>
        <ul className="space-y-1.5">
          {EDUCATION.map((e) => (
            <li key={e.label} className="rounded-lg border border-border bg-card p-2.5">
              <p className="num text-[11px] font-bold tracking-widest uppercase">
                {e.label}
              </p>
              <p className="text-xs text-muted-foreground">{e.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionLabel>Ticket tiers</SectionLabel>
        <ul className="space-y-1.5">
          {TICKETS.map((t) => (
            <li key={t.name} className="rounded-lg border border-border bg-card p-2.5">
              <p className="num text-[11px] font-bold tracking-widest text-primary uppercase">
                {t.name}
              </p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionLabel>Venue spaces</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {VENUE_SPACES.map((s) => (
            <span
              key={s}
              className="rounded border border-border bg-secondary px-2 py-1 text-[11px]"
            >
              {s}
            </span>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
