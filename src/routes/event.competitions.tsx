import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { COMPETITIONS } from "@/data/psi-games";

export const Route = createFileRoute("/event/competitions")({
  head: () => ({
    meta: [
      { title: "Competitions · PSI Games 2026" },
      {
        name: "description",
        content:
          "The five PSI Games competitive disciplines: remote viewing, precognition, mind sight, psychokinesis and dowsing.",
      },
      { property: "og:title", content: "Competitions · PSI Games 2026" },
      {
        property: "og:description",
        content:
          "Remote viewing, precognition, mind sight, psychokinesis and dowsing at PSI Games 2026.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompetitionsScreen,
});

function CompetitionsScreen() {
  return (
    <AppShell>
      <h1 className="num text-sm font-bold tracking-widest uppercase">Competitions</h1>
      <p className="text-[11px] text-muted-foreground">
        Five competitive disciplines. Official descriptions — reference only.
      </p>
      <ul className="space-y-2">
        {COMPETITIONS.map((c, i) => (
          <li key={c.id} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-baseline gap-2">
              <span className="num text-[11px] font-bold text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-sm font-semibold">{c.name}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
