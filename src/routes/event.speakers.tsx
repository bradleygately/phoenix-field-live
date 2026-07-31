import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { SectionLabel } from "@/components/primitives";
import { FEATURED_FACULTY, KEYNOTE_SPEAKERS, ORG } from "@/data/psi-games";

export const Route = createFileRoute("/event/speakers")({
  head: () => ({
    meta: [
      { title: "Speakers & Faculty · PSI Games 2026" },
      {
        name: "description",
        content:
          "Keynote speakers and featured faculty presenting at PSI Games 2026 in Charlotte, including Laura Lynne Jackson, Rizwan Virk and Paul H Smith.",
      },
      { property: "og:title", content: "Speakers & Faculty · PSI Games 2026" },
      {
        property: "og:description",
        content: "Keynotes and featured faculty presenting at PSI Games 2026.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SpeakersScreen,
});

function SpeakersScreen() {
  return (
    <AppShell>
      <h1 className="num text-sm font-bold tracking-widest uppercase">
        Speakers & faculty
      </h1>

      <section>
        <SectionLabel>Founder</SectionLabel>
        <div className="rounded-lg border border-primary/60 bg-card p-3">
          <p className="text-sm font-semibold">{ORG.founder}</p>
          <p className="text-[11px] text-muted-foreground">Founder, {ORG.name}</p>
        </div>
      </section>

      <section>
        <SectionLabel>Keynote speakers</SectionLabel>
        <ul className="space-y-1.5">
          {KEYNOTE_SPEAKERS.map((n) => (
            <li
              key={n}
              className="rounded-lg border border-border bg-card p-2.5 text-sm font-semibold"
            >
              {n}
              <span className="num ml-2 text-[10px] tracking-widest text-primary uppercase">
                Keynote
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionLabel>Featured faculty ({FEATURED_FACULTY.length})</SectionLabel>
        <ul className="space-y-1.5">
          {FEATURED_FACULTY.map((n) => (
            <li
              key={n}
              className="rounded-lg border border-border bg-card p-2.5 text-sm"
            >
              {n}
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
