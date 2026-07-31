import { createFileRoute } from "@tanstack/react-router";

import { StubScreen } from "@/components/AppShell";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline · PSI Games Crew Control" },
      {
        name: "description",
        content: "Full three-day PSI Games 2026 run of show with crew assignments.",
      },
      { property: "og:title", content: "Timeline · PSI Games Crew Control" },
      {
        property: "og:description",
        content: "Full three-day PSI Games 2026 run of show with crew assignments.",
      },
    ],
  }),
  component: () => (
    <StubScreen
      title="Timeline"
      description="Full day-by-day run of show with parallel rooms, travel gaps and per-crew lanes."
    />
  ),
});