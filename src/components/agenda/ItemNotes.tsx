import { useEffect, useState } from "react";

import { TextArea } from "@/components/Sheet";
import { SortableSwipeList } from "@/components/gestures/SortableSwipeList";
import { cn } from "@/lib/utils";
import { useStore } from "@/state/store";
import type { ItemNote } from "@/types";

function timeLabel(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ItemNotes({ itemId }: { itemId: string }) {
  const {
    itemNotesFor,
    addItemNote,
    deleteItemNote,
    keepItemNote,
    restoreItemNote,
    reorderItemNotes,
  } = useStore();
  const notes = itemNotesFor(itemId);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);
  const [undo, setUndo] = useState<ItemNote | null>(null);

  useEffect(() => {
    setDraft("");
    setSaved(false);
    setUndo(null);
  }, [itemId]);

  useEffect(() => {
    if (!saved) return;
    const id = window.setTimeout(() => setSaved(false), 2000);
    return () => window.clearTimeout(id);
  }, [saved]);

  useEffect(() => {
    if (!undo) return;
    const id = window.setTimeout(() => setUndo(null), 6000);
    return () => window.clearTimeout(id);
  }, [undo]);

  const commit = () => {
    if (!draft.trim()) return;
    addItemNote(itemId, draft);
    setDraft("");
    setSaved(true);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="num text-[10px] tracking-widest text-muted-foreground uppercase">
          Notes ({notes.length})
        </span>
        <span
          className={cn(
            "num text-[10px] font-semibold text-ok transition-opacity",
            saved ? "opacity-100" : "opacity-0",
          )}
        >
          Saved ✓
        </span>
      </div>

      <TextArea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        placeholder="Add a note — saves automatically"
      />
      <button
        type="button"
        onClick={commit}
        disabled={!draft.trim()}
        className="min-h-12 w-full rounded-md border border-primary bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-40"
      >
        Add note
      </button>

      {undo && (
        <div className="flex items-center justify-between rounded-md border border-border bg-secondary px-2 py-2">
          <span className="text-[11px] text-muted-foreground">Note discarded</span>
          <button
            type="button"
            onClick={() => {
              restoreItemNote(undo);
              setUndo(null);
            }}
            className="rounded-md border border-primary px-3 py-1.5 text-[11px] font-bold text-primary uppercase"
          >
            Undo
          </button>
        </div>
      )}

      {notes.length > 0 && (
        <SortableSwipeList
          items={notes}
          getId={(n) => n.id}
          keepLabel="Keep"
          deleteLabel="Discard"
          onReorder={(ids) => reorderItemNotes(ids)}
          onKeep={(n) => keepItemNote(n.id)}
          onDelete={(n) => {
            deleteItemNote(n.id);
            setUndo(n);
          }}
          className="space-y-1.5"
          renderItem={(note) => (
            <div
              className={cn(
                "rounded-lg border bg-card p-2.5",
                note.kept ? "border-ok" : "border-border",
              )}
            >
              <p className="min-w-0 text-xs whitespace-pre-wrap">{note.text}</p>
              <p className="num mt-1 text-[10px] text-muted-foreground uppercase">
                {note.author} · {timeLabel(note.at)}
                {note.kept ? " · kept" : ""}
              </p>
            </div>
          )}
        />
      )}
    </div>
  );
}
