import { createFileRoute } from "@tanstack/react-router";

import { StubScreen } from "@/components/AppShell";

export const Route = createFileRoute("/interviews")({
  head: () => ({
    meta: [
      { title: "Interviews · PSI Games Crew Control" },
      {
        name: "description",
        content:
          "Interview targets, booking state and release tracking for PSI Games 2026.",
      },
      { property: "og:title", content: "Interviews · PSI Games Crew Control" },
      {
        property: "og:description",
        content:
          "Interview targets, booking state and release tracking for PSI Games 2026.",
      },
    ],
  }),
  component: () => (
    <StubScreen
      title="Interviews"
      description="Target list, approach status, room booking and signed-release tracking."
    />
  ),
});