"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  X,
  PushPin,
  Plus,
  Trash,
  Sparkle,
  DotsSixVertical,
  PencilSimple,
} from "@phosphor-icons/react";
import { useVision } from "@/lib/vision/vision-store";
import type { MoodboardItem } from "@/lib/vision/moodboard";
import { conceptGradient } from "@/lib/vision/prompt";

/**
 * Vision Moodboard — full-screen panel accessible from the studio header.
 * Ships Save inspiration (manual add), Pin references (from concepts), and
 * drag reordering. Compare + explicit Collections are follow-ups.
 */
export function MoodboardPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    moodboard,
    addMoodboardReference,
    removeMoodboardReference,
    updateMoodboardNote,
    reorderMoodboard,
  } = useVision();
  const reduce = useReducedMotion();
  const [drafts, setDrafts] = useState({ title: "", note: "", hue: 82 });
  const dragFrom = useRef<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const stats = useMemo(
    () => ({
      manual: moodboard.filter((m) => m.kind === "manual").length,
      pinned: moodboard.filter((m) => m.kind === "concept").length,
    }),
    [moodboard],
  );

  const handleAdd = useCallback(() => {
    if (!drafts.title.trim()) return;
    addMoodboardReference(drafts.title, drafts.note, drafts.hue);
    setDrafts({ title: "", note: "", hue: 82 });
  }, [drafts, addMoodboardReference]);

  const startNoteEdit = useCallback((item: MoodboardItem) => {
    setEditingNoteId(item.id);
    setNoteDraft(item.note ?? "");
  }, []);

  const commitNoteEdit = useCallback(() => {
    if (!editingNoteId) return;
    updateMoodboardNote(editingNoteId, noteDraft);
    setEditingNoteId(null);
  }, [editingNoteId, noteDraft, updateMoodboardNote]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="moodboard-title"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[6vh]"
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
        >
          <button
            type="button"
            aria-label="Close moodboard"
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.85)]"
          >
            <div className="flex items-center justify-between border-b border-line-soft px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-accent/10 text-accent-fg">
                  <PushPin className="size-4" weight="fill" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                    Moodboard
                  </p>
                  <h2
                    id="moodboard-title"
                    className="text-[15px] font-medium text-ink"
                  >
                    {moodboard.length === 0
                      ? "Start collecting inspiration"
                      : `${stats.manual} references · ${stats.pinned} pinned concepts`}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-8 cursor-pointer place-items-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid gap-5 px-6 py-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
              {/* Add form */}
              <aside className="flex flex-col gap-3 rounded-2xl border border-line-soft bg-bg p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                  Save a reference
                </p>
                <label className="block">
                  <span className="mb-1 block text-[11px] text-faint">Title</span>
                  <input
                    value={drafts.title}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, title: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAdd();
                    }}
                    placeholder="e.g. Aesop shop window"
                    aria-label="Reference title"
                    className="h-9 w-full rounded-lg border border-line bg-surface px-2.5 text-[12.5px] text-ink placeholder:text-faint focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] text-faint">Note</span>
                  <textarea
                    value={drafts.note}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, note: e.target.value }))
                    }
                    rows={3}
                    placeholder="What is it that you want to remember?"
                    aria-label="Reference note"
                    className="w-full resize-none rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-ink placeholder:text-faint focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 flex items-center justify-between text-[11px] text-faint">
                    <span>Accent</span>
                    <span
                      aria-hidden="true"
                      className="grid size-4 rounded-full"
                      style={{ background: `hsl(${drafts.hue} 55% 55%)` }}
                    />
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={359}
                    step={1}
                    value={drafts.hue}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, hue: Number(e.target.value) }))
                    }
                    aria-label="Accent hue"
                    className="w-full accent-[var(--color-accent)]"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!drafts.title.trim()}
                  className="flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-accent-ink transition-opacity hover:opacity-90 active:opacity-75 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  <Plus weight="bold" className="size-3" />
                  Add reference
                </button>
              </aside>

              {/* Board */}
              <div className="min-h-[280px]">
                {moodboard.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line-soft bg-bg/40 px-6 py-14 text-center">
                    <span className="grid size-11 place-items-center rounded-xl border border-line-soft bg-surface text-faint">
                      <Sparkle className="size-5" weight="fill" />
                    </span>
                    <div className="space-y-1">
                      <p className="text-[13px] font-medium text-ink">
                        Nothing pinned yet
                      </p>
                      <p className="max-w-[240px] text-[12px] leading-relaxed text-muted">
                        Save a manual reference on the left, or pin a concept
                        from the canvas below to build a board.
                      </p>
                    </div>
                  </div>
                ) : (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {moodboard.map((item, i) => (
                      <li
                        key={item.id}
                        draggable
                        onDragStart={() => {
                          dragFrom.current = i;
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setHoverIndex(i);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const from = dragFrom.current;
                          if (from !== null && from !== i) reorderMoodboard(from, i);
                          dragFrom.current = null;
                          setHoverIndex(null);
                        }}
                        onDragEnd={() => {
                          dragFrom.current = null;
                          setHoverIndex(null);
                        }}
                        className={`group relative flex flex-col overflow-hidden rounded-xl border transition-colors ${
                          hoverIndex === i && dragFrom.current !== null && dragFrom.current !== i
                            ? "border-accent/60 bg-accent/[0.06]"
                            : "border-line-soft bg-bg"
                        }`}
                      >
                        {/* Swatch */}
                        <div
                          className="relative aspect-[4/5] w-full"
                          style={{
                            background:
                              item.kind === "concept"
                                ? conceptGradient(item.seed)
                                : `radial-gradient(120% 130% at 25% 12%, hsl(${item.hue} 40% 22%) 0%, hsl(${(item.hue + 40) % 360} 32% 10%) 70%)`,
                          }}
                        >
                          {item.kind === "concept" && (
                            <span className="absolute left-2 top-2 rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-ink backdrop-blur-sm">
                              Concept
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeMoodboardReference(item.id)}
                            aria-label="Remove reference"
                            className="absolute right-1.5 top-1.5 grid size-6 cursor-pointer place-items-center rounded-md border border-white/10 bg-black/40 text-ink/70 opacity-0 backdrop-blur-md transition-opacity hover:border-red-500/40 hover:text-red-300 focus-visible:opacity-100 group-hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                          >
                            <Trash className="size-3" />
                          </button>
                          <button
                            type="button"
                            aria-label="Drag to reorder"
                            className="absolute bottom-1.5 right-1.5 grid size-6 cursor-grab place-items-center rounded-md border border-white/10 bg-black/40 text-ink/70 opacity-0 backdrop-blur-md transition-opacity active:cursor-grabbing focus-visible:opacity-100 group-hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          >
                            <DotsSixVertical className="size-3" />
                          </button>
                        </div>
                        {/* Body */}
                        <div className="flex flex-1 flex-col gap-1 px-3 py-2">
                          <p className="line-clamp-1 text-[12.5px] font-medium text-ink">
                            {item.kind === "manual" ? item.title : truncate(item.prompt, 40)}
                          </p>
                          {editingNoteId === item.id ? (
                            <textarea
                              autoFocus
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              onBlur={commitNoteEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") setEditingNoteId(null);
                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                                  commitNoteEdit();
                              }}
                              rows={2}
                              placeholder="Add a note"
                              aria-label="Note"
                              className="w-full resize-none rounded-md border border-line bg-surface px-1.5 py-1 text-[11px] italic leading-snug text-ink placeholder:text-faint focus:border-accent/40 focus:outline-none"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => startNoteEdit(item)}
                              className="flex cursor-pointer items-start gap-1 rounded text-left text-[11px] italic leading-snug text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                            >
                              {item.note ? (
                                <span className="line-clamp-2 flex-1">{item.note}</span>
                              ) : (
                                <span className="flex items-center gap-1 text-faint">
                                  <PencilSimple className="size-2.5" />
                                  Add a note
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="border-t border-line-soft px-6 py-3">
              <p className="text-[11px] text-faint">
                Drag tiles to reorder. Click a note to edit. Pin concepts from
                the canvas action rail.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
