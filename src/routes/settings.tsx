import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";

import { Panel, SectionLabel, TapButton } from "@/components/primitives";
import { Field, Sheet } from "@/components/Sheet";
import { useLeaveByAlertsEnabled } from "@/components/live/LeaveByAlert";
import {
  notifyPermission,
  requestNotifyPermission,
  type NotifyPermission,
} from "@/lib/alerts";
import {
  backupFilename,
  buildBackup,
  parseBackup,
  summarize,
  type BackupFile,
} from "@/lib/backup";
import { shareOrDownload } from "@/lib/filename";
import { useTheme, type ThemePref } from "@/lib/theme";
import { SETTINGS_FIELDS } from "@/lib/settings";
import { estimateTravel } from "@/lib/travel";
import { formatMin, offsetForTargetMin, parseTimeInput } from "@/lib/time";
import { useStore } from "@/state/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · PSI Games Crew Control" },
      {
        name: "description",
        content:
          "Calibrate walk speeds, setup times and room distances, run the time simulator, and import or export crew state.",
      },
      { property: "og:title", content: "Settings · PSI Games Crew Control" },
      {
        property: "og:description",
        content:
          "Calibrate walk speeds, setup times and room distances, run the time simulator, and import or export crew state.",
      },
    ],
  }),
  component: SettingsScreen,
});

const CHECKS = [
  { from: "Element", to: "Westin", rig: true, label: "Element → Westin (rig)" },
  { from: "Home2", to: "Westin", rig: true, label: "Home2 → Westin (rig)" },
  { from: "Duane JW", to: "Westin", rig: false, label: "JW → Westin (light)" },
  { from: "Element", to: "Home2", rig: true, label: "Element → Home2" },
];

function SettingsScreen() {
  const {
    settings,
    updateSettings,
    resetSettings,
    simOffsetMs,
    setSimOffsetMs,
    now,
    epochMs,
  } = useStore();
  const [jump, setJump] = useState("12:35 PM");

  return (
    <AppShell>
      <Panel className="space-y-2">
        <SectionLabel>Appearance</SectionLabel>
        <ThemePicker />
      </Panel>
      <Panel className="space-y-2">
        <SectionLabel>Time simulator</SectionLabel>
        <p className="num text-xs">
          Charlotte (ET) now: <span className="font-bold">{now.clock}</span> ·{" "}
          {now.date}
        </p>
        <div className="flex gap-1.5">
          <input
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            placeholder="12:35 PM"
            className="num tap min-w-0 flex-1 rounded-md border border-border bg-secondary px-2 text-sm"
          />
          <TapButton
            tone="gold"
            active
            onClick={() => {
              const target = parseTimeInput(jump);
              if (target === null) return;
              setSimOffsetMs(
                offsetForTargetMin(epochMs - simOffsetMs, target, "2026-07-31"),
              );
            }}
          >
            Jump
          </TapButton>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[-15, -5, 5, 15].map((delta) => (
            <TapButton
              key={delta}
              onClick={() => setSimOffsetMs(simOffsetMs + delta * 60000)}
            >
              {delta > 0 ? `+${delta}m` : `${delta}m`}
            </TapButton>
          ))}
        </div>
        <TapButton className="w-full" onClick={() => setSimOffsetMs(0)}>
          Back to real time
        </TapButton>
      </Panel>

      <Panel className="space-y-2">
        <SectionLabel>Travel calibration</SectionLabel>
        <p className="text-[11px] text-muted-foreground">
          Every leave-by clock and every conflict warning in this app is computed from
          these numbers. Walk the routes on arrival and correct them here — wrong
          constants mean wrong warnings.
        </p>
        <ul className="space-y-1.5">
          {SETTINGS_FIELDS.map((field) => (
            <li key={field.key} className="flex items-center gap-2">
              <label className="min-w-0 flex-1 text-[11px]" htmlFor={field.key}>
                {field.label}
                <span className="num ml-1 text-[10px] text-muted-foreground">
                  {field.unit}
                </span>
              </label>
              <input
                id={field.key}
                type="number"
                step={field.step}
                value={settings[field.key]}
                onChange={(e) =>
                  updateSettings({ [field.key]: Number(e.target.value) })
                }
                className="num tap w-20 rounded-md border border-border bg-secondary px-2 text-sm"
              />
            </li>
          ))}
        </ul>
        <TapButton className="w-full" onClick={resetSettings}>
          Reset to verified defaults
        </TapButton>
      </Panel>

      <Panel className="space-y-1">
        <SectionLabel>Current estimates</SectionLabel>
        {CHECKS.map((c) => (
          <p key={c.label} className="num flex justify-between text-[11px]">
            <span className="text-muted-foreground">{c.label}</span>
            <span className="font-bold">
              {estimateTravel(c.from, c.to, { carryingRig: c.rig, settings }).minutes}m
            </span>
          </p>
        ))}
        <p className="num pt-1 text-[10px] text-muted-foreground">
          Day starts {formatMin(8 * 60)} · venue America/New_York
        </p>
      </Panel>

      <BackupPanel />

      <Panel className="space-y-2">
        <SectionLabel>Leave-by alerts</SectionLabel>
        <AlertsPanel />
      </Panel>

    </AppShell>
  );
}
const THEME_OPTIONS: { id: ThemePref; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

function ThemePicker() {
  const { theme, resolved, setTheme } = useTheme();
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 gap-1.5">
        {THEME_OPTIONS.map((o) => (
          <TapButton
            key={o.id}
            tone="gold"
            active={theme === o.id}
            onClick={() => setTheme(o.id)}
          >
            {o.label}
          </TapButton>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Currently showing {resolved} mode. Your choice is remembered on this device.
      </p>
    </div>
  );
}


function BackupPanel() {
  const { crew, settings, applyBackup, epochMs, addLog } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [busy, setBusy] = useState(false);

  const exportBackup = async () => {
    setBusy(true);
    try {
      const file = buildBackup(crew, settings);
      const blob = new Blob([JSON.stringify(file, null, 2)], {
        type: "application/json",
      });
      const name = backupFilename(epochMs);
      const how = await shareOrDownload(blob, name);
      addLog({ kind: "note", text: `Backup exported (${name})` });
      toast.success(how === "shared" ? "Backup shared" : "Backup downloaded", {
        description: name,
      });
    } catch {
      toast.error("Could not create the backup file");
    } finally {
      setBusy(false);
    }
  };

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    const parsed = parseBackup(await file.text());
    if (!parsed) {
      toast.error("That file is not a Phoenix Field Live backup");
      return;
    }
    setPending(parsed);
  };

  return (
    <>
      <Panel className="space-y-2">
        <SectionLabel>Backup &amp; restore</SectionLabel>
        <p className="text-[11px] text-muted-foreground">
          Everything lives on this phone. Export a backup file after each day — it holds
          the agenda statuses, notes, interviews and log. Interview audio stays on the
          device and is not included.
        </p>
        <p className="num text-[10px] text-muted-foreground">On this phone: {summarize(crew)}</p>
        <div className="grid grid-cols-2 gap-1.5">
          <TapButton
            tone="gold"
            active
            className="h-12"
            disabled={busy}
            onClick={() => void exportBackup()}
          >
            {busy ? "Preparing…" : "Export backup"}
          </TapButton>
          <TapButton className="h-12" onClick={() => fileInput.current?.click()}>
            Import / restore
          </TapButton>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => {
            void pickFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </Panel>

      <Sheet
        open={Boolean(pending)}
        title="Restore backup"
        onClose={() => setPending(null)}
      >
        {pending && (
          <>
            <Field label="Backup contents">
              <p className="num rounded-md border border-border bg-secondary p-2 text-[11px]">
                {summarize(pending.crew)}
                {pending.exportedAt ? ` · saved ${pending.exportedAt.slice(0, 16).replace("T", " ")}` : ""}
              </p>
            </Field>
            <p className="text-[11px] text-muted-foreground">
              Merge keeps everything already on this phone and adds anything missing.
              Replace wipes this phone&apos;s data and uses the backup exactly.
            </p>
            <TapButton
              tone="gold"
              active
              className="h-12 w-full"
              onClick={() => {
                applyBackup(pending, "merge");
                setPending(null);
                toast.success("Backup merged into this phone");
              }}
            >
              Merge into this phone
            </TapButton>
            <TapButton
              tone="alert"
              active
              className="h-12 w-full"
              onClick={() => {
                if (!window.confirm("Replace all data on this phone with the backup?")) return;
                applyBackup(pending, "replace");
                setPending(null);
                toast.success("This phone now matches the backup");
              }}
            >
              Replace everything
            </TapButton>
            <TapButton className="h-11 w-full" onClick={() => setPending(null)}>
              Cancel
            </TapButton>
          </>
        )}
      </Sheet>
    </>
  );
}

function AlertsPanel() {
  const { enabled, setEnabled } = useLeaveByAlertsEnabled();
  const [permission, setPermission] = useState<NotifyPermission>("default");
  useEffect(() => setPermission(notifyPermission()), []);

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">
        Alerts fire 10 minutes before the next departure and again at go-time. Without
        notification permission the app shows a countdown banner instead.
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        <TapButton
          tone="gold"
          active={enabled}
          className="h-11"
          onClick={() => {
            setEnabled(true);
            toast.success("Leave-by alerts on");
          }}
        >
          On
        </TapButton>
        <TapButton
          tone="alert"
          active={!enabled}
          className="h-11"
          onClick={() => {
            setEnabled(false);
            toast("Leave-by alerts muted");
          }}
        >
          Muted
        </TapButton>
      </div>
      {permission !== "granted" && permission !== "unsupported" && (
        <TapButton
          className="h-11 w-full"
          onClick={() =>
            void requestNotifyPermission().then((next) => {
              setPermission(next);
              if (next === "granted") toast.success("Notifications allowed");
              else toast("Banner countdown will be used instead");
            })
          }
        >
          Allow notifications
        </TapButton>
      )}
      <p className="num text-[10px] text-muted-foreground">
        Notification permission: {permission}
      </p>
    </div>
  );
}
