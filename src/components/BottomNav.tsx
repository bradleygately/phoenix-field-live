import { Link } from "@tanstack/react-router";
import { CalendarDays, Mic, NotebookPen, MoreHorizontal } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Agenda", Icon: CalendarDays },
  { to: "/interviews", label: "Interviews", Icon: Mic },
  { to: "/notes", label: "Notes", Icon: NotebookPen },
  { to: "/more", label: "More", Icon: MoreHorizontal },
] as const;

export function BottomNav() {
  return (
    <nav className="mx-auto grid w-full max-w-[560px] grid-cols-4 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur fixed inset-x-0 bottom-0 z-30">
      {ITEMS.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: to === "/" }}
          activeProps={{ className: "text-primary" }}
          inactiveProps={{ className: "text-muted-foreground" }}
          className="tap flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold"
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}