import { Download, Printer } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND } from "@/lib/release-content";

export function AdminQr() {
  const [url, setUrl] = useState("");
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/releases`);
  }, []);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    void (async () => {
      const QRCode = await import("qrcode");
      const png = await QRCode.toDataURL(url, {
        width: 1200,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#000000", light: "#ffffff" },
      });
      if (!cancelled) setDataUrl(png);
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  function download() {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "psi-games-2026-release-qr.png";
    a.click();
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3 print:hidden">
        <h2 className="text-lg font-black">QR code for the public release form</h2>
        <div className="space-y-2">
          <Label htmlFor="qr-url" className="text-sm font-semibold">
            Destination URL
          </Label>
          <Input
            id="qr-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="min-h-12"
          />
          <p className="text-xs text-muted-foreground">
            Defaults to this device's release page. After publishing, paste the public production
            URL.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={download} disabled={!dataUrl} className="min-h-11">
            <Download className="h-4 w-4" aria-hidden="true" /> Download QR PNG
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="min-h-11">
            <Printer className="h-4 w-4" aria-hidden="true" /> Print 8.5×11 signage
          </Button>
        </div>
      </section>

      <section
        aria-label="Printable signage preview"
        className="mx-auto w-full max-w-[8.5in] border border-border bg-white p-10 text-center text-black print:border-0 print:p-0"
        style={{ aspectRatio: "8.5 / 11" }}
      >
        <p className="text-sm font-black tracking-[0.3em] uppercase">{BRAND.company}</p>
        <p className="mt-1 text-[11px] tracking-widest uppercase">{BRAND.program}</p>
        <h2 className="mt-8 text-[2.6rem] leading-none font-black tracking-tight">
          SCAN TO SIGN
          <br />
          MEDIA RELEASE
        </h2>
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR code linking to ${url}`}
            className="mx-auto mt-8 w-[58%] max-w-[4.6in]"
          />
        ) : (
          <div className="mx-auto mt-8 aspect-square w-[58%] max-w-[4.6in] bg-neutral-200" />
        )}
        <ol className="mx-auto mt-6 max-w-[5.5in] space-y-1 text-left text-[13px] leading-snug">
          <li>1. Open your phone camera and scan the code above.</li>
          <li>2. Choose Adult Release or Minor / Guardian Release.</li>
          <li>3. Fill in your details, sign with your finger, and submit.</li>
          <li>4. Ask any crew member if you need help or a printed copy.</li>
        </ol>
        <p className="mt-6 text-[11px]">
          “{BRAND.projectTitle}” · {BRAND.eventName}
          <br />
          {BRAND.venue} · {BRAND.dates}
        </p>
        <p className="mt-3 text-[11px]">
          {BRAND.email} · {BRAND.phone} · {BRAND.website}
        </p>
      </section>
    </div>
  );
}
