import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Panel, SectionLabel, TapButton } from "@/components/primitives";
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
    exportState,
    importState,
  } = useStore();
  const [jump, setJump] = useState("12:35 PM");
  const [payload, setPayload] = useState("");

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

      <Panel className="space-y-2">
        <SectionLabel>Import / export</SectionLabel>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={5}
          placeholder="Paste crew state JSON here to import"
          className="num w-full rounded-md border border-border bg-secondary p-2 text-[11px]"
        />
        <div className="grid grid-cols-2 gap-1.5">
          <TapButton onClick={() => setPayload(exportState())}>Export</TapButton>
          <TapButton
            tone="gold"
            active
            onClick={() => {
              if (!importState(payload)) window.alert("Invalid JSON");
            }}
          >
            Import
          </TapButton>
        </div>
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
