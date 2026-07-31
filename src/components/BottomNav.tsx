import { Link } from "@tanstack/react-router";
import { ClipboardList, Mic, Radio, ListChecks, PackageCheck } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Live", Icon: Radio },
  { to: "/timeline", label: "Timeline", Icon: ListChecks },
  { to: "/interviews", label: "Interviews", Icon: Mic },
  { to: "/log", label: "Log", Icon: ClipboardList },
  { to: "/wrap", label: "Wrap", Icon: PackageCheck },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      {ITEMS.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: to === "/" }}
          activeProps={{ className: "text-primary" }}
          inactiveProps={{ className: "text-muted-foreground" }}
          className="tap flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-semibold"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}