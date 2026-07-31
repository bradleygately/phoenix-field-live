import { useEffect, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Mobile bottom sheet. Thumb-reachable, no window.prompt anywhere in the app. */
export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative mx-auto max-h-[86vh] w-full max-w-[560px] overflow-y-auto rounded-t-2xl border border-border bg-card p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border" />
        <h2 className="num mb-2 text-[11px] font-bold tracking-widest uppercase">
          {title}
        </h2>
        <div className="space-y-2">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="num text-[10px] tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

const CONTROL =
  "w-full rounded-md border border-border bg-secondary px-2 py-2 text-sm text-foreground";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(CONTROL, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={cn(CONTROL, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(CONTROL, "h-11", props.className)} />;
}

export function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "tap rounded-md border px-2 text-[11px] font-semibold",
            option === value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-secondary text-muted-foreground",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}