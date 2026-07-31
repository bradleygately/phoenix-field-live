import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Sheet, TextArea } from "@/components/Sheet";
import { TapButton } from "@/components/primitives";
import { InterviewSheet } from "@/components/sheets/InterviewSheet";
import { itemsForDate, pickLead, runningNow } from "@/lib/live";
import { useStore } from "@/state/store";

/** Two taps from anywhere: capture a note on the live block, or start an interview. */
export function QuickCapture() {
  const { schedule, now, role, addItemNote, deleteItemNote } = useStore();
  const [open, setOpen] = useState(false);
  const [interview, setInterview] = useState(false);
  const [text, setText] = useState("");

  const nowItem = useMemo(() => {
    const items = itemsForDate(schedule, now.date);
    return pickLead(runningNow(items, now.min), role) ?? items.find((i) => i.startMin > now.min) ?? null;
  }, [now.date, now.min, role, schedule]);

  const save = () => {
    const trimmed = text.trim();
    if (!trimmed || !nowItem) return;
    const before = new Set((useStoreNoteIds(nowItem.id)));
    addItemNote(nowItem.id, trimmed);
    setText("");
    setOpen(false);
    toast.success("Note saved", {
      description: nowItem.title,
      action: {
        label: "Undo",
        onClick: () => {
          const added = useStoreNoteIds(nowItem.id).find((id) => !before.has(id));
          if (added) deleteItemNote(added);
        },
      },
    });
  };

  // Reading straight from the live store avoids a stale closure on undo.
  const store = useStore();
  function useStoreNoteIds(itemId: string): string[] {
    return store.itemNotesFor(itemId).map((n) => n.id);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Quick capture"
        onClick={() => setOpen(true)}
        className="fixed right-3 bottom-20 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground shadow-lg active:scale-95"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        <Plus className="h-7 w-7" />
      </button>

      <Sheet open={open} title="Quick capture" onClose={() => setOpen(false)}>
        <p className="text-[11px] text-muted-foreground">
          {nowItem
            ? `Attaches to ${nowItem.startLabel} · ${nowItem.title}`
            : "No live block right now — notes need a block, start an interview instead."}
        </p>
        <TextArea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What just happened?"
        />
        <TapButton
          tone="gold"
          active
          className="h-12 w-full"
          disabled={!text.trim() || !nowItem}
          onClick={save}
        >
          Save note
        </TapButton>
        <TapButton
          className="h-12 w-full"
          onClick={() => {
            setOpen(false);
            setInterview(true);
          }}
        >
          ● Start interview
        </TapButton>
      </Sheet>

      <InterviewSheet
        open={interview}
        onClose={() => setInterview(false)}
        item={nowItem}
      />
    </>
  );
}
