import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import type SignatureCanvasType from "react-signature-canvas";
import { Button } from "@/components/ui/button";

const SignatureCanvas = lazy(async () => {
  const mod = await import("react-signature-canvas");
  return { default: mod.default as unknown as React.ComponentType<Record<string, unknown>> };
});

type Props = {
  label: string;
  description?: string | undefined;
  value: string;
  onChange: (dataUrl: string) => void;
  required?: boolean | undefined;
  error?: string | undefined;
};

function Pad({ label, description, value, onChange, required, error }: Props) {
  const ref = useRef<SignatureCanvasType | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 320, height: 180 });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: 180 });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const capture = () => {
    const pad = ref.current;
    if (!pad || pad.isEmpty()) {
      onChange("");
      return;
    }
    onChange(pad.getCanvas().toDataURL("image/png"));
  };

  const clear = () => {
    ref.current?.clear();
    onChange("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold tracking-wide uppercase">
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </span>
        {value ? <span className="text-xs font-medium text-primary">Signature captured</span> : null}
      </div>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      <div
        ref={wrapperRef}
        className="rounded-lg border-2 border-border bg-card p-1"
        style={{ touchAction: "none" }}
      >
        <SignatureCanvas
          {...({
            ref,
            penColor: "#111111",
            onEnd: capture,
            canvasProps: {
              width: size.width - 10,
              height: size.height,
              className: "rounded-md bg-white block",
              "aria-label": `${label} signature drawing area`,
              role: "img",
            },
          } as Record<string, unknown>)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clear} className="min-h-11">
          Clear signature
        </Button>
        <span className="text-xs text-muted-foreground">
          Sign with your finger or mouse inside the box.
        </span>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SignaturePad(props: Props) {
  return (
    <ClientOnly
      fallback={<div className="h-52 rounded-lg border-2 border-dashed border-border bg-card/50" />}
    >
      <Suspense
        fallback={<div className="h-52 rounded-lg border-2 border-dashed border-border bg-card/50" />}
      >
        <Pad {...props} />
      </Suspense>
    </ClientOnly>
  );
}
