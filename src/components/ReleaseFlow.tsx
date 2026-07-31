import { Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronDown, Download, Printer, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SignaturePad } from "@/components/SignaturePad";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ADULT_RELEASE_PARAGRAPHS,
  ADULT_RELEASE_TITLE,
  BRAND,
  MINOR_RELEASE_PARAGRAPHS,
  MINOR_RELEASE_TITLE,
  PRIVACY_NOTE,
} from "@/lib/release-content";
import { downloadReleasePdf, printReleasePdf } from "@/lib/release-pdf";
import { submitRelease } from "@/lib/release-supabase";
import { clearDraft, loadDraft, newReleaseId, saveDraft } from "@/lib/release-store";
import type { AdultFields, MinorFields, ReleaseKind, ReleaseRecord } from "@/lib/release-types";

const emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const phoneRe = /^[\d\s()+.-]{10,20}$/;

const adultDefaults: AdultFields = {
  fullLegalName: "",
  onScreenName: "",
  organization: "",
  email: "",
  phone: "",
  restrictions: "",
  copyRequested: "no",
  releaseObtainedBy: "",
  sessionLocation: "",
  cameraCardFileRef: "",
};

const minorDefaults: MinorFields = {
  minorFullLegalName: "",
  minorDob: "",
  minorAge: "",
  guardianFullName: "",
  relationship: "",
  guardianEmail: "",
  guardianPhone: "",
  restrictions: "",
  copyRequested: "no",
  releaseObtainedBy: "",
  sessionLocation: "",
  cameraCardFileRef: "",
};

type Errors = Record<string, string | undefined>;

export function ReleaseFlow({ kind }: { kind: ReleaseKind }) {
  const draftKey = kind;
  const [step, setStep] = useState<"form" | "review" | "done">("form");
  const [adult, setAdult] = useState<AdultFields>(adultDefaults);
  const [minor, setMinor] = useState<MinorFields>(minorDefaults);
  const [signature, setSignature] = useState("");
  const [assent, setAssent] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<ReleaseRecord | null>(null);
  const [showProduction, setShowProduction] = useState(false);

  useEffect(() => {
    const draft = loadDraft<{ adult: AdultFields; minor: MinorFields }>(draftKey);
    if (draft?.adult) setAdult({ ...adultDefaults, ...draft.adult });
    if (draft?.minor) setMinor({ ...minorDefaults, ...draft.minor });
  }, [draftKey]);

  useEffect(() => {
    if (step === "done") return;
    saveDraft(draftKey, { adult, minor });
  }, [adult, minor, draftKey, step]);

  const releaseTitle = kind === "adult" ? ADULT_RELEASE_TITLE : MINOR_RELEASE_TITLE;
  const paragraphs = kind === "adult" ? ADULT_RELEASE_PARAGRAPHS : MINOR_RELEASE_PARAGRAPHS;

  function validate(): boolean {
    const next: Errors = {};
    if (kind === "adult") {
      if (!adult.fullLegalName.trim()) next["fullLegalName"] = "Full legal name is required.";
      if (!emailRe.test(adult.email.trim())) next["email"] = "Enter a valid email address.";
      if (!phoneRe.test(adult.phone.trim())) next["phone"] = "Enter a valid mobile phone number.";
    } else {
      if (!minor.minorFullLegalName.trim())
        next["minorFullLegalName"] = "Minor's full legal name is required.";
      if (!minor.minorDob.trim() && !minor.minorAge.trim())
        next["minorDob"] = "Enter a date of birth or an age.";
      if (!minor.guardianFullName.trim())
        next["guardianFullName"] = "Parent / guardian name is required.";
      if (!minor.relationship.trim())
        next["relationship"] = "Relationship to the minor is required.";
      if (!emailRe.test(minor.guardianEmail.trim()))
        next["guardianEmail"] = "Enter a valid email address.";
      if (!phoneRe.test(minor.guardianPhone.trim()))
        next["guardianPhone"] = "Enter a valid phone number.";
    }
    if (!signature) next["signature"] = "A signature is required.";
    if (!agreed) next["agreed"] = "Please confirm you have read and agree to this release.";
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error("Please fix the highlighted fields.");
      const first = document.querySelector<HTMLElement>("[data-error='true']");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }

  async function submit() {
    setSubmitting(true);
    const now = new Date();
    const newRecord: ReleaseRecord = {
      releaseId: newReleaseId(kind),
      kind,
      signedAtIso: now.toISOString(),
      signedAtDisplay: now.toLocaleString(),
      agreedToTerms: agreed,
      signatureDataUrl: signature,
      ...(assent ? { minorAssentSignatureDataUrl: assent } : {}),
      ...(kind === "adult" ? { adult } : { minor }),
      event: {
        name: BRAND.eventName,
        venue: BRAND.venue,
        dates: BRAND.dates,
        projectTitle: BRAND.projectTitle,
      },
    };

    try {
      const saved = await submitRelease(newRecord);
      clearDraft(draftKey);
      setRecord(saved);
      setStep("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success("Release signed and submitted.");
    } catch (err) {
      console.error("Release submission failed", err);
      toast.error("We couldn't submit your release. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "done" && record) {
    return <Confirmation record={record} />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <h1 className="mt-6 text-2xl font-black tracking-tight sm:text-3xl">{releaseTitle}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {BRAND.program} — “{BRAND.projectTitle}”. {BRAND.eventName} · {BRAND.venue} · {BRAND.dates}
      </p>

      {step === "form" ? (
        <form
          className="mt-8 space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (validate()) {
              setStep("review");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          noValidate
        >
          <section className="space-y-5">
            <h2 className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
              {kind === "adult" ? "Participant details" : "Minor & guardian details"}
            </h2>

            {kind === "adult" ? (
              <>
                <Field
                  id="fullLegalName"
                  label="Full legal name"
                  required
                  error={errors["fullLegalName"]}
                  value={adult.fullLegalName}
                  onChange={(v) => setAdult({ ...adult, fullLegalName: v })}
                  autoComplete="name"
                />
                <Field
                  id="onScreenName"
                  label="Preferred on-screen name / title"
                  hint="How you want to be credited (optional)"
                  value={adult.onScreenName}
                  onChange={(v) => setAdult({ ...adult, onScreenName: v })}
                />
                <Field
                  id="organization"
                  label="Organization / affiliation"
                  value={adult.organization}
                  onChange={(v) => setAdult({ ...adult, organization: v })}
                  autoComplete="organization"
                />
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  required
                  error={errors["email"]}
                  value={adult.email}
                  onChange={(v) => setAdult({ ...adult, email: v })}
                  autoComplete="email"
                  inputMode="email"
                />
                <Field
                  id="phone"
                  label="Mobile phone"
                  type="tel"
                  required
                  error={errors["phone"]}
                  value={adult.phone}
                  onChange={(v) => setAdult({ ...adult, phone: v })}
                  autoComplete="tel"
                  inputMode="tel"
                />
              </>
            ) : (
              <>
                <Field
                  id="minorFullLegalName"
                  label="Minor's full legal name"
                  required
                  error={errors["minorFullLegalName"]}
                  value={minor.minorFullLegalName}
                  onChange={(v) => setMinor({ ...minor, minorFullLegalName: v })}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id="minorDob"
                    label="Date of birth"
                    type="date"
                    error={errors["minorDob"]}
                    value={minor.minorDob}
                    onChange={(v) => setMinor({ ...minor, minorDob: v })}
                  />
                  <Field
                    id="minorAge"
                    label="Age"
                    inputMode="numeric"
                    value={minor.minorAge}
                    onChange={(v) => setMinor({ ...minor, minorAge: v })}
                  />
                </div>
                <Field
                  id="guardianFullName"
                  label="Parent / guardian full legal name"
                  required
                  error={errors["guardianFullName"]}
                  value={minor.guardianFullName}
                  onChange={(v) => setMinor({ ...minor, guardianFullName: v })}
                  autoComplete="name"
                />
                <Field
                  id="relationship"
                  label="Relationship to minor"
                  required
                  error={errors["relationship"]}
                  value={minor.relationship}
                  onChange={(v) => setMinor({ ...minor, relationship: v })}
                />
                <Field
                  id="guardianEmail"
                  label="Guardian email"
                  type="email"
                  required
                  error={errors["guardianEmail"]}
                  value={minor.guardianEmail}
                  onChange={(v) => setMinor({ ...minor, guardianEmail: v })}
                  autoComplete="email"
                  inputMode="email"
                />
                <Field
                  id="guardianPhone"
                  label="Guardian phone"
                  type="tel"
                  required
                  error={errors["guardianPhone"]}
                  value={minor.guardianPhone}
                  onChange={(v) => setMinor({ ...minor, guardianPhone: v })}
                  autoComplete="tel"
                  inputMode="tel"
                />
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="restrictions" className="text-sm font-semibold">
                Agreed limitations / restrictions (optional)
              </Label>
              <Textarea
                id="restrictions"
                rows={3}
                placeholder="e.g. No use of last name; no social media clips."
                value={kind === "adult" ? adult.restrictions : minor.restrictions}
                onChange={(e) =>
                  kind === "adult"
                    ? setAdult({ ...adult, restrictions: e.target.value })
                    : setMinor({ ...minor, restrictions: e.target.value })
                }
              />
            </div>
          </section>

          <section className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">
                Would you like a copy of this release?
              </legend>
              <div className="flex gap-3">
                {(["yes", "no"] as const).map((option) => {
                  const current = kind === "adult" ? adult.copyRequested : minor.copyRequested;
                  return (
                    <Button
                      key={option}
                      type="button"
                      variant={current === option ? "default" : "outline"}
                      className="min-h-12 flex-1 capitalize"
                      aria-pressed={current === option}
                      onClick={() =>
                        kind === "adult"
                          ? setAdult({ ...adult, copyRequested: option })
                          : setMinor({ ...minor, copyRequested: option })
                      }
                    >
                      {option}
                    </Button>
                  );
                })}
              </div>
            </fieldset>

            <div className="rounded-lg border border-border bg-card">
              <button
                type="button"
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 text-left"
                aria-expanded={showProduction}
                onClick={() => setShowProduction((v) => !v)}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">Crew use only (optional)</span>
                  <span className="block text-xs text-muted-foreground">
                    Production log details — skip this if you are a participant.
                  </span>
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-primary transition-transform ${showProduction ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {showProduction ? (
                <div className="space-y-5 border-t border-border p-4">
                  <Field
                    id="releaseObtainedBy"
                    label="Release obtained by (crew member)"
                    value={kind === "adult" ? adult.releaseObtainedBy : minor.releaseObtainedBy}
                    onChange={(v) =>
                      kind === "adult"
                        ? setAdult({ ...adult, releaseObtainedBy: v })
                        : setMinor({ ...minor, releaseObtainedBy: v })
                    }
                  />
                  <Field
                    id="sessionLocation"
                    label="Session / location"
                    value={kind === "adult" ? adult.sessionLocation : minor.sessionLocation}
                    onChange={(v) =>
                      kind === "adult"
                        ? setAdult({ ...adult, sessionLocation: v })
                        : setMinor({ ...minor, sessionLocation: v })
                    }
                  />
                  <Field
                    id="cameraCardFileRef"
                    label="Camera / card / file reference"
                    value={kind === "adult" ? adult.cameraCardFileRef : minor.cameraCardFileRef}
                    onChange={(v) =>
                      kind === "adult"
                        ? setAdult({ ...adult, cameraCardFileRef: v })
                        : setMinor({ ...minor, cameraCardFileRef: v })
                    }
                  />
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
              Release terms
            </h2>
            <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-border bg-card p-4 text-sm leading-relaxed">
              {paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="space-y-6" data-error={errors["signature"] ? "true" : undefined}>
            <h2 className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Signature</h2>
            <SignaturePad
              label={kind === "adult" ? "Participant signature" : "Parent / guardian signature"}
              value={signature}
              onChange={(v) => {
                setSignature(v);
                setErrors((e) => ({ ...e, signature: "" }));
              }}
              required
              {...(errors["signature"] ? { error: errors["signature"] } : {})}
            />
            {kind === "minor" ? (
              <SignaturePad
                label="Minor assent signature (optional)"
                description="Age-appropriate: the minor may sign to show they agree to participate."
                value={assent}
                onChange={setAssent}
              />
            ) : null}

            <div
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
              data-error={errors["agreed"] ? "true" : undefined}
            >
              <Checkbox
                id="agreed"
                checked={agreed}
                onCheckedChange={(checked) => {
                  setAgreed(checked === true);
                  setErrors((e) => ({ ...e, agreed: "" }));
                }}
                className="mt-0.5 h-6 w-6"
              />
              <div>
                <Label htmlFor="agreed" className="text-sm leading-snug font-medium">
                  I confirm that I have read this release and voluntarily agree to its terms.
                </Label>
                {errors["agreed"] ? (
                  <p role="alert" className="mt-1 text-sm font-medium text-destructive">
                    {errors["agreed"]}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <p className="text-xs text-muted-foreground">{PRIVACY_NOTE}</p>

          <Button type="submit" size="lg" className="min-h-14 w-full text-base font-bold">
            Review before submitting
          </Button>
        </form>
      ) : (
        <div className="mt-8 space-y-6">
          <h2 className="text-lg font-bold">Review your release</h2>
          <dl className="divide-y divide-border rounded-lg border border-border bg-card">
            {reviewRows(kind, adult, minor).map(([label, value]) => (
              <div key={label} className="grid gap-1 px-4 py-3 sm:grid-cols-[220px_minmax(0,1fr)]">
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {label}
                </dt>
                <dd className="text-sm break-words">{value || "—"}</dd>
              </div>
            ))}
          </dl>
          <div className="rounded-lg border border-primary/40 bg-primary/10 p-4">
            <p className="text-xs font-bold tracking-widest text-primary uppercase">
              Agreed limitations / restrictions
            </p>
            <p className="mt-1 text-sm">
              {(kind === "adult" ? adult.restrictions : minor.restrictions).trim() || "None stated."}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Signature
            </p>
            <img
              src={signature}
              alt="Captured signature"
              className="mt-2 h-32 rounded-md border border-border bg-white object-contain p-2"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="min-h-12 flex-1"
              onClick={() => setStep("form")}
            >
              Go back and edit
            </Button>
            <Button
              type="button"
              className="min-h-12 flex-1 font-bold"
              disabled={submitting}
              onClick={submit}
            >
              {submitting ? "Submitting…" : "Sign & submit release"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function reviewRows(
  kind: ReleaseKind,
  adult: AdultFields,
  minor: MinorFields,
): Array<[string, string]> {
  if (kind === "adult") {
    return [
      ["Full legal name", adult.fullLegalName],
      ["On-screen name / title", adult.onScreenName],
      ["Organization", adult.organization],
      ["Email", adult.email],
      ["Mobile phone", adult.phone],
      ["Copy requested", adult.copyRequested === "yes" ? "Yes" : "No"],
      ["Release obtained by", adult.releaseObtainedBy],
      ["Session / location", adult.sessionLocation],
      ["Camera / card / file", adult.cameraCardFileRef],
    ];
  }
  return [
    ["Minor full legal name", minor.minorFullLegalName],
    ["Date of birth", minor.minorDob],
    ["Age", minor.minorAge],
    ["Guardian full name", minor.guardianFullName],
    ["Relationship", minor.relationship],
    ["Guardian email", minor.guardianEmail],
    ["Guardian phone", minor.guardianPhone],
    ["Copy requested", minor.copyRequested === "yes" ? "Yes" : "No"],
    ["Release obtained by", minor.releaseObtainedBy],
    ["Session / location", minor.sessionLocation],
    ["Camera / card / file", minor.cameraCardFileRef],
  ];
}

function Confirmation({ record }: { record: ReleaseRecord }) {
  const [busy, setBusy] = useState<"download" | "print" | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState<{ url: string; filename: string } | null>(null);
  const [hint, setHint] = useState("");

  async function run(kind: "download" | "print") {
    setBusy(kind);
    setError("");
    try {
      const result =
        kind === "download" ? await downloadReleasePdf(record) : await printReleasePdf(record);
      setReady({ url: result.url, filename: result.filename });
      setHint(
        result.delivery === "downloaded"
          ? "Saved to your downloads."
          : result.delivery === "shared"
            ? "Sent to your share sheet."
            : result.delivery === "opened"
              ? "Opened in a new tab — use your browser's share or save button."
              : "Your browser blocked the automatic download. Use the link below to open or save the PDF.",
      );
    } catch (err) {
      console.error("[release-pdf]", err);
      setError(
        err instanceof Error
          ? `Could not build the PDF: ${err.message}`
          : "Could not build the PDF on this device. Please try again.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-primary" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-black tracking-tight">Release signed</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Thank you. Your {record.kind === "adult" ? "adult" : "minor / guardian"} media release has
        been recorded for “{record.event.projectTitle}”.
      </p>

      <div className="mt-6 rounded-lg border border-border bg-card p-5">
        <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
          Release ID
        </p>
        <p className="mt-1 font-mono text-lg font-bold break-all">{record.releaseId}</p>
        <p className="mt-3 text-xs text-muted-foreground">Signed {record.signedAtDisplay}</p>
        <p className="mt-3 text-xs font-semibold text-primary">
          Saved securely to the production archive.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          className="min-h-12 flex-1 font-bold"
          disabled={busy !== null}
          onClick={() => void run("download")}
        >
          <Download className="h-4 w-4" aria-hidden="true" />{" "}
          {busy === "download" ? "Preparing PDF…" : "Download signed PDF"}
        </Button>
        <Button
          variant="outline"
          className="min-h-12 flex-1"
          disabled={busy !== null}
          onClick={() => void run("print")}
        >
          <Printer className="h-4 w-4" aria-hidden="true" /> {busy === "print" ? "Opening…" : "Print"}
        </Button>
      </div>
      {error && (
        <p className="mt-3 text-xs font-semibold text-destructive" role="alert">
          {error}
        </p>
      )}
      {ready && !error && (
        <p className="mt-3 text-xs text-muted-foreground">
          {hint}{" "}
          <a
            href={ready.url}
            download={ready.filename}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline underline-offset-4"
          >
            Open {ready.filename}
          </a>
        </p>
      )}

      <p className="mt-8 flex items-start gap-2 text-left text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {PRIVACY_NOTE}
      </p>

      <p className="mt-6 text-sm">
        <Link to="/releases" className="underline underline-offset-4">
          Back to start
        </Link>
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  required,
  error,
  hint,
  type = "text",
  autoComplete,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  type?: string | undefined;
  autoComplete?: string | undefined;
  inputMode?: "text" | "email" | "tel" | "numeric" | undefined;
}) {
  return (
    <div className="space-y-2" data-error={error ? "true" : undefined}>
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
        {required ? (
          <span className="text-primary" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <Input
        id={id}
        type={type}
        value={value}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-12 text-base"
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
