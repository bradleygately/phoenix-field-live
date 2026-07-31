import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { SectionLabel } from "@/components/primitives";
import { AgendaCard } from "@/components/agenda/AgendaCard";
import { ItemSheet } from "@/components/agenda/ItemSheet";
import { CREW_LABEL, matchesCrew, type CrewFilter } from "@/components/agenda/agenda";
import { SortableSwipeList } from "@/components/gestures/SortableSwipeList";
import { cn } from "@/lib/utils";
import { itemsForDate } from "@/lib/live";
import { DAY_LABELS, EVENT_DATES, formatDuration } from "@/lib/time";
import { useStore } from "@/state/store";
import { CREW_IDS, type ScheduleItem, type Status } from "@/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agenda · PSI Games Crew" },
      {
        name: "description",
        content:
          "Simple mobile agenda for the Mojo Phoenix crew at PSI Games 2026: now, next and later today with rooms, crew and status.",
      },
      { property: "og:title", content: "Agenda · PSI Games Crew" },
      {
        property: "og:description",
        content:
          "Now, next and later today for the Mojo Phoenix crew at PSI Games 2026.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AgendaScreen,
});

const DAY_TABS = [
  { date: EVENT_DATES[0]!, label: "Fri" },
  { date: EVENT_DATES[1]!, label: "Sat" },
  { date: EVENT_DATES[2]!, label: "Sun" },
];

const FILTERS: CrewFilter[] = ["all", ...CREW_IDS];

function AgendaScreen() {
  const { schedule, now, setRole, statusOf, setStatus, agendaOrder, reorderAgenda } =
    useStore();
  const today = EVENT_DATES.includes(now.date) ? now.date : EVENT_DATES[0]!;
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState<CrewFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ id: string; title: string; prev: Status } | null>(
    null,
  );
  // The clock ticks every second, so server HTML can never match the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useMemo(
    () => itemsForDate(schedule, date).filter((i) => matchesCrew(i, filter)),
    [schedule, date, filter],
  );

  const isToday = date === today;
  const nowItems = isToday
    ? items.filter((i) => now.min >= i.startMin && now.min < i.endMin)
    : [];
  const future = isToday ? items.filter((i) => i.startMin > now.min) : items;
  const nextItems = future.slice(0, isToday ? 2 : 3);
  const laterItems = future.slice(nextItems.length);
  const past = isToday ? items.filter((i) => i.endMin <= now.min) : [];

  const doneCount = items.filter((i) => {
    const s = statusOf(i.id);
    return s === "Complete" || s === "Skipped";
  }).length;
  const pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;
  const nowId = nowItems[0]?.id;
  const nextId = nextItems[0]?.id;

  const open = items.find((i) => i.id === openId) ?? null;

  useEffect(() => {
    if (!undo) return;
    const id = window.setTimeout(() => setUndo(null), 6000);
    return () => window.clearTimeout(id);
  }, [undo]);

  /** Dragged order wins inside a section; otherwise the schedule's own order holds. */
  const sortSection = (list: ScheduleItem[]) =>
    [...list].sort(
      (a, b) =>
        (agendaOrder[a.id] ?? Number.MAX_SAFE_INTEGER) -
        (agendaOrder[b.id] ?? Number.MAX_SAFE_INTEGER),
    );

  const swipeStatus = (item: ScheduleItem, status: Status) => {
    setUndo({ id: item.id, title: item.title, prev: statusOf(item.id) });
    setStatus(item.id, status);
  };

  const renderList = (list: ScheduleItem[], tone?: "now") => (
    <SortableSwipeList
      items={sortSection(list)}
      getId={(i) => i.id}
      className="space-y-2"
      keepLabel="Complete"
      deleteLabel="Skip"
      onReorder={(ids) => reorderAgenda(ids)}
      onKeep={(item) => swipeStatus(item, "Complete")}
      onDelete={(item) => swipeStatus(item, "Skipped")}
      renderItem={(item) => (
        <AgendaCard
          item={item}
          filter={filter}
          tone={tone ?? "default"}
          marker={
            isToday
              ? item.id === nowId
                ? "NOW"
                : item.id === nextId
                  ? "NEXT"
                  : undefined
              : undefined
          }
          status={statusOf(item.id)}
          onStatus={(s) => swipeStatus(item, s)}
          onOpen={() => setOpenId(item.id)}
        />
      )}
    />
  );

  return (
    <AppShell>
      <div className="grid grid-cols-3 gap-1.5">
        {DAY_TABS.map((tab) => (
          <button
            key={tab.date}
            type="button"
            onClick={() => setDate(tab.date)}
            className={cn(
              "min-h-11 rounded-md border text-xs font-semibold",
              date === tab.date
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-muted-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {FILTERS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setFilter(id);
              if (id !== "all") setRole(id);
            }}
            className={cn(
              "min-h-11 rounded-md border text-xs font-semibold",
              filter === id
                ? "border-primary text-primary"
                : "border-border bg-secondary text-muted-foreground",
            )}
          >
            {id === "all" ? "All" : CREW_LABEL[id]}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <p className="num min-w-0 truncate text-[11px] text-muted-foreground">
            {DAY_LABELS[date]} ·{" "}
            {isToday ? `now ${mounted ? now.clock : "—"}` : "not today"}
          </p>
          <p className="num shrink-0 text-[11px] font-bold">
            {doneCount}/{items.length} done
          </p>
        </div>
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Day progress"
          className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {isToday && (
        <section>
          <SectionLabel>Now</SectionLabel>
          {nowItems.length > 0 ? (
            renderList(nowItems, "now")
          ) : (
            <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              Nothing scheduled right now
              {nextItems[0]
                ? ` — next in ${formatDuration(nextItems[0].startMin - now.min)}.`
                : "."}
            </p>
          )}
        </section>
      )}

      {nextItems.length > 0 && (
        <section>
          <SectionLabel>Next</SectionLabel>
          {renderList(nextItems)}
        </section>
      )}

      {laterItems.length > 0 && (
        <section>
          <SectionLabel>{isToday ? "Later today" : "Rest of day"}</SectionLabel>
          {renderList(laterItems)}
        </section>
      )}

      {past.length > 0 && (
        <section>
          <SectionLabel>Earlier today</SectionLabel>
          {renderList(past)}
        </section>
      )}

      {items.length === 0 && (
        <EmptyState
          title="No blocks for this filter"
          body={
            filter === "all"
              ? "This day has no scheduled coverage yet."
              : `${CREW_LABEL[filter as Exclude<CrewFilter, "all">]} has nothing assigned on this day.`
          }
          actionLabel="Show all crew"
          onAction={() => setFilter("all")}
        />
      )}

      <ItemSheet item={open} onClose={() => setOpenId(null)} />

      {undo && (
        <div className="fixed inset-x-3 bottom-24 z-40 flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
          <span className="min-w-0 truncate text-[11px] text-muted-foreground">
            {undo.title} updated
          </span>
          <button
            type="button"
            onClick={() => {
              setStatus(undo.id, undo.prev);
              setUndo(null);
            }}
            className="shrink-0 rounded-md border border-primary px-3 py-1.5 text-[11px] font-bold text-primary uppercase"
          >
            Undo
          </button>
        </div>
      )}
    </AppShell>
  );
}
