import { Link } from "@tanstack/react-router";
import { BRAND } from "@/lib/release-content";

export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="border-b border-border bg-background/95">
      <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4">
        <Link to="/releases" className="min-w-0">
          <p className="truncate text-sm font-black tracking-[0.18em] uppercase">{BRAND.company}</p>
          <p className="truncate text-xs text-muted-foreground">{subtitle ?? BRAND.program}</p>
        </Link>
        <span className="shrink-0 rounded-full border border-primary/50 px-3 py-1 text-[10px] font-bold tracking-widest text-primary uppercase">
          {BRAND.eventName}
        </span>
      </div>
    </header>
  );
}

export function BrandFooter() {
  return (
    <footer className="mt-12 border-t border-border px-4 py-8 text-center text-xs text-muted-foreground">
      <p className="font-semibold tracking-widest uppercase">{BRAND.company}</p>
      <p className="mt-1">
        {BRAND.email} · {BRAND.phone}
      </p>
      <p className="mt-1">
        {BRAND.website} · YouTube {BRAND.youtube}
      </p>
      <p className="mt-3 flex flex-wrap justify-center gap-4">
        <Link to="/admin" className="underline underline-offset-4 hover:text-foreground">
          Production staff
        </Link>
        <Link to="/more" className="underline underline-offset-4 hover:text-foreground">
          Crew app
        </Link>
      </p>
    </footer>
  );
}
