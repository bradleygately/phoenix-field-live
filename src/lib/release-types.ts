export type ReleaseKind = "adult" | "minor";

export type AdultFields = {
  fullLegalName: string;
  onScreenName: string;
  organization: string;
  email: string;
  phone: string;
  restrictions: string;
  copyRequested: "yes" | "no";
  releaseObtainedBy: string;
  sessionLocation: string;
  cameraCardFileRef: string;
};

export type MinorFields = {
  minorFullLegalName: string;
  minorDob: string;
  minorAge: string;
  guardianFullName: string;
  relationship: string;
  guardianEmail: string;
  guardianPhone: string;
  restrictions: string;
  copyRequested: "yes" | "no";
  releaseObtainedBy: string;
  sessionLocation: string;
  cameraCardFileRef: string;
};

export type ReleaseRecord = {
  releaseId: string;
  kind: ReleaseKind;
  signedAtIso: string;
  signedAtDisplay: string;
  agreedToTerms: boolean;
  signatureDataUrl: string;
  minorAssentSignatureDataUrl?: string;
  adult?: AdultFields;
  minor?: MinorFields;
  event: {
    name: string;
    venue: string;
    dates: string;
    projectTitle: string;
  };
  storage?: {
    signaturePath?: string;
    minorAssentPath?: string;
    pdfPath?: string;
  };
};

export function participantName(record: ReleaseRecord): string {
  if (record.kind === "adult") return record.adult?.fullLegalName ?? "";
  return record.minor?.minorFullLegalName ?? "";
}

export function signerName(record: ReleaseRecord): string {
  if (record.kind === "adult") return record.adult?.fullLegalName ?? "";
  return record.minor?.guardianFullName ?? "";
}

export function restrictionsOf(record: ReleaseRecord): string {
  return (record.kind === "adult" ? record.adult?.restrictions : record.minor?.restrictions) ?? "";
}
