import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const SWIPE_TRIGGER = 96;
const HOLD_MS = 350;

type Mode = "idle" | "swipe" | "drag" | "scroll";

interface RowProps {
  id: string;
  children: ReactNode;
  onDelete?: (() => void) | undefined;
  onKeep?: (() => void) | undefined;
  keepLabel?: string;
  deleteLabel?: string;
  sortable?: boolean;
  dragging?: boolean;
  onDragStart?: ((id: string) => void) | undefined;
}

/**
 * One gesture surface for the whole app: swipe left to delete, swipe right to
 * save/keep, press-and-hold to drag. Vertical movement before a decision is
 * handed back to the page so scrolling never fights the row.
 */
export function SwipeRow({
  id,
  children,
  onDelete,
  onKeep,
  keepLabel = "Keep",
  deleteLabel = "Delete",
  sortable = false,
  dragging = false,
  onDragStart,
}: RowProps) {
  const [dx, setDx] = useState(0);
  const mode = useRef<Mode>("idle");
  const start = useRef<{ x: number; y: number } | null>(null);
  const hold = useRef<number | null>(null);

  const clearHold = () => {
    if (hold.current !== null) window.clearTimeout(hold.current);
    hold.current = null;
  };

  useEffect(() => clearHold, []);

  return (
    <li
      data-row-id={id}
      className={cn("relative touch-pan-y overflow-hidden rounded-lg", dragging && "z-10")}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        // Capture so a hold-drag keeps receiving moves once the finger leaves the row.
        e.currentTarget.setPointerCapture?.(e.pointerId);
        start.current = { x: e.clientX, y: e.clientY };
        mode.current = "idle";
        if (sortable && onDragStart) {
          hold.current = window.setTimeout(() => {
            mode.current = "drag";
            onDragStart(id);
            if (navigator.vibrate) navigator.vibrate(10);
          }, HOLD_MS);
        }
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        const ddx = e.clientX - start.current.x;
        const ddy = e.clientY - start.current.y;
        if (mode.current === "drag") return;
        if (mode.current === "idle") {
          if (Math.abs(ddy) > 10 && Math.abs(ddy) > Math.abs(ddx)) {
            mode.current = "scroll";
            clearHold();
            return;
          }
          if (Math.abs(ddx) > 12) {
            mode.current = "swipe";
            clearHold();
          }
        }
        if (mode.current === "swipe") {
          setDx(onKeep ? ddx : Math.min(0, ddx));
        }
      }}
      onPointerUp={(e) => {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
        clearHold();
        if (mode.current === "swipe") {
          if (dx < -SWIPE_TRIGGER) onDelete?.();
          else if (dx > SWIPE_TRIGGER) onKeep?.();
        }
        setDx(0);
        mode.current = "idle";
        start.current = null;
      }}
      onPointerCancel={() => {
        clearHold();
        setDx(0);
        mode.current = "idle";
        start.current = null;
      }}
    >
      <div className="absolute inset-0 flex items-center justify-between rounded-lg px-3 text-[11px] font-bold uppercase">
        <span
          className={cn(
            "num rounded px-2 py-1",
            onKeep ? "bg-ok text-background" : "opacity-0",
          )}
        >
          {keepLabel}
        </span>
        <span className="num rounded bg-destructive px-2 py-1 text-destructive-foreground">
          {deleteLabel}
        </span>
      </div>
      <div
        className={cn(
          "relative rounded-lg",
          dragging && "scale-[1.02] opacity-90 shadow-lg ring-2 ring-primary",
        )}
        style={{ transform: `translateX(${dx}px)`, transition: dx === 0 ? "transform 140ms" : "none" }}
      >
        {children}
      </div>
    </li>
  );
}

export function SortableSwipeList<T>({
  items,
  getId,
  renderItem,
  onReorder,
  onDelete,
  onKeep,
  keepLabel,
  deleteLabel,
  className,
}: {
  items: T[];
  getId: (item: T) => string;
  renderItem: (item: T, dragging: boolean) => ReactNode;
  onReorder?: ((ids: string[]) => void) | undefined;
  onDelete?: ((item: T) => void) | undefined;
  onKeep?: ((item: T) => void) | undefined;
  keepLabel?: string;
  deleteLabel?: string;
  className?: string;
}) {
  const ids = items.map(getId);
  const [order, setOrder] = useState<string[]>(ids);
  const [dragId, setDragId] = useState<string | null>(null);
  const key = ids.join("|");

  useEffect(() => {
    setOrder(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const orderRef = useRef(order);
  orderRef.current = order;

  const byId = new Map(items.map((i) => [getId(i), i]));
  const ordered = order.map((id) => byId.get(id)).filter(Boolean) as T[];

  const moveOver = (dragged: string, clientY: number) => {
    const rows = Array.from(
      document.querySelectorAll<HTMLElement>("[data-row-id]"),
    ).filter((el) => order.includes(el.dataset["rowId"] ?? ""));
    const over = rows.find((el) => {
      const r = el.getBoundingClientRect();
      return clientY >= r.top && clientY <= r.bottom;
    });
    const overId = over?.dataset["rowId"];
    if (!overId || overId === dragged) return;
    setOrder((prev) => {
      const from = prev.indexOf(dragged);
      const to = prev.indexOf(overId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      next.splice(to, 0, next.splice(from, 1)[0]!);
      return next;
    });
  };

  // Drag tracking lives on the window: reordering moves the row's DOM node, which
  // would otherwise drop the pointer capture mid-drag.
  useEffect(() => {
    (window as any).__eff = ((window as any).__eff||0)+1;
    if (!dragId) return;
    const move = (e: PointerEvent) => {
      e.preventDefault();
      moveOver(dragId, e.clientY);
    };
    const end = () => {
      setDragId(null);
      console.log("END", orderRef.current.join(","), typeof onReorder);
      onReorder?.(orderRef.current);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      console.log("CLEANUP", dragId);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragId]);

  return (
    <ul className={cn("space-y-2", className)}>
      {ordered.map((item) => {
        const id = getId(item);
        return (
          <SwipeRow
            key={id}
            id={id}
            sortable={Boolean(onReorder)}
            dragging={dragId === id}
            onDragStart={setDragId}
            onDelete={onDelete ? () => onDelete(item) : undefined}
            onKeep={onKeep ? () => onKeep(item) : undefined}
            {...(keepLabel ? { keepLabel } : {})}
            {...(deleteLabel ? { deleteLabel } : {})}
          >
            {renderItem(item, dragId === id)}
          </SwipeRow>
        );
      })}
    </ul>
  );
}
