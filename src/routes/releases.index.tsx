import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Clock3, ShieldCheck } from "lucide-react";

import { BrandFooter, BrandHeader } from "@/components/BrandHeader";
import { BRAND, PRIVACY_NOTE } from "@/lib/release-content";

export const Route = createFileRoute("/releases/")({
  head: () => ({
    meta: [
      { title: "Media Release — PSI Games 2026 | Mojo Phoenix" },
      {
        name: "description",
        content:
          "Sign your media appearance release for the PSI Games 2026 documentary project by Mojo Phoenix Productions. Adult and minor / guardian forms, no login required.",
      },
      { property: "og:title", content: "Media Release — PSI Games 2026" },
      {
        property: "og:description",
        content:
          "Adult and minor / guardian media release signing for the PSI Games 2026 documentary project.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReleasesIndex,
});

function ReleasesIndex() {
  return (
    <div className="min-h-dvh bg-background">
      <BrandHeader />
      <main className="mx-auto max-w-3xl px-4 pt-10 pb-4">
        <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">{BRAND.program}</p>
        <h1 className="mt-3 text-3xl leading-tight font-black tracking-tight sm:text-5xl">
          Media Appearance Release
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          “{BRAND.projectTitle}” — {BRAND.eventName}
          <br />
          {BRAND.venue} · {BRAND.dates}
        </p>

        <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" /> About 2 minutes
          </span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" /> No account or login
            needed
          </span>
        </div>

        <div className="mt-10 space-y-4">
          <ChoiceCard
            to="/releases/adult"
            title="Adult Release"
            body="For participants 18 years or older signing on their own behalf."
          />
          <ChoiceCard
            to="/releases/minor"
            title="Minor / Guardian Release"
            body="For a participant under 18. A parent or legal guardian signs, with optional minor assent."
          />
        </div>

        <div className="mt-10 rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-black tracking-widest uppercase">How it works</h2>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>1. Choose the release that applies to you.</li>
            <li>2. Enter your details and any limitations you want noted.</li>
            <li>3. Sign on screen with your finger, review, and submit.</li>
            <li>4. Download or print your signed PDF with a unique Release ID.</li>
          </ol>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">{PRIVACY_NOTE}</p>
      </main>
      <BrandFooter />
    </div>
  );
}

function ChoiceCard({ to, title, body }: { to: string; title: string; body: string }) {
  return (
    <Link
      to={to}
      className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border-2 border-border bg-card p-5 transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="min-w-0">
        <span className="block text-lg font-black tracking-tight">{title}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{body}</span>
      </span>
      <ArrowRight
        className="h-6 w-6 shrink-0 text-primary transition-transform group-hover:translate-x-1"
        aria-hidden="true"
      />
    </Link>
  );
}
