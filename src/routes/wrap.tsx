import { createFileRoute } from "@tanstack/react-router";

import { StubScreen } from "@/components/AppShell";

export const Route = createFileRoute("/wrap")({
  head: () => ({
    meta: [
      { title: "Wrap · PSI Games Crew Control" },
      {
        name: "description",
        content:
          "End-of-day wrap: card offload, backups, release checks and next-day prep.",
      },
      { property: "og:title", content: "Wrap · PSI Games Crew Control" },
      {
        property: "og:description",
        content:
          "End-of-day wrap: card offload, backups, release checks and next-day prep.",
      },
    ],
  }),
  component: () => (
    <StubScreen
      title="Wrap"
      description="Card offload and backup checklist, missing-release sweep, and next-day call times."
    />
  ),
});