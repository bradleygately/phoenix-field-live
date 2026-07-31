import { useMemo, useState } from "react";

import { BUILDINGS, type Building } from "@/lib/settings";
import { estimateTravel, haversineMeters } from "@/lib/travel";
import { cn } from "@/lib/utils";

type PinId = "westin" | "jw" | "element" | "home2";

interface Pin {
  id: PinId;
  building: Building;
  who: string;
  short: string;
  initial: string;
  color: string;
  venue?: boolean;
  rig: boolean;
}

/** Crew home bases plus the venue. Coordinates come from the verified building table. */
export const PINS: Pin[] = [
  {
    id: "westin",
    building: BUILDINGS.westin,
    who: "Event venue",
    short: "Westin",
    initial: "W",
    color: "var(--gold)",
    venue: true,
    rig: false,
  },
  {
    id: "jw",
    building: BUILDINGS.jw,
    who: "Duane",
    short: "JW Marriott",
    initial: "D",
    color: "var(--crew-duane)",
    rig: false,
  },
  {
    id: "element",
    building: BUILDINGS.element,
    who: "Jesse",
    short: "Element",
    initial: "J",
    color: "var(--crew-jesse)",
    rig: true,
  },
  {
    id: "home2",
    building: BUILDINGS.home2,
    who: "Brad",
    short: "Home2 Suites",
    initial: "B",
    color: "var(--crew-brad)",
    rig: true,
  },
];

const W = 340;
const H = 420;
const PAD = 64;

function useProjection() {
  return useMemo(() => {
    const lats = PINS.map((p) => p.building.lat);
    const lons = PINS.map((p) => p.building.lon);
    const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const k = Math.cos((midLat * Math.PI) / 180);
    const xs = lons.map((l) => l * k);
    const minX = Math.min(...xs);
    const minY = Math.min(...lats);
    const spanX = Math.max(...xs) - minX || 1e-6;
    const spanY = Math.max(...lats) - minY || 1e-6;
    // Uniform scale so the walking distances stay visually honest.
    const scale = Math.min((W - PAD * 2) / spanX, (H - PAD * 2) / spanY);
    const offX = (W - spanX * scale) / 2;
    const offY = (H - spanY * scale) / 2;
    return (b: Building) => ({
      x: offX + (b.lon * k - minX) * scale,
      y: H - offY - (b.lat - minY) * scale,
    });
  }, []);
}

function walkTo(pin: Pin) {
  const est = estimateTravel(pin.building.label, "Westin Lobby", {
    carryingRig: pin.rig,
  });
  const meters = Math.round(haversineMeters(pin.building, BUILDINGS.westin));
  return { minutes: est.minutes, meters };
}

/**
 * Hand-drawn uptown Charlotte map: a Google-Maps-style legible surface with no
 * network tiles, so it still reads inside the ballroom with no signal.
 */
export function CrewMap() {
  const project = useProjection();
  const [active, setActive] = useState<PinId>("westin");
  const westin = project(BUILDINGS.westin);
  const activePin = PINS.find((p) => p.id === active)!;
  const activeWalk = activePin.venue ? null : walkTo(activePin);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-border bg-map-land shadow-sm">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          role="img"
          aria-label="Map of the Westin Charlotte venue and the three crew hotels"
        >
          <rect width={W} height={H} fill="var(--map-land)" />

          <g transform={`rotate(-32 ${W / 2} ${H / 2})`}>
            {Array.from({ length: 14 }).map((_, i) => (
              <g key={`b${i}`}>
                <rect x={-160 + i * 62} y={-200} width={46} height={900} fill="var(--map-block)" />
                <rect x={-200} y={-160 + i * 62} width={900} height={46} fill="var(--map-block)" />
              </g>
            ))}
            {Array.from({ length: 14 }).map((_, i) => (
              <g key={`r${i}`} strokeLinecap="round">
                <line
                  x1={-137 + i * 62}
                  y1={-200}
                  x2={-137 + i * 62}
                  y2={700}
                  strokeWidth={i % 3 === 0 ? 13 : 8}
                  stroke={i % 3 === 0 ? "var(--map-road-major)" : "var(--map-road)"}
                />
                <line
                  x1={-200}
                  y1={-137 + i * 62}
                  x2={700}
                  y2={-137 + i * 62}
                  strokeWidth={i % 4 === 1 ? 13 : 8}
                  stroke={i % 4 === 1 ? "var(--map-road-major)" : "var(--map-road)"}
                />
              </g>
            ))}
            <rect x={205} y={252} width={124} height={94} rx={6} fill="var(--map-park)" />
          </g>

          {PINS.filter((p) => !p.venue).map((p) => {
            const a = project(p.building);
            return (
              <polyline
                key={`route-${p.id}`}
                points={`${a.x},${a.y} ${a.x},${westin.y} ${westin.x},${westin.y}`}
                fill="none"
                stroke={p.color}
                strokeWidth={active === p.id ? 6 : 4}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1 9"
                opacity={active === p.id ? 1 : 0.6}
              />
            );
          })}

          {PINS.map((p) => {
            const { x, y } = project(p.building);
            const on = active === p.id;
            const scale = on ? 1.15 : 1;
            return (
              <g
                key={p.id}
                transform={`translate(${x} ${y})`}
                onClick={() => setActive(p.id)}
                className="cursor-pointer"
                aria-label={`${p.short}, ${p.who}`}
              >
                <ellipse cx={0} cy={2} rx={11} ry={4} fill="oklch(0 0 0 / 22%)" />
                <g transform={`scale(${scale})`}>
                  <path
                    d="M0 0 C -13 -14 -16 -22 -16 -28 A 16 16 0 1 1 16 -28 C 16 -22 13 -14 0 0 Z"
                    fill={p.color}
                    stroke="var(--map-land)"
                    strokeWidth={on ? 3 : 2}
                  />
                  <circle cx={0} cy={-28} r={8.5} fill="var(--map-land)" />
                  <text
                    x={0}
                    y={-24.5}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={700}
                    fill={p.color}
                  >
                    {p.initial}
                  </text>
                </g>
                <text
                  x={0}
                  y={20}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill="var(--map-label)"
                  stroke="var(--map-land)"
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {p.short}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PINS.map((p) => {
          const walk = p.venue ? null : walkTo(p);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(p.id)}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-lg border p-2 text-left",
                active === p.id ? "border-primary bg-secondary" : "border-border bg-card",
              )}
            >
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ background: p.color }}
              />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold">{p.who}</span>
                <span className="num block truncate text-[10px] text-muted-foreground">
                  {p.short}
                  {walk ? ` · ${walk.minutes} min` : " · venue"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-sm font-semibold">{activePin.building.label}</p>
        <p className="num text-[11px] text-muted-foreground">
          {activePin.building.address} · Charlotte, NC
        </p>
        {activeWalk ? (
          <p className="num mt-2 text-xs">
            <span className="font-bold text-primary">{activeWalk.minutes} min</span> door to
            Westin lobby · {activeWalk.meters} m direct ·{" "}
            {activePin.rig ? "with rig" : "light"}
          </p>
        ) : (
          <p className="num mt-2 text-xs text-muted-foreground">
            All coverage runs from here — Main Stage, Promenade, Tryon, Harris, Trade,
            Kings.
          </p>
        )}
        <a
          className="num mt-3 inline-flex min-h-11 items-center rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground"
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            `${activePin.building.label.replace(/\s*\(.*\)/, "")}, ${activePin.building.address}, Charlotte, NC`,
          )}&travelmode=walking`}
          target="_blank"
          rel="noreferrer"
        >
          Walking directions
        </a>
      </div>
    </div>
  );
}