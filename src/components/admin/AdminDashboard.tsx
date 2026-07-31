import { Download, FileDown, Image as ImageIcon, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteRelease, listReleases, signedFileUrl, type ReleaseRow } from "@/lib/release-supabase";

const CSV_HEADERS = [
  "Release ID",
  "Type",
  "Participant",
  "Signer",
  "Email",
  "Phone",
  "Restrictions",
  "Copy Requested",
  "On-screen Name",
  "Organization",
  "Relationship",
  "Date of Birth",
  "Age",
  "Obtained By",
  "Session / Location",
  "Camera / Card / File",
  "Signed At",
];

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function toCsv(rows: ReleaseRow[]) {
  const body = rows.map((r) =>
    [
      r.release_id,
      r.kind,
      r.participant_name,
      r.signer_name,
      r.contact_email,
      r.contact_phone,
      r.restrictions ?? "",
      r.copy_requested ? "yes" : "no",
      r.on_screen_name ?? "",
      r.organization ?? "",
      r.relationship ?? "",
      r.minor_dob ?? "",
      r.minor_age ?? "",
      r.release_obtained_by ?? "",
      r.session_location ?? "",
      r.camera_card_ref ?? "",
      new Date(r.signed_at).toLocaleString(),
    ]
      .map(csvCell)
      .join(","),
  );
  return [CSV_HEADERS.map(csvCell).join(","), ...body].join("\n");
}

export function AdminDashboard() {
  const [rows, setRows] = useState<ReleaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "adult" | "minor">("all");
  const [query, setQuery] = useState("");
  const [signaturePreview, setSignaturePreview] = useState<Record<string, string>>({});

  async function refresh() {
    setLoading(true);
    try {
      setRows(await listReleases());
    } catch (err) {
      console.error(err);
      toast.error("Could not load releases.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.kind !== filter) return false;
      if (!q) return true;
      return [r.release_id, r.participant_name, r.signer_name, r.contact_email, r.contact_phone]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, filter, query]);

  async function openPdf(row: ReleaseRow) {
    if (!row.pdf_path) {
      toast.error("No stored PDF for this release.");
      return;
    }
    try {
      window.open(await signedFileUrl("release-pdfs", row.pdf_path), "_blank");
    } catch (err) {
      console.error(err);
      toast.error("Could not open the signed PDF.");
    }
  }

  async function toggleSignature(row: ReleaseRow) {
    if (signaturePreview[row.id]) {
      setSignaturePreview((p) => {
        const next = { ...p };
        delete next[row.id];
        return next;
      });
      return;
    }
    if (!row.signature_path) {
      toast.error("No stored signature image.");
      return;
    }
    try {
      const url = await signedFileUrl("release-signatures", row.signature_path);
      setSignaturePreview((p) => ({ ...p, [row.id]: url }));
    } catch (err) {
      console.error(err);
      toast.error("Could not load the signature.");
    }
  }

  function exportCsv() {
    const blob = new Blob([toCsv(visible)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `psi-games-2026-releases-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total releases" value={String(rows.length)} />
        <Stat label="Adult" value={String(rows.filter((r) => r.kind === "adult").length)} />
        <Stat
          label="Minor / guardian"
          value={String(rows.filter((r) => r.kind === "minor").length)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-2">
          <Label htmlFor="search" className="text-xs font-semibold uppercase">
            Search name, Release ID, email or phone
          </Label>
          <Input
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Jane Doe or PSI26-A-…"
            className="min-h-12"
          />
        </div>
        <div className="flex items-end gap-2">
          {(["all", "adult", "minor"] as const).map((option) => (
            <Button
              key={option}
              variant={filter === option ? "default" : "outline"}
              onClick={() => setFilter(option)}
              aria-pressed={filter === option}
              className="min-h-12 capitalize"
            >
              {option}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={exportCsv} className="min-h-11">
          <FileDown className="h-4 w-4" aria-hidden="true" /> Export CSV
        </Button>
        <Button variant="ghost" onClick={() => void refresh()} className="min-h-11">
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Loading releases…
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No releases match this view yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((row) => (
            <li key={row.id} className="rounded-lg border border-border bg-card p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold">{row.participant_name}</p>
                  <p className="font-mono text-xs break-all text-muted-foreground">
                    {row.release_id}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.kind === "adult" ? "Adult release" : "Minor / guardian release"} ·{" "}
                    {new Date(row.signed_at).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs break-words text-muted-foreground">
                    {row.contact_email} · {row.contact_phone}
                  </p>
                  {row.kind === "minor" ? (
                    <p className="text-xs text-muted-foreground">
                      Guardian: {row.signer_name}
                      {row.relationship ? ` (${row.relationship})` : ""}
                      {row.minor_age ? ` · age ${row.minor_age}` : ""}
                    </p>
                  ) : null}
                  {row.copy_requested ? (
                    <p className="mt-1 text-xs font-semibold text-primary">Copy requested</p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-full border border-primary px-2 py-1 text-[10px] font-bold tracking-widest text-primary uppercase">
                  Signed
                </span>
              </div>

              {(row.restrictions ?? "").trim() ? (
                <div className="mt-3 rounded-md border-2 border-primary bg-primary/10 p-3">
                  <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">
                    Restrictions
                  </p>
                  <p className="mt-1 text-sm font-semibold">{row.restrictions}</p>
                </div>
              ) : null}

              {signaturePreview[row.id] ? (
                <img
                  src={signaturePreview[row.id]}
                  alt={`Signature for ${row.release_id}`}
                  className="mt-3 h-28 rounded-md border border-border bg-white object-contain p-2"
                />
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-10"
                  onClick={() => void openPdf(row)}
                >
                  <Download className="h-4 w-4" aria-hidden="true" /> Signed PDF
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="min-h-10"
                  onClick={() => void toggleSignature(row)}
                >
                  <ImageIcon className="h-4 w-4" aria-hidden="true" />
                  {signaturePreview[row.id] ? "Hide signature" : "Signature"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="min-h-10 text-destructive"
                  onClick={async () => {
                    if (!window.confirm(`Delete ${row.release_id}? This cannot be undone.`)) return;
                    try {
                      await deleteRelease(row);
                      toast.success("Release deleted.");
                      void refresh();
                    } catch (err) {
                      console.error(err);
                      toast.error("Could not delete this release.");
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}
