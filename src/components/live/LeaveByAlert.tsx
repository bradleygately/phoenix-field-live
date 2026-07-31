import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { buzz, fireNotification, notifyPermission, requestNotifyPermission } from "@/lib/alerts";
import { computeLeaveBy, itemsForDate, positionOf } from "@/lib/live";
import { formatMin } from "@/lib/time";
import { useStore } from "@/state/store";

const ALERTS_KEY = "psi-leaveby-alerts";
/** Banner appears this far out; notifications fire at 10m and at go-time. */
const BANNER_MIN = 20;
const WARN_MIN = 10;

export function useLeaveByAlertsEnabled() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    setEnabled(window.localStorage.getItem(ALERTS_KEY) !== "off");
  }, []);
  const set = useCallback((next: boolean) => {
    setEnabled(next);
    window.localStorage.setItem(ALERTS_KEY, next ? "on" : "off");
  }, []);
  return { enabled, setEnabled: set };
}

export function LeaveByAlert() {
  const { schedule, crew, role, settings, now, epochMs } = useStore();
  const { enabled, setEnabled } = useLeaveByAlertsEnabled();
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [permission, setPermission] = useState(() => notifyPermission());
  const fired = useRef<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const plan = useMemo(() => {
    const items = itemsForDate(schedule, now.date);
    if (items.length === 0) return null;
    const room = positionOf(crew, role, items, now.min, epochMs).room;
    return computeLeaveBy(items, role, room, now.min, settings);
  }, [crew, epochMs, now.date, now.min, role, schedule, settings]);

  const remainingSec = plan ? (plan.leaveByMin - now.min) * 60 - now.seconds : 0;
  const remainingMin = Math.ceil(remainingSec / 60);

  useEffect(() => {
    if (!plan || !enabled) return;
    const key10 = `${plan.target.id}:10`;
    const keyGo = `${plan.target.id}:go`;
    if (remainingSec <= WARN_MIN * 60 && remainingSec > 0 && !fired.current.has(key10)) {
      fired.current.add(key10);
      buzz([120, 80, 120]);
      void fireNotification(
        `Leave in ${Math.max(1, remainingMin)}m`,
        `${plan.fromRoom} → ${plan.estimate.to.label} for ${plan.target.startLabel} ${plan.target.title}`,
        key10,
      );
    }
    if (remainingSec <= 0 && !fired.current.has(keyGo)) {
      fired.current.add(keyGo);
      buzz([200, 100, 200, 100, 200]);
      void fireNotification(
        "Leave now",
        `${plan.estimate.to.label} · ${plan.target.title} starts ${plan.target.startLabel}`,
        keyGo,
      );
    }
  }, [enabled, plan, remainingMin, remainingSec]);

  if (!mounted || !plan) return null;
  if (remainingSec > BANNER_MIN * 60) return null;
  if (dismissed === plan.target.id) return null;

  const late = remainingSec < 0;
  const soon = !late && remainingSec <= WARN_MIN * 60;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "sticky top-0 z-30 -mx-3 mb-1 border-b px-3 py-2",
        late
          ? "border-destructive bg-destructive/15"
          : soon
            ? "border-primary bg-primary/10"
            : "border-border bg-secondary",
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <div className="min-w-0">
          <p
            className={cn(
              "num text-sm font-bold",
              late ? "text-destructive" : soon ? "text-primary" : "text-foreground",
            )}
          >
            {late
              ? `LEAVE NOW · ${Math.abs(remainingMin) || 1}m late`
              : `Leave in ${Math.max(0, remainingMin)}m · ${formatMin(plan.leaveByMin)}`}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {plan.fromRoom} → {plan.estimate.to.label} · {plan.target.startLabel}{" "}
            {plan.target.title}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {enabled && permission !== "granted" && permission !== "unsupported" && (
            <button
              type="button"
              onClick={() => void requestNotifyPermission().then(setPermission)}
              className="tap flex items-center justify-center rounded-md border border-primary px-2 text-[10px] font-bold text-primary uppercase"
            >
              Alerts on
            </button>
          )}
          <button
            type="button"
            aria-label={enabled ? "Mute leave-by alerts" : "Unmute leave-by alerts"}
            onClick={() => setEnabled(!enabled)}
            className="tap flex items-center justify-center rounded-md border border-border text-muted-foreground"
          >
            {enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </button>
          <button
            type="button"
            aria-label="Dismiss leave-by banner"
            onClick={() => setDismissed(plan.target.id)}
            className="tap flex items-center justify-center rounded-md border border-border text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
