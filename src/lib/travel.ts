import {
  BUILDINGS,
  DEFAULT_SETTINGS,
  roomMinutes,
  type Building,
  type TravelSettings,
  type VenueNode,
} from "./settings";

export type SetupKind = "none" | "fullRig" | "runGun" | "interview";

export interface Place {
  building: string;
  node: VenueNode | null;
  label: string;
}

export interface Leg {
  label: string;
  minutes: number;
}

export interface TravelEstimate {
  minutes: number;
  breakdown: Leg[];
  from: Place;
  to: Place;
}

export function haversineMeters(a: Building, b: Building): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Map a raw room string from the program onto a building + venue node. */
export function resolvePlace(raw: string | undefined | null): Place {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("duane"))
    return { building: "jw", node: null, label: BUILDINGS.jw.label };
  if (s.includes("element"))
    return { building: "element", node: null, label: BUILDINGS.element.label };
  if (s.includes("home2"))
    return { building: "home2", node: null, label: BUILDINGS.home2.label };
  if (s.includes("platinum") || s.includes("outdoor"))
    return { building: "westin", node: "Outdoor", label: "Outdoor" };
  if (s.includes("main stage") || s.includes("grand ballroom"))
    return { building: "westin", node: "Main Stage", label: "Main Stage" };
  if (s.includes("promenade"))
    return { building: "westin", node: "Promenade", label: "Promenade" };
  if (s.includes("tryon")) return { building: "westin", node: "Tryon", label: "Tryon" };
  if (s.includes("harris"))
    return { building: "westin", node: "Harris", label: "Harris" };
  if (s.includes("trade")) return { building: "westin", node: "Trade", label: "Trade" };
  if (s.includes("kings")) return { building: "westin", node: "Kings", label: "Kings" };
  if (s.includes("staging"))
    return { building: "westin", node: "Staging", label: "Staging" };
  if (s.includes("lobby"))
    return { building: "westin", node: "Lobby", label: "Lobby" };
  if (s.includes("westin"))
    return { building: "westin", node: "Lobby", label: "Westin Lobby" };
  return { building: "westin", node: "Lobby", label: raw?.trim() || "Westin Lobby" };
}

/**
 * "Element to Westin" style transit strings: use the destination side.
 * Returns the arrival place for a move block.
 */
export function resolveDestination(raw: string | undefined | null): Place {
  const parts = (raw ?? "").split(/\s+to\s+/i);
  return resolvePlace(parts.length > 1 ? parts[parts.length - 1] : raw);
}

function setupMinutes(kind: SetupKind, s: TravelSettings): number {
  switch (kind) {
    case "fullRig":
      return s.setupFullRig;
    case "runGun":
      return s.setupRunGun;
    case "interview":
      return s.setupInterview;
    default:
      return 0;
  }
}

export interface TravelOptions {
  carryingRig?: boolean;
  setup?: SetupKind;
  teardown?: boolean;
  settings?: TravelSettings;
}

export function estimateTravel(
  fromRaw: string,
  toRaw: string,
  options: TravelOptions = {},
): TravelEstimate {
  const settings = options.settings ?? DEFAULT_SETTINGS;
  const carryingRig = options.carryingRig ?? true;
  const from = resolvePlace(fromRaw);
  const to = resolvePlace(toRaw);
  const breakdown: Leg[] = [];

  if (options.teardown) {
    breakdown.push({ label: "Teardown", minutes: settings.teardown });
  }

  if (from.building !== to.building) {
    const a = BUILDINGS[from.building];
    const b = BUILDINGS[to.building];
    const meters = haversineMeters(a, b) * settings.gridFactor;
    const speed = carryingRig ? settings.walkRig : settings.walkLight;
    const walk = meters / speed;
    breakdown.push({ label: "Exit building", minutes: settings.exitBuilding });
    breakdown.push({
      label: `Walk ${Math.round(meters)} m ${carryingRig ? "with rig" : "light"}`,
      minutes: walk,
    });
    breakdown.push({
      label: to.building === "westin" ? "Enter Westin + find room" : "Enter lobby",
      minutes: to.building === "westin" ? settings.enterVenue : settings.enterLobby,
    });
    if (walk > settings.contingencyThreshold) {
      breakdown.push({ label: "Contingency", minutes: settings.contingency });
    }
    if (to.building === "westin" && to.node && to.node !== "Lobby") {
      const inside = roomMinutes("Lobby", to.node, settings);
      if (inside > 0) {
        breakdown.push({ label: `Lobby to ${to.node}`, minutes: inside });
      }
    }
  } else if (from.node && to.node && from.node !== to.node) {
    breakdown.push({
      label: `${from.node} to ${to.node}`,
      minutes: roomMinutes(from.node, to.node, settings),
    });
    breakdown.push({
      label: "Hallway congestion",
      minutes: settings.hallwayCongestion,
    });
  }

  const setup = setupMinutes(options.setup ?? "none", settings);
  if (setup > 0) breakdown.push({ label: setupLabel(options.setup!), minutes: setup });

  const total = breakdown.reduce((acc, l) => acc + l.minutes, 0);
  return { minutes: Math.ceil(total), breakdown, from, to };
}

function setupLabel(kind: SetupKind): string {
  return kind === "fullRig"
    ? "Setup: full rig"
    : kind === "runGun"
      ? "Setup: run-and-gun"
      : "Setup: formal interview";
}

export const HOTEL_WALKS: { from: string; to: string; rig: boolean; label: string }[] = [
  { from: "Element", to: "Westin", rig: true, label: "Jesse · Element → Westin" },
  { from: "Home2", to: "Westin", rig: true, label: "Brad · Home2 → Westin" },
  { from: "Duane JW", to: "Westin", rig: false, label: "Duane · JW → Westin" },
];