import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Priority, Status } from "@/types";

export function PhoenixMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("h-5 w-5 shrink-0 text-primary", className)}
      fill="currentColor"
    >
      <path d="M12 2c1.4 2.2 1.6 4.3.7 6.3 1.6-.5 2.9-1.5 3.9-3 .9 2.6.5 4.9-1.3 6.9 1.6.1 3.1-.4 4.5-1.5-.4 3.6-2.3 6.2-5.6 7.8l1.1 3.5-3.3-2.3-3.3 2.3 1.1-3.5C6.5 16.9 4.6 14.3 4.2 10.7c1.4 1.1 2.9 1.6 4.5 1.5-1.8-2-2.2-4.3-1.3-6.9 1 1.5 2.3 2.5 3.9 3C10.4 6.3 10.6 4.2 12 2z" />
    </svg>
  );
}

const PRIORITY_CLASS: Record<Priority, string> = {
  MUST: "bg-primary text-primary-foreground border-primary",
  HIGH: "border-primary text-primary",
  OPTIONAL: "border-border text-muted-foreground",
  BACKUP: "border-dashed border-border text-muted-foreground/70",
};

export function PriorityPill({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "num inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-widest uppercase",
        PRIORITY_CLASS[priority],
      )}
    >
      {priority}
    </span>
  );
}

export function RoomPill({ room, changed }: { room: string; changed?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-[46vw] items-center truncate rounded border border-border bg-secondary px-1.5 py-0.5 text-[11px] font-medium",
        changed && "border-primary text-primary",
      )}
    >
      {room}
    </span>
  );
}

const STATUS_CLASS: Record<Status, string> = {
  Pending: "border-border text-muted-foreground",
  "In Position": "border-primary text-primary",
  Filming: "border-primary bg-primary text-primary-foreground",
  Complete: "border-ok text-ok",
  Changed: "border-border text-foreground",
  Skipped: "border-border text-muted-foreground/70 line-through",
};

export function StatusChip({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase",
        STATUS_CLASS[status],
      )}
    >
      {status}
    </span>
  );
}

export function Panel({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "alert" | "gold";
}) {
  return (
    <section
      className={cn(
        "rounded-lg border bg-card p-3",
        tone === "default" && "border-border",
        tone === "alert" && "border-destructive",
        tone === "gold" && "border-primary",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="num mb-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
      {children}
    </h2>
  );
}

type TapProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  tone?: "default" | "gold" | "ok" | "alert";
};

export function TapButton({ active, tone = "default", className, ...rest }: TapProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "tap flex items-center justify-center rounded-md border px-2 text-xs font-semibold transition-colors",
        "border-border bg-secondary text-foreground active:bg-accent",
        tone === "gold" && active && "border-primary bg-primary text-primary-foreground",
        tone === "ok" && active && "border-ok bg-ok text-background",
        tone === "alert" && active && "border-destructive text-destructive",
        tone === "default" && active && "border-primary text-primary",
        className,
      )}
    />
  );
}