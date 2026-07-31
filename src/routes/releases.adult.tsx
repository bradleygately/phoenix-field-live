import { createFileRoute } from "@tanstack/react-router";

import { BrandFooter, BrandHeader } from "@/components/BrandHeader";
import { ReleaseFlow } from "@/components/ReleaseFlow";

export const Route = createFileRoute("/releases/adult")({
  head: () => ({
    meta: [
      { title: "Adult Media Release — PSI Games 2026 | Mojo Phoenix" },
      {
        name: "description",
        content:
          "Sign the adult media appearance release for the PSI Games 2026 documentary project by Mojo Phoenix Productions.",
      },
      { property: "og:title", content: "Adult Media Release — PSI Games 2026" },
      {
        property: "og:description",
        content: "Adult media appearance release for the PSI Games 2026 documentary project.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdultPage,
});

function AdultPage() {
  return (
    <div className="min-h-dvh bg-background">
      <BrandHeader subtitle="Adult media release" />
      <main>
        <ReleaseFlow kind="adult" />
      </main>
      <BrandFooter />
    </div>
  );
}
