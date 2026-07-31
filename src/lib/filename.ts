/** Shared field-file naming: Name_YYYYMMDD-HHmm_Location_Ref.ext (Charlotte time). */

export function slugPart(value: string | null | undefined, fallback: string): string {
  const cleaned = (value ?? "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

/** Charlotte wall-clock stamp, independent of the device timezone. */
export function etStamp(epochMs: number): string {
  const d = new Date(epochMs);
  if (Number.isNaN(d.getTime())) return "unknown-time";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const v = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return `${v("year")}${v("month")}${v("day")}-${v("hour")}${v("minute")}`;
}

/** Same shape as the signed-release PDF names, so audio files sort alongside them. */
export function fieldFilename(input: {
  name: string | null | undefined;
  epochMs: number;
  location?: string | null | undefined;
  ref?: string | null | undefined;
  ext: string;
}): string {
  return [
    slugPart(input.name, "Subject"),
    etStamp(input.epochMs),
    slugPart(input.location, "Location-Not-Set"),
    slugPart(input.ref, "Interview"),
  ].join("_") + `.${input.ext}`;
}

export function extensionForBlob(blob: Blob): string {
  const type = (blob.type || "").toLowerCase();
  if (type.includes("mp4")) return "m4a";
  if (type.includes("mpeg")) return "mp3";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("wav")) return "wav";
  return "webm";
}

/** Share sheet first (phones), download fallback (desktop / no share). */
export async function shareOrDownload(
  blob: Blob,
  filename: string,
): Promise<"shared" | "downloaded"> {
  const file = new File([blob], filename, { type: blob.type || "application/octet-stream" });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: filename });
      return "shared";
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return "shared";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return "downloaded";
}
