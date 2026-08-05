/**
 * The official published PSI Games 2026 program — the printed record for the
 * Westin Charlotte, July 31 – August 2, 2026.
 *
 * This file is display-only and immutable. It holds venue-published sessions
 * only: crew logistics (travel, meals, regroups, gear resets, wrap and backup
 * blocks) belong in schedule-source.ts and must never be added here. Titles,
 * presenters and rooms are transcribed verbatim, including placeholder titles
 * such as "Presentation", because the crew reconcile live changes against
 * exactly what the program says.
 */

import { formatMin, parseTimeInput } from "@/lib/time";
import type { ProgramSession, ProgramTrack } from "@/types";

interface Draft {
  /** "9:00 AM" — as printed. */
  start: string;
  end: string;
  room: string;
  title: string;
  speakers?: string[];
  track: ProgramTrack;
  minors?: boolean;
  platinum?: boolean;
  incomplete?: boolean;
  note?: string;
}

function minutes(printed: string): number {
  const min = parseTimeInput(printed);
  if (min === null) throw new Error(`Unparseable program time: "${printed}"`);
  return min;
}

function build(date: string, drafts: Draft[]): ProgramSession[] {
  return drafts.map((d, index) => {
    const startMin = minutes(d.start);
    const endMin = minutes(d.end);
    return {
      id: `p-${date}-${String(index + 1).padStart(2, "0")}`,
      date,
      startMin,
      endMin,
      startLabel: formatMin(startMin),
      endLabel: formatMin(endMin),
      title: d.title,
      speakers: d.speakers ?? [],
      room: d.room,
      track: d.track,
      minors: d.minors,
      platinum: d.platinum,
      incomplete: d.incomplete,
      note: d.note,
    } satisfies ProgramSession;
  });
}

/* ------------------------- Day 1 · Friday 2026-07-31 ---------------------- */

const FRIDAY: Draft[] = [
  {
    start: "9:00 AM",
    end: "10:30 AM",
    room: "Promenade",
    title: "Registration & Badge Pickup",
    track: "registration",
    note: "2nd level promenade",
  },
  {
    start: "10:30 AM",
    end: "11:00 AM",
    room: "Main Stage",
    title: "Welcome Remarks",
    speakers: ["Hakim Isler", "Anne Palmer"],
    track: "remarks",
  },
  {
    start: "11:00 AM",
    end: "11:45 AM",
    room: "Main Stage",
    title: "Keynote: From Practice to Theory: What Psi Reveals About the Nature of Reality",
    speakers: ["Dr. Simon Duan"],
    track: "keynote",
  },
  {
    start: "11:45 AM",
    end: "12:30 PM",
    room: "Main Stage",
    title: "Keynote Fireside Chat",
    speakers: ["Anne Palmer", "Laura Lynne Jackson"],
    track: "keynote",
  },
  {
    start: "12:30 PM",
    end: "1:15 PM",
    room: "Main Stage",
    title: "Presentation",
    speakers: ["Thomas Campbell"],
    track: "presentation",
  },
  {
    start: "12:30 PM",
    end: "1:15 PM",
    room: "Tryon",
    title: "The Science Behind Energy Healing: From Practice to the Lab",
    speakers: ["John Kruth"],
    track: "presentation",
  },
  {
    start: "12:30 PM",
    end: "1:15 PM",
    room: "Harris",
    title: "Born Already Perceiving: What Children Know Before the World Teaches Them to Doubt It",
    speakers: ["Dr. Iya Whiteley"],
    track: "presentation",
    minors: true,
  },
  {
    start: "12:30 PM",
    end: "1:15 PM",
    room: "Trade",
    title: "Behind the Curtain: Lessons from Practical Remote Viewing Work",
    speakers: ["Jana Rogge"],
    track: "presentation",
  },
  {
    start: "1:15 PM",
    end: "2:00 PM",
    room: "Main Stage",
    title: "PSI Founding Father: The Extraordinary Psychic Abilities of Edgar Cayce",
    speakers: ["Christopher Naughton", "Jim Vieira"],
    track: "presentation",
  },
  {
    start: "3:30 PM",
    end: "4:15 PM",
    room: "Main Stage",
    title: "Presentation",
    speakers: ["Chris Bledsoe"],
    track: "presentation",
  },
  {
    start: "3:30 PM",
    end: "4:15 PM",
    room: "Tryon",
    title: "Remote Viewing: Experience Your Infinite Mind",
    speakers: ["Alan Steinfeld", "Dr. J.J. Hurtak", "Dr. Desiree Hurtak"],
    track: "presentation",
  },
  {
    start: "3:30 PM",
    end: "4:15 PM",
    room: "Harris",
    title: "Learning to Discern True Intuition from Imagination",
    speakers: ["Pam Coronado"],
    track: "presentation",
  },
  {
    start: "3:30 PM",
    end: "4:15 PM",
    room: "Trade",
    title: "Everyday Genius: Unlocking Your Hidden Potential",
    speakers: ["Nelson Dellis"],
    track: "presentation",
  },
  {
    start: "4:15 PM",
    end: "5:15 PM",
    room: "Main Stage",
    title: "Controlled Remote Viewing: The Teachings of Ingo Swann",
    speakers: ["Tom McNear"],
    track: "presentation",
  },
  {
    start: "4:45 PM",
    end: "5:45 PM",
    room: "Tryon",
    title: "Astrology as a Map of Psychic Sensitivity",
    speakers: ["Cheryl Hopkins"],
    track: "presentation",
  },
  {
    start: "4:45 PM",
    end: "5:45 PM",
    room: "Harris",
    title: "A New Way of Quieting the Mind and Reaching Out to NHI",
    speakers: ["Sean Webb"],
    track: "presentation",
  },
  {
    start: "4:45 PM",
    end: "5:45 PM",
    room: "Trade",
    title: "Why We Come to Earth: The Hidden Purpose of Human Experience",
    speakers: ["Jordan Crowder"],
    track: "presentation",
  },
  {
    start: "5:15 PM",
    end: "6:00 PM",
    room: "Main Stage",
    title: "The Power of Precognitive Dreaming: Becoming a Synchronistic Navigator",
    speakers: ["Dale Graff"],
    track: "presentation",
  },
  {
    start: "6:00 PM",
    end: "6:30 PM",
    room: "Main Stage",
    title: "Kids Panel: Next Generation of Psioneers",
    speakers: ["Nicola Farmer", "Theo Kowalski", "Dalbus Jordan", "Axel Desbien", "Nikhila Mhetre"],
    track: "panel",
    minors: true,
  },
  {
    start: "6:00 PM",
    end: "6:30 PM",
    room: "Tryon",
    title: "The Hidden Super Humans Living Among Us",
    speakers: ["Tigo Bizzel"],
    track: "presentation",
  },
  {
    start: "6:00 PM",
    end: "6:30 PM",
    room: "Harris",
    title: "The Sovereign Mind",
    speakers: ["Gary Kraftsow"],
    track: "presentation",
  },
  {
    start: "6:00 PM",
    end: "6:30 PM",
    room: "Trade",
    title: "The Magic of Plasma & Consciousness",
    speakers: ["Dana Kippel"],
    track: "presentation",
  },
  {
    start: "6:30 PM",
    end: "8:00 PM",
    room: "Main Stage",
    title: "COMMUNITY EVENT: Superhuman 2 Film Screening + Panel Discussion",
    track: "community",
  },
];

/* ------------------------ Day 2 · Saturday 2026-08-01 --------------------- */

const SATURDAY: Draft[] = [
  {
    start: "8:00 AM",
    end: "8:30 AM",
    room: "Main Stage / Lobby",
    title: "Registration & Badge Pickup",
    track: "registration",
  },
  {
    start: "8:30 AM",
    end: "8:45 AM",
    room: "Main Stage",
    title: "Opening Remarks",
    speakers: ["Hakim Isler", "Anne Palmer"],
    track: "remarks",
  },
  {
    start: "8:45 AM",
    end: "10:15 AM",
    room: "Main Stage",
    title: "Seeing Beyond the Blindfold",
    speakers: [
      "Jeff Tarrant",
      "Ann DeSollar",
      "Shaun Jordan",
      "Dalia Burgoin",
      "Elan Gepner-Dales",
    ],
    track: "panel",
  },
  {
    start: "10:15 AM",
    end: "10:30 AM",
    room: "Main Stage",
    title: "Psi Games 2026 Introduction to the Games",
    speakers: ["Hakim Isler"],
    track: "remarks",
  },
  {
    start: "10:30 AM",
    end: "12:00 PM",
    room: "Main Stage",
    title: "Remote Viewing Games 1 & 2",
    track: "competition",
  },
  {
    start: "12:00 PM",
    end: "1:30 PM",
    room: "Main Stage",
    title: "Mind Sight Games 1 & 2",
    track: "competition",
  },
  {
    start: "1:30 PM",
    end: "2:30 PM",
    room: "Kings Room",
    title: "Networking Break + Psi Tribe Meetup: Remote Viewing & Mindsight",
    track: "break",
  },
  {
    start: "3:00 PM",
    end: "4:30 PM",
    room: "Main Stage",
    title: "Dowsing Games 1 & 2",
    track: "competition",
  },
  {
    start: "4:30 PM",
    end: "5:00 PM",
    room: "Main Stage",
    title: "Precognition Games 1 & 2",
    track: "competition",
    note: "Opening rounds",
  },
  {
    start: "5:00 PM",
    end: "5:45 PM",
    room: "Kings Room",
    title: "Networking Break + Psi Tribe Meetup: Precognition",
    track: "break",
  },
  {
    start: "6:00 PM",
    end: "7:30 PM",
    room: "Main Stage",
    title: "Psychokinesis Games 1 & 2",
    track: "competition",
  },
  {
    start: "7:30 PM",
    end: "7:45 PM",
    room: "Main Stage",
    title: "Psi Games Remarks & Closing Commentary",
    speakers: ["Hakim Isler"],
    track: "remarks",
  },
  {
    start: "9:00 PM",
    end: "9:30 PM",
    room: "Main Stage / Platinum",
    title: "PLATINUM: Musical Performance",
    speakers: ["Jane Cuva"],
    track: "community",
    platinum: true,
  },
  {
    start: "9:30 PM",
    end: "10:00 PM",
    room: "Platinum",
    title: "PLATINUM: VIP Meet & Greet",
    track: "community",
    platinum: true,
  },
  {
    start: "10:00 PM",
    end: "11:30 PM",
    room: "Platinum / outdoor",
    title: "PLATINUM: Sky Watch Experience",
    speakers: ["Chris Bledsoe"],
    track: "community",
    platinum: true,
  },
];

/* ------------------------- Day 3 · Sunday 2026-08-02 ---------------------- */

const SUNDAY: Draft[] = [
  {
    start: "8:00 AM",
    end: "8:45 AM",
    room: "Promenade / Kings",
    title: "Registration / Special Events",
    track: "registration",
    note: "2nd-floor promenade",
  },
  {
    start: "8:45 AM",
    end: "9:00 AM",
    room: "Main Stage",
    title: "Opening Remarks",
    speakers: ["Hakim Isler", "Anne Palmer"],
    track: "remarks",
  },
  {
    start: "9:00 AM",
    end: "9:45 AM",
    room: "Main Stage",
    title: "Keynote: How the Simulation Hypothesis Explains the Unexplainable",
    speakers: ["Dr. Rizwan Virk"],
    track: "keynote",
  },
  {
    start: "9:45 AM",
    end: "10:30 AM",
    room: "Main Stage",
    title: "Can Machines Be Psychic?",
    speakers: ["Adam Curry"],
    track: "presentation",
  },
  {
    start: "10:30 AM",
    end: "11:15 AM",
    room: "Main Stage",
    title: "From UFOs and Psi to a New Model of Reality",
    speakers: ["Nick Cook"],
    track: "presentation",
  },
  {
    start: "11:15 AM",
    end: "12:15 PM",
    room: "Main Stage",
    title: "Panel: The Nature of Reality",
    speakers: [
      "Jeffrey Mishlove",
      "Rizwan Virk",
      "Thomas Campbell",
      "Simon Duan",
      "Gary Kraftsow",
      "Norma Burton",
      "Julia Mossbridge",
    ],
    track: "panel",
  },
  {
    start: "1:45 PM",
    end: "3:15 PM",
    room: "Main Stage",
    title: "Seeing Without Eyes: An Interactive Mindsight Demonstration & Workshop",
    speakers: ["Rob Freeman", "Pat Mielke"],
    track: "workshop",
  },
  {
    start: "1:45 PM",
    end: "3:15 PM",
    room: "Tryon",
    title: "Awaken Your Superpowers",
    speakers: ["Mas Mike"],
    track: "workshop",
  },
  {
    start: "1:45 PM",
    end: "3:15 PM",
    room: "Harris",
    title: "Beyond Intuition: Unlocking the Infinite Intelligence of Consciousness",
    speakers: ["Vincent Genna, MSW"],
    track: "workshop",
  },
  {
    start: "1:45 PM",
    end: "3:00 PM",
    room: "Trade",
    title: "The Science of Remote Viewing",
    speakers: ["Paul H. Smith, PhD"],
    track: "workshop",
  },
  {
    start: "3:25 PM",
    end: "4:55 PM",
    room: "Tryon",
    title: "Workshop title not published",
    track: "workshop",
    incomplete: true,
    note: "Title and presenter are incomplete in the published schedule — verify on site",
  },
  {
    start: "3:25 PM",
    end: "4:55 PM",
    room: "Harris",
    title:
      "The Children Are Our Future: Empowering Children Perceptually, Intuitively & Energetically",
    speakers: ["Nicola Farmer"],
    track: "workshop",
    minors: true,
  },
  {
    start: "3:25 PM",
    end: "4:55 PM",
    room: "Trade",
    title: "Lucid Dreaming & Psychonavigation: Awakening Within the Dream",
    speakers: ["Nisha Burton", "Norma Burton"],
    track: "workshop",
  },
  {
    start: "3:25 PM",
    end: "4:55 PM",
    room: "Kings",
    title: "Community Event: Energy Healing",
    speakers: ["Edd Edwards"],
    track: "community",
  },
  {
    start: "5:05 PM",
    end: "7:05 PM",
    room: "Tryon",
    title: "Hands-On Remote Viewing",
    speakers: ["Lori Williams"],
    track: "workshop",
  },
  {
    start: "5:05 PM",
    end: "6:35 PM",
    room: "Harris",
    title: "The Art of Breath: Breath as an Inner Compass",
    speakers: ["Dr. Iya Whiteley"],
    track: "workshop",
  },
  {
    start: "5:05 PM",
    end: "6:35 PM",
    room: "Trade",
    title: "Guided Group Hypnosis: The Consciousness Protocol",
    speakers: ["JK Ultra"],
    track: "workshop",
  },
  {
    start: "5:05 PM",
    end: "6:35 PM",
    room: "Kings",
    title: "Community Event: Energy Healing",
    speakers: ["Edd Edwards"],
    track: "community",
  },
  {
    start: "8:00 PM",
    end: "9:00 PM",
    room: "Main Stage",
    title: "PSI Games 2026 Awards Ceremony",
    speakers: ["Hakim Isler", "Anne Palmer"],
    track: "ceremony",
  },
];

/** Every published session, in printed order, day by day. */
export const PROGRAM: ProgramSession[] = [
  ...build("2026-07-31", FRIDAY),
  ...build("2026-08-01", SATURDAY),
  ...build("2026-08-02", SUNDAY),
];

/** Published sessions grouped by ISO date, sorted by start then room. */
export const PROGRAM_BY_DATE: Record<string, ProgramSession[]> = PROGRAM.reduce<
  Record<string, ProgramSession[]>
>((acc, session) => {
  (acc[session.date] ??= []).push(session);
  return acc;
}, {});

for (const sessions of Object.values(PROGRAM_BY_DATE)) {
  sessions.sort((a, b) => a.startMin - b.startMin || a.room.localeCompare(b.room));
}
