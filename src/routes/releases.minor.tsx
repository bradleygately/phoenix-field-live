import { createFileRoute } from "@tanstack/react-router";

import { BrandFooter, BrandHeader } from "@/components/BrandHeader";
import { ReleaseFlow } from "@/components/ReleaseFlow";

export const Route = createFileRoute("/releases/minor")({
  head: () => ({
    meta: [
      { title: "Minor / Guardian Media Release — PSI Games 2026" },
      {
        name: "description",
        content:
          "Parent or legal guardian consent for a minor's media appearance in the PSI Games 2026 documentary project.",
      },
      { property: "og:title", content: "Minor / Guardian Media Release — PSI Games 2026" },
      {
        property: "og:description",
        content: "Parent or guardian media release for the PSI Games 2026 documentary project.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MinorPage,
});

function MinorPage() {
  return (
    <div className="min-h-dvh bg-background">
      <BrandHeader subtitle="Minor / guardian media release" />
      <main>
        <ReleaseFlow kind="minor" />
      </main>
      <BrandFooter />
    </div>
  );
}
