import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const SWIPE_TRIGGER = 96;
const HOLD_MS = 350;
/** Finger slop allowed before a press-and-hold is treated as a swipe or scroll. */
const HOLD_SLOP = 10;

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
  dragOffset?: number;
  onDragStart?: ((id: string, clientY: number) => void) | undefined;
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
  dragOffset = 0,
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
      className={cn("relative overflow-hidden rounded-lg", dragging && "z-20")}
      style={{
        touchAction: dragging ? "none" : "pan-y",
        transform: dragging ? `translateY(${dragOffset}px)` : undefined,
        transition: dragging ? "none" : "transform 140ms",
      }}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        start.current = { x: e.clientX, y: e.clientY };
        mode.current = "idle";
        if (sortable && onDragStart) {
          hold.current = window.setTimeout(() => {
            mode.current = "drag";
            onDragStart(id, start.current?.y ?? 0);
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
          if (Math.abs(ddy) > HOLD_SLOP && Math.abs(ddy) > Math.abs(ddx)) {
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
      onPointerUp={() => {
        clearHold();
        if (mode.current === "swipe") {
          if (dx < -SWIPE_TRIGGER) onDelete?.();
          else if (dx > SWIPE_TRIGGER) onKeep?.();
        }
        setDx(0);
        if (mode.current !== "drag") mode.current = "idle";
        start.current = null;
      }}
      onPointerCancel={() => {
        clearHold();
        setDx(0);
        if (mode.current !== "drag") mode.current = "idle";
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
  const [dragOffset, setDragOffset] = useState(0);
  const key = ids.join("|");

  useEffect(() => {
    setOrder(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const orderRef = useRef(order);
  orderRef.current = order;
  const dragStartY = useRef(0);
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const byId = new Map(items.map((i) => [getId(i), i]));
  const ordered = order.map((id) => byId.get(id)).filter(Boolean) as T[];

  // Ref-stable so the window listeners never read a stale order snapshot.
  const moveOver = useCallback((dragged: string, clientY: number) => {
    const rows = Array.from(
      document.querySelectorAll<HTMLElement>("[data-row-id]"),
    ).filter((el) => orderRef.current.includes(el.dataset["rowId"] ?? ""));
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
    // The dragged row jumped to its new slot, so restart the finger offset there.
    dragStartY.current = clientY;
    setDragOffset(0);
  }, []);

  // Drag tracking lives on the window: reordering moves the row's DOM node, which
  // would otherwise drop the pointer capture mid-drag.
  useEffect(() => {
    if (!dragId) return;
    const move = (e: PointerEvent) => {
      setDragOffset(e.clientY - dragStartY.current);
      moveOver(dragId, e.clientY);
    };
    // Touch scrolling was already allowed at touchstart, so block it explicitly
    // for the life of the drag instead of relying on touch-action alone.
    const blockScroll = (e: TouchEvent) => e.preventDefault();
    const end = () => {
      setDragOffset(0);
      setDragId(null);
      onReorderRef.current?.(orderRef.current);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    document.addEventListener("touchmove", blockScroll, { passive: false });
    const prevSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      document.removeEventListener("touchmove", blockScroll);
      document.body.style.userSelect = prevSelect;
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
            dragOffset={dragId === id ? dragOffset : 0}
            onDragStart={(rowId, clientY) => {
              dragStartY.current = clientY;
              setDragOffset(0);
              setDragId(rowId);
            }}
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
