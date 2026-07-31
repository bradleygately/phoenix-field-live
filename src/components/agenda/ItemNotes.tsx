import { useEffect, useState } from "react";

import { TextArea } from "@/components/Sheet";
import { SortableSwipeList } from "@/components/gestures/SortableSwipeList";
import { cleanupNote } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";
import { useStore } from "@/state/store";
import type { ItemNote } from "@/types";

function timeLabel(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ItemNotes({ itemId, context }: { itemId: string; context?: string }) {
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
  const [cleaning, setCleaning] = useState(false);
  const [cleaned, setCleaned] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    setDraft("");
    setSaved(false);
    setUndo(null);
    setCleaned(null);
    setAiError(null);
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
    setCleaned(null);
    setAiError(null);
    setSaved(true);
  };

  const runCleanup = async () => {
    const text = draft.trim();
    if (!text || cleaning) return;
    setCleaning(true);
    setAiError(null);
    try {
      const result = await cleanupNote({
        data: context ? { text, context } : { text },
      });
      setCleaned(result.cleaned);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI cleanup failed.");
    } finally {
      setCleaning(false);
    }
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
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          // Pointer-down so the textarea blur/auto-save doesn't fire first and clear the draft.
          onPointerDown={(e) => e.preventDefault()}
          onClick={runCleanup}
          disabled={!draft.trim() || cleaning}
          className="min-h-12 rounded-md border border-border bg-secondary text-sm font-semibold disabled:opacity-40"
        >
          {cleaning ? "Cleaning…" : "Clean up with AI"}
        </button>
        <button
          type="button"
          onClick={commit}
          disabled={!draft.trim()}
          className="min-h-12 rounded-md border border-primary bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          Add note
        </button>
      </div>

      {aiError && (
        <p className="rounded-md border border-destructive/60 px-2 py-2 text-[11px] text-destructive">
          {aiError}
        </p>
      )}

      {cleaned !== null && (
        <div className="space-y-1.5 rounded-lg border border-primary/60 bg-secondary p-2.5">
          <p className="num text-[10px] tracking-widest text-primary uppercase">
            AI cleaned draft
          </p>
          <TextArea
            rows={3}
            value={cleaned}
            onChange={(e) => setCleaned(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setCleaned(null)}
              className="min-h-11 rounded-md border border-border text-xs font-semibold text-muted-foreground"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => {
                const text = (cleaned ?? "").trim();
                if (!text) return;
                addItemNote(itemId, text);
                setDraft("");
                setCleaned(null);
                setSaved(true);
              }}
              className="min-h-11 rounded-md border border-primary bg-primary text-xs font-semibold text-primary-foreground"
            >
              Save cleaned note
            </button>
          </div>
        </div>
      )}

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
