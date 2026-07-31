import { supabase } from "@/integrations/supabase/client";

import { releasePdfBlob } from "./release-pdf";
import { upsertRecord } from "./release-store";
import type { ReleaseRecord } from "./release-types";

const SIG_BUCKET = "release-signatures";
const PDF_BUCKET = "release-pdfs";

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(meta ?? "")?.[1] ?? "image/png";
  const bytes = atob(base64 ?? "");
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) buffer[i] = bytes.charCodeAt(i);
  return new Blob([buffer], { type: mime });
}

function throwOnError<T extends { error: unknown }>(result: T): T {
  if (result.error) throw result.error;
  return result;
}

/** Uploads signature images + signed PDF, then stores the release row. */
export async function submitRelease(record: ReleaseRecord): Promise<ReleaseRecord> {
  const signaturePath = `${record.releaseId}/signature.png`;
  const uploads: Array<Promise<unknown>> = [
    supabase.storage
      .from(SIG_BUCKET)
      .upload(signaturePath, dataUrlToBlob(record.signatureDataUrl), {
        contentType: "image/png",
        upsert: false,
      })
      .then(throwOnError),
  ];

  let minorAssentPath: string | undefined;
  if (record.minorAssentSignatureDataUrl) {
    minorAssentPath = `${record.releaseId}/minor-assent.png`;
    uploads.push(
      supabase.storage
        .from(SIG_BUCKET)
        .upload(minorAssentPath, dataUrlToBlob(record.minorAssentSignatureDataUrl), {
          contentType: "image/png",
          upsert: false,
        })
        .then(throwOnError),
    );
  }

  const pdfPath = `${record.releaseId}.pdf`;
  uploads.push(
    releasePdfBlob(record).then((blob) =>
      supabase.storage
        .from(PDF_BUCKET)
        .upload(pdfPath, blob, { contentType: "application/pdf", upsert: false })
        .then(throwOnError),
    ),
  );

  await Promise.all(uploads);

  const fields = record.kind === "adult" ? record.adult : record.minor;
  const { error } = await supabase.from("releases").insert({
    release_id: record.releaseId,
    kind: record.kind,
    participant_name:
      record.kind === "adult"
        ? (record.adult?.fullLegalName ?? "")
        : (record.minor?.minorFullLegalName ?? ""),
    signer_name:
      record.kind === "adult"
        ? (record.adult?.fullLegalName ?? "")
        : (record.minor?.guardianFullName ?? ""),
    contact_email: record.adult?.email ?? record.minor?.guardianEmail ?? "",
    contact_phone: record.adult?.phone ?? record.minor?.guardianPhone ?? "",
    on_screen_name: record.adult?.onScreenName ?? null,
    organization: record.adult?.organization ?? null,
    relationship: record.minor?.relationship ?? null,
    minor_dob: record.minor?.minorDob ?? null,
    minor_age: record.minor?.minorAge ?? null,
    restrictions: fields?.restrictions ?? null,
    copy_requested: fields?.copyRequested === "yes",
    agreed_to_terms: record.agreedToTerms,
    release_obtained_by: fields?.releaseObtainedBy || null,
    session_location: fields?.sessionLocation || null,
    camera_card_ref: fields?.cameraCardFileRef || null,
    event_name: record.event.name,
    event_venue: record.event.venue,
    event_dates: record.event.dates,
    project_title: record.event.projectTitle,
    signature_path: signaturePath,
    minor_assent_path: minorAssentPath ?? null,
    pdf_path: pdfPath,
    signed_at: record.signedAtIso,
  });
  if (error) throw error;

  const saved: ReleaseRecord = {
    ...record,
    storage: {
      signaturePath,
      ...(minorAssentPath ? { minorAssentPath } : {}),
      pdfPath,
    },
  };
  upsertRecord(saved);
  return saved;
}

export type ReleaseRow = {
  id: string;
  release_id: string;
  kind: string;
  participant_name: string;
  signer_name: string;
  contact_email: string;
  contact_phone: string;
  on_screen_name: string | null;
  organization: string | null;
  relationship: string | null;
  minor_dob: string | null;
  minor_age: string | null;
  restrictions: string | null;
  copy_requested: boolean;
  agreed_to_terms: boolean;
  release_obtained_by: string | null;
  session_location: string | null;
  camera_card_ref: string | null;
  signature_path: string | null;
  minor_assent_path: string | null;
  pdf_path: string | null;
  signed_at: string;
};

export async function listReleases(): Promise<ReleaseRow[]> {
  const { data, error } = await supabase
    .from("releases")
    .select("*")
    .order("signed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReleaseRow[];
}

export async function signedFileUrl(
  bucket: "release-signatures" | "release-pdfs",
  path: string,
): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteRelease(row: ReleaseRow) {
  const paths = [row.signature_path, row.minor_assent_path].filter(Boolean) as string[];
  if (paths.length) await supabase.storage.from(SIG_BUCKET).remove(paths);
  if (row.pdf_path) await supabase.storage.from(PDF_BUCKET).remove([row.pdf_path]);
  const { error } = await supabase.from("releases").delete().eq("id", row.id);
  if (error) throw error;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return false;
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}
