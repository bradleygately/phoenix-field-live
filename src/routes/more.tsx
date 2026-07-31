import { Link, createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { SectionLabel } from "@/components/primitives";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "More · PSI Games Crew" },
      {
        name: "description",
        content:
          "Advanced tools for the PSI Games 2026 crew: timeline, activity log, wrap checklist and travel settings.",
      },
      { property: "og:title", content: "More · PSI Games Crew" },
      {
        property: "og:description",
        content: "Timeline, log, wrap checklist and settings for the crew app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MoreScreen,
});

const LINKS = [
  { to: "/map", label: "Map: venue & hotels", hint: "Westin, JW, Element, Home2 + walk times" },
  { to: "/timeline", label: "Timeline & warnings", hint: "Crew lanes, conflicts, travel gaps" },
  { to: "/log", label: "Activity log & exports", hint: "Status history, handoff reports" },
  { to: "/wrap", label: "Wrap, gear & media cards", hint: "Backups, card safety, next call" },
  { to: "/settings", label: "Settings", hint: "Travel calibration, import/export, time simulator" },
] as const;

function MoreScreen() {
  return (
    <AppShell>
      <h1 className="num text-sm font-bold tracking-widest uppercase">More</h1>
      <SectionLabel>Advanced tools</SectionLabel>
      <ul className="space-y-2">
        {LINKS.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="block rounded-lg border border-border bg-card p-3"
            >
              <p className="text-sm font-semibold">{link.label}</p>
              <p className="text-[11px] text-muted-foreground">{link.hint}</p>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
