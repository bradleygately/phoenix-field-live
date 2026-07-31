import type { Interview, Priority } from "@/types";

const SEED: { target: string; priority: Priority; angle: string }[] = [
  { target: "Hakim Isler", priority: "MUST", angle: "Founder vision, why the Psi Games exist" },
  { target: "Dana Kippel", priority: "MUST", angle: "Plasma, consciousness and filmmaking crossover" },
  { target: "Karlie Field", priority: "HIGH", angle: "Participant experience" },
  { target: "Ryan Desbien", priority: "HIGH", angle: "Family and next-generation psi" },
  { target: "Chris Bledsoe", priority: "HIGH", angle: "Contact experience and sky watch" },
  { target: "Rizwan Virk", priority: "HIGH", angle: "Simulation hypothesis framing" },
  { target: "Adam Curry", priority: "HIGH", angle: "Machines, AI and psi" },
  { target: "Lori Williams", priority: "HIGH", angle: "Teaching remote viewing hands-on" },
  { target: "Julia Mossbridge", priority: "HIGH", angle: "Science of precognition" },
  {
    target: "Competition winners / prominent participants",
    priority: "HIGH",
    angle: "Reaction and personal stakes immediately after results",
  },
];

export const SEED_INTERVIEWS: Interview[] = SEED.map((s, i) => ({
  id: `seed-${i + 1}`,
  priority: s.priority,
  target: s.target,
  angle: s.angle,
  window: "",
  location: "",
  owner: "brad",
  access: "Unconfirmed",
  release: "Needed",
  status: "Target",
  contact: "",
  notes: "",
  fileRef: "",
  restrictions: [],
  runningSince: null,
  elapsedMs: 0,
  updatedAt: 0,
}));