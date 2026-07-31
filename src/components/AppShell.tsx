import type { ReactNode } from "react";

import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import { LeaveByAlert } from "./live/LeaveByAlert";
import { QuickCapture } from "./QuickCapture";

export function AppShell({
  children,
  quickCapture = true,
}: {
  children: ReactNode;
  /** hide the floating "+" on screens that already own the bottom-right corner */
  quickCapture?: boolean;
  /** accepted for backwards compatibility, no longer rendered */
  warningCount?: number | undefined;
  onWarnings?: (() => void) | undefined;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col bg-background">
      <AppHeader />
      <main className="flex-1 space-y-3 px-3 pt-3 pb-28">
        <LeaveByAlert />
        {children}
      </main>
      {quickCapture && <QuickCapture />}
      <BottomNav />
    </div>
  );
}

export function StubScreen({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <AppShell>
      <section className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
        <h1 className="num text-sm font-bold tracking-widest uppercase">{title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        <p className="num mt-4 text-[10px] tracking-wide text-muted-foreground uppercase">
          Coming in the next build
        </p>
      </section>
    </AppShell>
  );
}