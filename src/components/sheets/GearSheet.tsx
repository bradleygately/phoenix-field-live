import { useState } from "react";

import { ChipRow, Field, Sheet, TextInput } from "@/components/Sheet";
import { TapButton } from "@/components/primitives";
import { useStore } from "@/state/store";
import {
  CARD_STATES,
  CREW_IDS,
  canSetCardState,
  type CardState,
  type CrewId,
  type GearIssue,
} from "@/types";

const KINDS: GearIssue["kind"][] = ["battery", "camera", "audio", "other"];

export function GearSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addGear, upsertCard, crew, setCardState, role } = useStore();
  const [tab, setTab] = useState<"gear" | "card">("gear");
  const [kind, setKind] = useState<GearIssue["kind"]>("battery");
  const [text, setText] = useState("");
  const [holder, setHolder] = useState<CrewId>(role);
  const [cardId, setCardId] = useState("");
  const [error, setError] = useState("");

  return (
    <Sheet open={open} title="Gear / media card" onClose={onClose}>
      <div className="grid grid-cols-2 gap-1.5">
        <TapButton
          tone="gold"
          active={tab === "gear"}
          className="h-10"
          onClick={() => setTab("gear")}
        >
          Gear issue
        </TapButton>
        <TapButton
          tone="gold"
          active={tab === "card"}
          className="h-10"
          onClick={() => setTab("card")}
        >
          Media cards
        </TapButton>
      </div>

      {tab === "gear" ? (
        <>
          <Field label="Type">
            <ChipRow options={KINDS} value={kind} onChange={setKind} />
          </Field>
          <Field label="Holder">
            <ChipRow options={CREW_IDS} value={holder} onChange={setHolder} />
          </Field>
          <Field label="What happened">
            <TextInput
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="A-cam battery at 15%, swap before Main Stage"
            />
          </Field>
          <TapButton
            tone="gold"
            active
            className="h-11 w-full"
            onClick={() => {
              if (!text.trim()) return;
              addGear({ kind, text: text.trim(), holder });
              setText("");
              onClose();
            }}
          >
            Log gear issue
          </TapButton>
        </>
      ) : (
        <>
          <Field label="New card ID">
            <TextInput
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              placeholder="A-CAM-03"
            />
          </Field>
          <Field label="Holder">
            <ChipRow options={CREW_IDS} value={holder} onChange={setHolder} />
          </Field>
          <TapButton
            className="h-10 w-full"
            onClick={() => {
              if (!cardId.trim()) return;
              upsertCard({
                id: `card-${Date.now()}`,
                cardId: cardId.trim(),
                holder,
                state: "Active",
                note: "",
                updatedAt: Date.now(),
              });
              setCardId("");
            }}
          >
            Add card
          </TapButton>

          <p className="text-[10px] text-primary">
            Never reformat before two verified copies. Reformat stays locked until Copy 2
            is verified.
          </p>
          {error && <p className="text-[11px] text-destructive">{error}</p>}

          <ul className="space-y-2">
            {crew.cards.length === 0 && (
              <li className="text-[11px] text-muted-foreground">No cards tracked yet.</li>
            )}
            {crew.cards.map((card) => (
              <li key={card.id} className="rounded-md border border-border p-2">
                <p className="num text-[11px] font-bold">
                  {card.cardId}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {card.holder} · {card.state}
                  </span>
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {CARD_STATES.map((state) => {
                    const allowed = canSetCardState(card.state, state as CardState);
                    return (
                      <button
                        key={state}
                        type="button"
                        disabled={!allowed}
                        onClick={() => {
                          const ok = setCardState(card.id, state as CardState);
                          setError(
                            ok
                              ? ""
                              : `Blocked: ${card.cardId} needs two verified copies before ${state}.`,
                          );
                        }}
                        className={`tap rounded border px-1.5 text-[10px] font-semibold ${
                          card.state === state
                            ? "border-primary text-primary"
                            : allowed
                              ? "border-border bg-secondary"
                              : "border-border/40 text-muted-foreground/40"
                        }`}
                      >
                        {state}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  );
}