import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { EmptyState, Panel, SectionLabel, TapButton } from "@/components/primitives";
import { useStore } from "@/state/store";
import { LOG_KINDS, type LogKind } from "@/types";

export const Route = createFileRoute("/log")({
  head: () => ({
    meta: [
      { title: "Log · PSI Games Crew Control" },
      {
        name: "description",
        content:
          "Chronological crew log of status changes, ops decisions and revertible program changes.",
      },
      { property: "og:title", content: "Log · PSI Games Crew Control" },
      {
        property: "og:description",
        content:
          "Chronological crew log of status changes, ops decisions and revertible program changes.",
      },
    ],
  }),
  component: LogScreen,
});

function LogScreen() {
  const { crew, revertChange, exportState, syncState } = useStore();
  const [kind, setKind] = useState<LogKind | "all">("all");
  const [copied, setCopied] = useState(false);
  const active = crew.changes.filter((c) => !c.reverted);
  const entries = useMemo(
    () => (kind === "all" ? crew.log : crew.log.filter((e) => e.kind === kind)),
    [crew.log, kind],
  );

  const report = () =>
    [
      `PSI GAMES CREW LOG — exported ${new Date().toLocaleString()}`,
      `Sync: ${syncState.toUpperCase()} · queued edits: ${crew.queue.length}`,
      "",
      "ACTIVE OVERRIDES",
      ...active.map(
        (c) => `- ${c.field}: "${c.officialValue}" → "${c.currentValue}" (${c.editor}: ${c.reason})`,
      ),
      "",
      "ACTIVITY",
      ...crew.log.map(
        (e) => `- ${new Date(e.at).toLocaleTimeString()} [${e.kind}] ${e.editor}: ${e.text}`,
      ),
    ].join("\n");

  return (
    <AppShell>
      <div className="flex flex-wrap gap-1">
        <TapButton
          tone="gold"
          active={kind === "all"}
          className="h-9 px-2 text-[10px]"
          onClick={() => setKind("all")}
        >
          all
        </TapButton>
        {LOG_KINDS.map((k) => (
          <TapButton
            key={k}
            tone="gold"
            active={kind === k}
            className="h-9 px-2 text-[10px]"
            onClick={() => setKind(k)}
          >
            {k}
          </TapButton>
        ))}
      </div>

      <Panel>
        <SectionLabel>Revertible changes ({active.length})</SectionLabel>
        {active.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No official values are currently overridden.
          </p>
        ) : (
          <ul className="space-y-2">
            {active.map((c) => (
              <li key={c.id} className="rounded border border-border p-2 text-[11px]">
                <p className="num text-[10px] text-muted-foreground uppercase">
                  {c.field} · {c.editor}
                </p>
                <p className="mt-0.5">
                  <span className="text-muted-foreground line-through">
                    {c.officialValue || "—"}
                  </span>{" "}
                  → <span className="font-semibold text-primary">{c.currentValue}</span>
                </p>
                <p className="text-muted-foreground">{c.reason}</p>
                <button
                  type="button"
                  onClick={() => revertChange(c.id)}
                  className="tap mt-1 rounded border border-border px-2 text-[11px] font-semibold"
                >
                  Revert to official
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <SectionLabel>Activity log ({entries.length})</SectionLabel>
        {entries.length === 0 ? (
          <EmptyState
            title="Nothing logged yet"
            body="Status changes, notes, interviews, card moves and schedule overrides are recorded here automatically."
          />
        ) : (
          <ul className="space-y-1.5">
            {entries.map((entry) => (
              <li key={entry.id} className="text-[11px]">
                <span className="num mr-1 text-[10px] text-muted-foreground uppercase">
                  {new Date(entry.at).toLocaleTimeString()} · {entry.kind} ·{" "}
                  {entry.editor}
                </span>
                <span>{entry.text}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel className="space-y-1.5">
        <SectionLabel>Handoff report</SectionLabel>
        <div className="grid grid-cols-2 gap-1.5">
          <TapButton
            className="h-11"
            onClick={() => {
              void navigator.clipboard?.writeText(report());
              setCopied(true);
            }}
          >
            {copied ? "Copied ✓" : "Copy text report"}
          </TapButton>
          <TapButton
            className="h-11"
            onClick={() => void navigator.clipboard?.writeText(exportState())}
          >
            Copy JSON state
          </TapButton>
        </div>
      </Panel>
    </AppShell>
  );
}