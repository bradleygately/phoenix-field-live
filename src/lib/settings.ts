export interface Building {
  id: string;
  label: string;
  address: string;
  lat: number;
  lon: number;
}

export const BUILDINGS: Record<string, Building> = {
  westin: {
    id: "westin",
    label: "The Westin Charlotte",
    address: "601 S College St",
    lat: 35.2221036,
    lon: -80.8472698,
  },
  jw: {
    id: "jw",
    label: "JW Marriott (Duane)",
    address: "600 S College St",
    lat: 35.2223858,
    lon: -80.8481961,
  },
  element: {
    id: "element",
    label: "Element Uptown (Jesse)",
    address: "650 S Caldwell St",
    lat: 35.2199832,
    lon: -80.8460039,
  },
  home2: {
    id: "home2",
    label: "Home2 Suites Uptown (Brad)",
    address: "610 S Caldwell St",
    lat: 35.2201969,
    lon: -80.8453622,
  },
};

export const VENUE_NODES = [
  "Main Stage",
  "Promenade",
  "Tryon",
  "Harris",
  "Trade",
  "Kings",
  "Lobby",
  "Staging",
  "Outdoor",
] as const;

export type VenueNode = (typeof VENUE_NODES)[number];

export interface TravelSettings {
  gridFactor: number;
  walkRig: number;
  walkLight: number;
  exitBuilding: number;
  enterVenue: number;
  enterLobby: number;
  contingency: number;
  contingencyThreshold: number;
  hallwayCongestion: number;
  roomDefault: number;
  setupFullRig: number;
  setupRunGun: number;
  setupInterview: number;
  teardown: number;
}

export const DEFAULT_SETTINGS: TravelSettings = {
  gridFactor: 1.4,
  walkRig: 62,
  walkLight: 80,
  exitBuilding: 2,
  enterVenue: 3,
  enterLobby: 2,
  contingency: 2,
  contingencyThreshold: 3,
  hallwayCongestion: 1,
  roomDefault: 3,
  setupFullRig: 6,
  setupRunGun: 2,
  setupInterview: 8,
  teardown: 4,
};

export const SETTINGS_FIELDS: {
  key: keyof TravelSettings;
  label: string;
  unit: string;
  step: number;
}[] = [
  { key: "gridFactor", label: "Street grid factor", unit: "x", step: 0.05 },
  { key: "walkRig", label: "Walk speed with rig", unit: "m/min", step: 1 },
  { key: "walkLight", label: "Walk speed light", unit: "m/min", step: 1 },
  { key: "exitBuilding", label: "Exit building", unit: "min", step: 1 },
  { key: "enterVenue", label: "Enter Westin + find room", unit: "min", step: 1 },
  { key: "enterLobby", label: "Enter other lobby", unit: "min", step: 1 },
  { key: "contingency", label: "Contingency", unit: "min", step: 1 },
  {
    key: "contingencyThreshold",
    label: "Contingency applies over",
    unit: "min walk",
    step: 1,
  },
  { key: "hallwayCongestion", label: "Hallway congestion", unit: "min", step: 1 },
  { key: "roomDefault", label: "Default room-to-room", unit: "min", step: 1 },
  { key: "setupFullRig", label: "Setup: full rig", unit: "min", step: 1 },
  { key: "setupRunGun", label: "Setup: run-and-gun", unit: "min", step: 1 },
  { key: "setupInterview", label: "Setup: formal interview", unit: "min", step: 1 },
  { key: "teardown", label: "Teardown", unit: "min", step: 1 },
];

type Pair = [VenueNode, VenueNode, number];

const ROOM_PAIRS: Pair[] = [
  ["Main Stage", "Promenade", 4],
  ["Main Stage", "Kings", 4],
  ["Main Stage", "Staging", 2],
  ["Tryon", "Harris", 2],
  ["Harris", "Trade", 2],
  ["Tryon", "Trade", 2],
  ["Kings", "Lobby", 3],
  ["Lobby", "Staging", 2],
];

const OUTDOOR_MIN = 5;
const OUTDOOR_MAX = 6;

/** Minutes between two nodes inside the Westin, excluding congestion. */
export function roomMinutes(
  a: VenueNode,
  b: VenueNode,
  settings: TravelSettings,
): number {
  if (a === b) return 0;
  if (a === "Outdoor" || b === "Outdoor") {
    const other = a === "Outdoor" ? b : a;
    return other === "Lobby" || other === "Promenade" ? OUTDOOR_MIN : OUTDOOR_MAX;
  }
  for (const [x, y, m] of ROOM_PAIRS) {
    if ((x === a && y === b) || (x === b && y === a)) return m;
  }
  return settings.roomDefault;
}