import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Panel, PriorityPill, RoomPill, SectionLabel } from "@/components/primitives";
import { CrewStrip } from "@/components/live/CrewStrip";
import { ItemRow } from "@/components/live/ItemRow";
import { LeaveByCard } from "@/components/live/LeaveByCard";
import { NowCard } from "@/components/live/NowCard";
import { QuickActions } from "@/components/live/QuickActions";
import { StatusButtons } from "@/components/live/StatusButtons";
import {
  computeLeaveBy,
  computeWarnings,
  itemsForDate,
  nextForRole,
  nextItem,
  pickLead,
  positionOf,
  runningNow,
} from "@/lib/live";
import { formatDuration } from "@/lib/time";
import { useStore } from "@/state/store";
import { EVENT_DATES } from "@/lib/time";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Live · PSI Games Crew Control" },
      {
        name: "description",
        content:
          "The current block, leave-by countdowns and crew positions for the Mojo Phoenix crew at PSI Games 2026.",
      },
      { property: "og:title", content: "Live · PSI Games Crew Control" },
      {
        property: "og:description",
        content:
          "The current block, leave-by countdowns and crew positions for the Mojo Phoenix crew at PSI Games 2026.",
      },
    ],
  }),
  component: LiveScreen,
});

function LiveScreen() {
  const { schedule, role, now, crew, statusOf, setStatus, addLog, settings, epochMs } =
    useStore();
  const [showWarnings, setShowWarnings] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);

  const date = EVENT_DATES.includes(now.date) ? now.date : EVENT_DATES[0]!;
  const items = useMemo(() => itemsForDate(schedule, date), [schedule, date]);
  const running = runningNow(items, now.min);
  const autoLead = pickLead(running, role);
  const lead = running.find((i) => i.id === focusId) ?? autoLead;
  const also = running.filter((i) => i.id !== lead?.id);
  const upcoming = nextItem(items, now.min);
  const warnings = useMemo(
    () => computeWarnings(items, crew, now.min, settings),
    [items, crew, now.min, settings],
  );

  const myPosition = positionOf(crew, role, items, now.min, epochMs);
  const currentRoom =
    myPosition.room !== "Unknown" ? myPosition.room : (lead?.room ?? "Westin Lobby");
  const leavePlan = computeLeaveBy(items, role, currentRoom, now.min, settings);

  const nextThree = nextForRole(items, role, now.min, 3);
  const nextThreeIds = new Set(nextThree.map((i) => i.id));
  const rest = items.filter(
    (i) => i.endMin > now.min && !nextThreeIds.has(i.id) && i.id !== lead?.id,
  );

  return (
    <AppShell
      warningCount={warnings.length}
      onWarnings={() => setShowWarnings((v) => !v)}
    >
      {showWarnings && (
        <Panel tone={warnings.length ? "alert" : "default"}>
          <SectionLabel>Warnings</SectionLabel>
          {warnings.length === 0 ? (
            <p className="text-xs text-muted-foreground">No conflicts detected.</p>
          ) : (
            <ul className="space-y-1 text-[11px]">
              {warnings.map((w) => (
                <li
                  key={w.id}
                  className={
                    w.level === "critical" ? "text-destructive" : "text-primary"
                  }
                >
                  {w.text}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {lead ? (
        <>
          <NowCard
            item={lead}
            role={role}
            min={now.min}
            seconds={now.seconds}
            status={statusOf(lead.id)}
          />
          <StatusButtons
            current={statusOf(lead.id)}
            onSelect={(status) => setStatus(lead.id, status)}
          />
        </>
      ) : (
        <Panel className="space-y-1">
          <SectionLabel>No scheduled block</SectionLabel>
          {upcoming ? (
            <>
              <p className="text-sm font-semibold">
                Next: {upcoming.title}
              </p>
              <p className="num text-xs text-muted-foreground">
                {upcoming.startLabel} · {upcoming.room} · in{" "}
                {formatDuration(upcoming.startMin - now.min)}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nothing left on today's schedule. Use the time simulator to rehearse a
              block.
            </p>
          )}
        </Panel>
      )}

      <QuickActions
        onAction={(kind, text) =>
          addLog(lead ? { kind, text, itemId: lead.id } : { kind, text })
        }
      />

      {also.length > 0 && (
        <Panel>
          <SectionLabel>Also running now</SectionLabel>
          <ul className="space-y-1">
            {also.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setFocusId(item.id)}
                  className="tap flex w-full items-center gap-1.5 rounded border border-border bg-secondary px-2 py-1.5 text-left"
                >
                  <PriorityPill priority={item.priority} />
                  <RoomPill room={item.room} />
                  <span className="min-w-0 flex-1 truncate text-[11px]">
                    {item.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {leavePlan && (
        <LeaveByCard plan={leavePlan} min={now.min} seconds={now.seconds} />
      )}

      <CrewStrip items={items} min={now.min} />

      {nextThree.length > 0 && (
        <section>
          <SectionLabel>Next three for {role}</SectionLabel>
          <ul className="space-y-2">
            {nextThree.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                role={role}
                status={statusOf(item.id)}
                onStatus={(s) => setStatus(item.id, s)}
              />
            ))}
          </ul>
        </section>
      )}

      {rest.length > 0 && (
        <section>
          <SectionLabel>Rest of the day</SectionLabel>
          <ul className="space-y-2">
            {rest.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                role={role}
                status={statusOf(item.id)}
                onStatus={(s) => setStatus(item.id, s)}
                compact
              />
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}