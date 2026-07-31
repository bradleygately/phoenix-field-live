import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import {
  Panel,
  PriorityPill,
  RoomPill,
  SectionLabel,
  StatusChip,
  TapButton,
} from "@/components/primitives";
import { ChangeSheet } from "@/components/sheets/ChangeSheet";
import { ReassignSheet } from "@/components/sheets/ReassignSheet";
import { computeWarnings, isCommitted, itemsForDate } from "@/lib/live";
import { DAY_LABELS, EVENT_DATES, formatDuration } from "@/lib/time";
import { estimateTravel } from "@/lib/travel";
import { useStore } from "@/state/store";
import { CREW_IDS, type CrewId, type ScheduleItem } from "@/types";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline · PSI Games Crew Control" },
      {
        name: "description",
        content: "Full three-day PSI Games 2026 run of show with crew assignments.",
      },
      { property: "og:title", content: "Timeline · PSI Games Crew Control" },
      {
        property: "og:description",
        content: "Full three-day PSI Games 2026 run of show with crew assignments.",
      },
    ],
  }),
  component: TimelineScreen,
});

function TimelineScreen() {
  const { schedule, crew, now, role, statusOf, settings } = useStore();
  const [date, setDate] = useState(
    EVENT_DATES.includes(now.date) ? now.date : EVENT_DATES[0]!,
  );
  const [lane, setLane] = useState<CrewId | "all">(role);
  const [committedOnly, setCommittedOnly] = useState(false);
  const [openItem, setOpenItem] = useState<ScheduleItem | null>(null);
  const [sheet, setSheet] = useState<"change" | "reassign" | null>(null);

  const items = useMemo(() => itemsForDate(schedule, date), [schedule, date]);
  const warnings = useMemo(
    () => computeWarnings(items, crew, now.min, settings),
    [items, crew, now.min, settings],
  );
  const warnByItem = new Map(warnings.map((w) => [w.itemId, w]));

  const visible = items.filter((item) => {
    if (lane !== "all") {
      const mine = isCommitted(item, lane) || Boolean(item[lane]);
      if (!mine) return false;
      if (committedOnly && !isCommitted(item, lane)) return false;
    } else if (committedOnly) {
      if (!CREW_IDS.some((c) => isCommitted(item, c))) return false;
    }
    return true;
  });

  return (
    <AppShell warningCount={warnings.length}>
      <div className="grid grid-cols-3 gap-1.5">
        {EVENT_DATES.map((d) => (
          <TapButton
            key={d}
            tone="gold"
            active={d === date}
            className="h-10 text-[11px]"
            onClick={() => setDate(d)}
          >
            {DAY_LABELS[d]?.split(" · ")[0] ?? d}
          </TapButton>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <TapButton active={lane === "all"} className="h-9" onClick={() => setLane("all")}>
          All
        </TapButton>
        {CREW_IDS.map((c) => (
          <TapButton
            key={c}
            active={lane === c}
            className="h-9 capitalize"
            onClick={() => setLane(c)}
          >
            {c}
          </TapButton>
        ))}
      </div>
      <TapButton
        tone="gold"
        active={committedOnly}
        className="h-9 w-full"
        onClick={() => setCommittedOnly((v) => !v)}
      >
        {committedOnly ? "Showing real commitments only" : "Showing all (incl. advisory)"}
      </TapButton>

      <ul className="space-y-2">
        {visible.map((item, index) => {
          const previous = visible[index - 1];
          const gap =
            previous && lane !== "all" && isCommitted(item, lane) && isCommitted(previous, lane)
              ? gapInfo(previous, item, lane, settings)
              : null;
          const warning = warnByItem.get(item.id);
          const isNow = now.date === date && now.min >= item.startMin && now.min < item.endMin;
          return (
            <li key={item.id} className="space-y-1">
              {gap && (
                <p
                  className={`num text-[10px] ${gap.tight ? "text-destructive" : "text-muted-foreground"}`}
                >
                  ↕ {formatDuration(gap.available)} gap · travel needs {gap.needed}m
                  {gap.tight ? " — TOO TIGHT" : ""}
                </p>
              )}
              <button
                type="button"
                onClick={() => setOpenItem(openItem?.id === item.id ? null : item)}
                className={`w-full rounded-lg border p-2 text-left ${
                  isNow ? "border-primary" : warning ? "border-destructive" : "border-border"
                } bg-card`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="num w-16 shrink-0 text-[11px] font-bold">
                    {item.startLabel}
                  </span>
                  <PriorityPill priority={item.priority} />
                  <RoomPill room={item.room} changed={item.room !== item.roomOfficial} />
                  <StatusChip status={statusOf(item.id)} />
                </div>
                <p className="mt-1 text-[12px] leading-snug font-semibold">{item.title}</p>
                {item.presenter && (
                  <p className="text-[10px] text-muted-foreground">{item.presenter}</p>
                )}
                {lane !== "all" && item[lane] && (
                  <p className="mt-0.5 text-[11px]">
                    <span
                      className={`num mr-1 rounded border px-1 text-[9px] ${
                        isCommitted(item, lane)
                          ? "border-primary text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {isCommitted(item, lane) ? "COMMITTED" : "ADVISORY"}
                    </span>
                    {item[lane]}
                  </p>
                )}
                {warning && (
                  <p className="mt-0.5 text-[10px] text-destructive">{warning.text}</p>
                )}
                {item.incomplete && (
                  <p className="mt-0.5 text-[10px] text-primary">
                    Official listing incomplete — Brad verifies the room in the morning.
                  </p>
                )}
              </button>

              {openItem?.id === item.id && (
                <Panel className="space-y-1.5">
                  <SectionLabel>Block detail</SectionLabel>
                  <p className="num text-[10px] text-muted-foreground">
                    Official room: {item.roomOfficial} · {item.startLabel}–{item.endLabel}
                  </p>
                  {CREW_IDS.map((c) =>
                    item[c] ? (
                      <p key={c} className="text-[11px]">
                        <span className="font-semibold capitalize">{c}:</span> {item[c]}
                      </p>
                    ) : null,
                  )}
                  {item.goal && (
                    <p className="text-[11px] text-muted-foreground">Goal: {item.goal}</p>
                  )}
                  {item.release && (
                    <p className="text-[11px] text-muted-foreground">
                      Release: {item.release}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <TapButton className="h-10" onClick={() => setSheet("change")}>
                      Log change
                    </TapButton>
                    <TapButton className="h-10" onClick={() => setSheet("reassign")}>
                      Reassign
                    </TapButton>
                  </div>
                </Panel>
              )}
            </li>
          );
        })}
      </ul>

      <ChangeSheet
        open={sheet === "change"}
        onClose={() => setSheet(null)}
        item={openItem}
      />
      <ReassignSheet
        open={sheet === "reassign"}
        onClose={() => setSheet(null)}
        item={openItem}
      />
    </AppShell>
  );
}

function gapInfo(
  previous: ScheduleItem,
  item: ScheduleItem,
  lane: CrewId,
  settings: ReturnType<typeof useStore>["settings"],
) {
  const available = item.startMin - previous.endMin;
  if (previous.room.toLowerCase() === item.room.toLowerCase()) return null;
  const needed = estimateTravel(previous.room, item.room, {
    carryingRig: lane === "jesse",
    setup: lane === "jesse" ? "fullRig" : "runGun",
    teardown: true,
    settings,
  }).minutes;
  return { available, needed, tight: available < needed };
}