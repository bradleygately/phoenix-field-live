/**
 * Commitment inference. Explicit operating duties are commitments; scouting and
 * conditional language stays advisory until a live reassignment promotes it.
 */

const COMMIT_WORDS = [
  "primary",
  "full",
  "confirm",
  "coordinate",
  "track",
  "record",
  "cover",
  "update",
  "verify",
  "meet",
  "transport",
  "remain",
  "inventory",
];

const ADVISORY_WORDS = [
  "possible",
  "scout",
  "optional",
  "only if",
  "do not move unless",
  "unless reassigned",
  "recommended",
  "cover only if",
  "if available",
  "if useful",
  "potential",
  "if access",
];

export function inferCommitment(raw: string | undefined): boolean {
  const text = (raw ?? "").trim().toLowerCase();
  if (!text || text === "—" || text === "-" || text === "n/a") return false;
  if (ADVISORY_WORDS.some((w) => text.includes(w))) return false;
  return COMMIT_WORDS.some((w) => new RegExp(`\\b${w}`).test(text));
}