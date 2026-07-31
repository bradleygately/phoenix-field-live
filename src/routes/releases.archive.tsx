import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminQr } from "@/components/admin/AdminQr";
import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/releases/archive")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Release Archive | PSI Games Crew" },
      {
        name: "description",
        content:
          "Crew archive for PSI Games 2026 signed media releases: search, restrictions, signed PDFs and CSV export.",
      },
      { property: "og:title", content: "Release Archive | PSI Games Crew" },
      {
        property: "og:description",
        content: "Search, review and export PSI Games 2026 signed media releases.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReleaseArchivePage,
});

function ReleaseArchivePage() {
  const [tab, setTab] = useState<"records" | "qr">("records");

  return (
    <div>
      <BrandHeader subtitle="Release archive" />
      <main className="mx-auto max-w-4xl px-4 pb-16">
        <div className="mt-6">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Release archive</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Signed releases for PSI Games 2026. No sign-in required.
          </p>
        </div>

        <div className="mt-6 flex gap-2">
          {(
            [
              ["records", "Records"],
              ["qr", "QR signage"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              variant={tab === value ? "default" : "outline"}
              onClick={() => setTab(value)}
              aria-pressed={tab === value}
              className="min-h-11"
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="mt-6">{tab === "records" ? <AdminDashboard /> : <AdminQr />}</div>
      </main>
    </div>
  );
}