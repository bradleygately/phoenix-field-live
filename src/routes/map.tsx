import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { SectionLabel } from "@/components/primitives";
import { CrewMap } from "@/components/map/CrewMap";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Crew Map · Westin & Hotels" },
      {
        name: "description",
        content:
          "Uptown Charlotte map of The Westin venue and the crew hotels: JW Marriott (Duane), Element (Jesse) and Home2 Suites (Brad), with walking times.",
      },
      { property: "og:title", content: "Crew Map · Westin & Hotels" },
      {
        property: "og:description",
        content:
          "Venue and crew hotel locations in uptown Charlotte with door-to-lobby walking times.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MapScreen,
});

function MapScreen() {
  return (
    <AppShell>
      <h1 className="num text-sm font-bold tracking-widest uppercase">Map</h1>
      <SectionLabel>Venue & crew hotels · uptown Charlotte</SectionLabel>
      <CrewMap />
    </AppShell>
  );
}