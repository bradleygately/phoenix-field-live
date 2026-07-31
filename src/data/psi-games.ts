/** Official PSI Games International reference data. Display-only, immutable. */

export const ORG = {
  name: "PSI Games International",
  description:
    "Educational conference and competitive event focused on psi abilities, consciousness, research, and community.",
  founder: "Hakim Isler",
} as const;

export const EVENT = {
  name: "PSI Games",
  venue: "Westin Charlotte",
  city: "Charlotte",
  state: "NC",
  duration: "3 Days",
} as const;

export interface Competition {
  id: string;
  name: string;
  description: string;
}

export const COMPETITIONS: Competition[] = [
  { id: "remote_viewing", name: "Remote Viewing", description: "Perceive distant or hidden targets." },
  { id: "precognition", name: "Precognition", description: "Information about future events." },
  { id: "mindsight", name: "Mind Sight", description: "Perception without ordinary vision." },
  { id: "psychokinesis", name: "Psychokinesis", description: "Influence physical systems through intention." },
  { id: "dowsing", name: "Dowsing", description: "Detect hidden information using intuitive methods." },
];

export const EDUCATION: { label: string; detail: string }[] = [
  { label: "Lectures", detail: "Expert presentations" },
  { label: "Workshops", detail: "Hands-on training" },
  { label: "Masterclasses", detail: "Advanced instruction" },
];

export const KEYNOTE_SPEAKERS = [
  "Laura Lynne Jackson",
  "Rizwan Virk",
  "Simon Duan",
];

export const FEATURED_FACULTY = [
  "Paul H Smith",
  "Chris Bledsoe",
  "Amy Westmoreland",
  "Jon Warren",
  "Michelle Freed",
  "Rachel Vala",
  "Alexandra Kelly",
  "Sarah Driver",
  "Christopher Bien",
  "Chris Jordan",
  "Bee McBride",
  "David Coleman",
  "Jules Feibelmann",
  "Nasiru Janneh",
];

export const TICKETS: { name: string; description: string }[] = [
  { name: "Silver", description: "Conference admission and keynote access." },
  { name: "Gold", description: "Silver benefits plus workshops and merchandise." },
  { name: "Platinum", description: "VIP access with all workshops and exclusive experiences." },
];

export const VENUE_SPACES = [
  "Registration",
  "Main Stage",
  "Competition Rooms",
  "Workshop Rooms",
  "Vendor Hall",
  "VIP Area",
];
