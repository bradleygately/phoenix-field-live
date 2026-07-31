import {
  ADULT_RELEASE_PARAGRAPHS,
  ADULT_RELEASE_TITLE,
  BRAND,
  MINOR_RELEASE_PARAGRAPHS,
  MINOR_RELEASE_TITLE,
  PRIVACY_NOTE,
} from "./release-content";
import type { ReleaseRecord } from "./release-types";

type Row = [string, string];

function rowsFor(record: ReleaseRecord): Row[] {
  if (record.kind === "adult" && record.adult) {
    const a = record.adult;
    return [
      ["Full legal name", a.fullLegalName],
      ["Preferred on-screen name / title", a.onScreenName || "—"],
      ["Organization / affiliation", a.organization || "—"],
      ["Email", a.email],
      ["Mobile phone", a.phone],
      ["Copy requested", a.copyRequested === "yes" ? "Yes" : "No"],
      ["Release obtained by", a.releaseObtainedBy || "—"],
      ["Session / location", a.sessionLocation || "—"],
      ["Camera / card / file reference", a.cameraCardFileRef || "—"],
    ];
  }
  const m = record.minor!;
  return [
    ["Minor full legal name", m.minorFullLegalName],
    ["Date of birth", m.minorDob || "—"],
    ["Age", m.minorAge || "—"],
    ["Parent / guardian full name", m.guardianFullName],
    ["Relationship to minor", m.relationship],
    ["Guardian email", m.guardianEmail],
    ["Guardian phone", m.guardianPhone],
    ["Copy requested", m.copyRequested === "yes" ? "Yes" : "No"],
    ["Release obtained by", m.releaseObtainedBy || "—"],
    ["Session / location", m.sessionLocation || "—"],
    ["Camera / card / file reference", m.cameraCardFileRef || "—"],
  ];
}

export async function generateReleasePdf(record: ReleaseRecord) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 54;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const text = (
    value: string,
    opts: { size?: number; style?: "normal" | "bold"; gap?: number; width?: number } = {},
  ) => {
    const { size = 10, style = "normal", gap = 6, width = contentWidth } = opts;
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(value, width) as string[];
    const lineHeight = size * 1.35;
    ensureSpace(lines.length * lineHeight);
    for (const line of lines) {
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += gap;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(BRAND.company, margin, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(`${BRAND.program} — “${record.event.projectTitle}”`, margin, y);
  y += 13;
  doc.text(`${record.event.name} · ${record.event.venue} · ${record.event.dates}`, margin, y);
  y += 13;
  doc.text(`${BRAND.email} · ${BRAND.phone} · ${BRAND.website}`, margin, y);
  y += 16;
  doc.setDrawColor(20);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  text(record.kind === "adult" ? ADULT_RELEASE_TITLE : MINOR_RELEASE_TITLE, {
    size: 12.5,
    style: "bold",
    gap: 10,
  });

  text(`Release ID: ${record.releaseId}`, { size: 10, style: "bold", gap: 2 });
  text(`Signed (local time): ${record.signedAtDisplay}`, { size: 10, gap: 14 });

  text("PARTICIPANT INFORMATION", { size: 10.5, style: "bold", gap: 8 });
  const labelWidth = 190;
  for (const [label, value] of rowsFor(record)) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    const valueLines = doc.splitTextToSize(value || "—", contentWidth - labelWidth) as string[];
    ensureSpace(valueLines.length * 13 + 2);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    let vy = y;
    for (const line of valueLines) {
      doc.text(line, margin + labelWidth, vy);
      vy += 13;
    }
    y = vy + 2;
  }
  y += 10;

  const restrictions =
    (record.kind === "adult" ? record.adult?.restrictions : record.minor?.restrictions) || "";
  text("AGREED LIMITATIONS / RESTRICTIONS", { size: 10.5, style: "bold", gap: 6 });
  text(restrictions.trim() ? restrictions.trim() : "None stated.", { size: 10, gap: 16 });

  text("RELEASE TERMS", { size: 10.5, style: "bold", gap: 8 });
  const paragraphs = record.kind === "adult" ? ADULT_RELEASE_PARAGRAPHS : MINOR_RELEASE_PARAGRAPHS;
  for (const paragraph of paragraphs) {
    text(paragraph, { size: 9.5, gap: 9 });
  }

  ensureSpace(170);
  y += 6;
  text("SIGNATURE", { size: 10.5, style: "bold", gap: 8 });
  text(
    record.agreedToTerms
      ? "The signer confirmed by checkbox that they have read this release and voluntarily agree to its terms."
      : "Agreement checkbox not recorded.",
    { size: 9, gap: 10 },
  );

  const sigWidth = 240;
  const sigHeight = 90;
  if (record.signatureDataUrl) {
    ensureSpace(sigHeight + 40);
    doc.addImage(record.signatureDataUrl, "PNG", margin, y, sigWidth, sigHeight);
    doc.line(margin, y + sigHeight + 4, margin + sigWidth, y + sigHeight + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const caption =
      record.kind === "adult"
        ? `${record.adult?.fullLegalName ?? ""} (participant)`
        : `${record.minor?.guardianFullName ?? ""} (parent / legal guardian)`;
    doc.text(caption, margin, y + sigHeight + 18);
    doc.text(`Date / time: ${record.signedAtDisplay}`, margin, y + sigHeight + 31);
    y += sigHeight + 46;
  }

  if (record.minorAssentSignatureDataUrl) {
    ensureSpace(sigHeight + 40);
    doc.addImage(record.minorAssentSignatureDataUrl, "PNG", margin, y, sigWidth, sigHeight);
    doc.line(margin, y + sigHeight + 4, margin + sigWidth, y + sigHeight + 4);
    doc.setFontSize(9);
    doc.text(
      `${record.minor?.minorFullLegalName ?? ""} (minor assent, age-appropriate)`,
      margin,
      y + sigHeight + 18,
    );
    y += sigHeight + 34;
  }

  y += 10;
  text(PRIVACY_NOTE, { size: 8, gap: 4 });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      `${BRAND.company} · Release ${record.releaseId} · Page ${i} of ${pages}`,
      margin,
      pageHeight - 26,
    );
  }

  return doc;
}

export type PdfDelivery = "shared" | "downloaded" | "opened" | "link-only";

function isIosLike() {
  return (
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function inIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function triggerBlobDownload(url: string, filename: string, blob: Blob): boolean {
  // Some mobile / in-app browsers ignore jsPDF's internal save(); drive the
  // download from a real object URL so the file always lands on the device.
  const nav = window.navigator as Navigator & {
    msSaveOrOpenBlob?: (b: Blob, name: string) => void;
  };
  if (typeof nav.msSaveOrOpenBlob === "function") {
    nav.msSaveOrOpenBlob(blob, filename);
    return true;
  }

  if (!("download" in HTMLAnchorElement.prototype)) return false;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return true;
}

/**
 * Produces the signed PDF and hands it to the device by whatever route this
 * browser actually allows: native share sheet (iOS / Android), a real file
 * download, or a new tab. Always returns a blob URL so the UI can render a
 * tappable fallback link (embedded previews block programmatic downloads).
 */
function slug(value: string, fallback: string): string {
  const s = value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return s || fallback;
}

export function releasePdfFilenameFor(
  participantName: string | null | undefined,
  signedAtIso: string,
  sessionLocation: string | null | undefined,
  releaseId: string,
): string {
  const d = new Date(signedAtIso);
  let stamp = "unknown-time";
  if (!Number.isNaN(d.getTime())) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(d);
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "00";
    stamp = `${value("year")}${value("month")}${value("day")}-${value("hour")}${value("minute")}`;
  }
  return `${slug(participantName ?? "", "Participant")}_${stamp}_${slug(
    sessionLocation ?? "",
    "Location-Not-Set",
  )}_${slug(releaseId, "Release")}.pdf`;
}

export function releasePdfFilename(record: ReleaseRecord): string {
  const participant =
    record.kind === "adult"
      ? record.adult?.fullLegalName
      : record.minor?.minorFullLegalName;
  const location =
    record.kind === "adult" ? record.adult?.sessionLocation : record.minor?.sessionLocation;
  return releasePdfFilenameFor(participant, record.signedAtIso, location, record.releaseId);
}

export async function deliverReleasePdf(
  record: ReleaseRecord,
  mode: "download" | "print" = "download",
): Promise<{ url: string; filename: string; delivery: PdfDelivery }> {
  const blob = await releasePdfBlob(record);
  const filename = releasePdfFilename(record);
  const url = URL.createObjectURL(blob);

  if (mode === "download") {
    const file = new File([blob], filename, { type: "application/pdf" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: filename });
        return { url, filename, delivery: "shared" };
      } catch (err) {
        // User dismissed the sheet, or sharing is unavailable — fall through.
        if ((err as DOMException)?.name === "AbortError") {
          return { url, filename, delivery: "shared" };
        }
      }
    }

    // iOS Safari ignores the download attribute; open the viewer instead.
    if (!isIosLike() && triggerBlobDownload(url, filename, blob)) {
      return { url, filename, delivery: "downloaded" };
    }
  }

  const win = window.open(url, "_blank", "noopener");
  if (win) return { url, filename, delivery: "opened" };

  // Popup blocked (common in embedded previews / in-app browsers).
  if (!inIframe() && triggerBlobDownload(url, filename, blob)) {
    return { url, filename, delivery: "downloaded" };
  }
  return { url, filename, delivery: "link-only" };
}

export async function downloadReleasePdf(record: ReleaseRecord) {
  return deliverReleasePdf(record, "download");
}

export async function printReleasePdf(record: ReleaseRecord) {
  return deliverReleasePdf(record, "print");
}

export async function releasePdfBlob(record: ReleaseRecord): Promise<Blob> {
  const doc = await generateReleasePdf(record);
  const buffer = doc.output("arraybuffer");
  return new Blob([buffer], { type: "application/pdf" });
}
