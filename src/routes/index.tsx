import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { SectionLabel } from "@/components/primitives";
import { AgendaCard } from "@/components/agenda/AgendaCard";
import { ItemSheet } from "@/components/agenda/ItemSheet";
import { CREW_LABEL, matchesCrew, type CrewFilter } from "@/components/agenda/agenda";
import { cn } from "@/lib/utils";
import { itemsForDate } from "@/lib/live";
import { DAY_LABELS, EVENT_DATES, formatDuration } from "@/lib/time";
import { useStore } from "@/state/store";
import { CREW_IDS, type ScheduleItem } from "@/types";

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
  const { schedule, now, role, setRole, statusOf, setStatus } = useStore();
  const today = EVENT_DATES.includes(now.date) ? now.date : EVENT_DATES[0]!;
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState<CrewFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

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

  const open = items.find((i) => i.id === openId) ?? null;

  const renderList = (list: ScheduleItem[], tone?: "now") => (
    <ul className="space-y-2">
      {list.map((item) => (
        <AgendaCard
          key={item.id}
          item={item}
          filter={filter}
          tone={tone ?? "default"}
          status={statusOf(item.id)}
          onStatus={(s) => setStatus(item.id, s)}
          onOpen={() => setOpenId(item.id)}
        />
      ))}
    </ul>
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

      <p className="num text-[11px] text-muted-foreground">
        {DAY_LABELS[date]} · {role ? "" : ""}
        {isToday ? `now ${now.clock}` : "not today"}
      </p>

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
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          No blocks for this filter.
        </p>
      )}

      <ItemSheet item={open} onClose={() => setOpenId(null)} />
    </AppShell>
  );
}
