import { Panel, SectionLabel } from "@/components/primitives";
import { VENUE_NODES } from "@/lib/settings";
import { estimateTravel } from "@/lib/travel";
import { positionOf } from "@/lib/live";
import { useStore } from "@/state/store";
import { CREW, type ScheduleItem } from "@/types";

const POSITION_OPTIONS = [
  ...VENUE_NODES,
  "Element (hotel)",
  "Home2 (hotel)",
  "Duane JW (hotel)",
];

export function CrewStrip({ items, min }: { items: ScheduleItem[]; min: number }) {
  const { crew, setPosition, clearPosition, settings, epochMs } = useStore();

  const walks = [
    { label: "Jesse · Element → Westin", from: "Element", rig: true },
    { label: "Brad · Home2 → Westin", from: "Home2", rig: true },
    { label: "Duane · JW → Westin", from: "Duane JW", rig: false },
  ].map((w) => ({
    label: w.label,
    minutes: estimateTravel(w.from, "Westin", {
      carryingRig: w.rig,
      settings,
    }).minutes,
  }));

  return (
    <Panel className="space-y-2">
      <SectionLabel>Crew positions</SectionLabel>
      <ul className="space-y-1.5">
        {CREW.map((member) => {
          const pos = positionOf(crew, member.id, items, min, epochMs);
          return (
            <li key={member.id} className="flex items-center gap-2">
              <span className="num w-12 shrink-0 text-[10px] font-bold uppercase">
                {member.id}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">
                  {pos.room}
                  {pos.source === "manual" && (
                    <span className="num ml-1 text-[9px] text-primary">MANUAL</span>
                  )}
                </span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {pos.task}
                </span>
              </span>
              <select
                aria-label={`Set ${member.name} position`}
                value={pos.source === "manual" ? pos.room : ""}
                onChange={(e) => {
                  if (e.target.value === "") clearPosition(member.id);
                  else setPosition(member.id, e.target.value);
                }}
                className="tap w-[104px] rounded-md border border-border bg-secondary px-1 text-[11px]"
              >
                <option value="">Auto</option>
                {POSITION_OPTIONS.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
      <p className="num border-t border-border pt-2 text-[10px] text-muted-foreground">
        {walks.map((w) => `${w.label} ${w.minutes}m`).join("  ·  ")}
      </p>
    </Panel>
  );
}