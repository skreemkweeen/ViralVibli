"use client";

/**
 * Slide Inspector — full-screen sheet that exposes every editable field
 * on a RichSlide, plus quick shortcuts to snapshot / restore / delete.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ClockClockwise,
  NotePencil,
  Trash,
  X,
} from "@phosphor-icons/react";
import { useStory } from "@/lib/story/store";
import {
  SLIDE_ANIMATIONS,
  SLIDE_APPROVALS,
  SLIDE_COLORS,
  SLIDE_EMOTIONS,
  SLIDE_GOALS,
  SLIDE_STATUSES,
  SLIDE_TRANSITIONS,
  type SlideAnimation,
  type SlideApproval,
  type SlideColor,
  type SlideEmotion,
  type SlideGoal,
  type SlideStatus,
  type SlideTransition,
} from "@/lib/story/story-slides";

export function SlideInspectorPanel({
  slideId,
  onClose,
}: {
  slideId: string | null;
  onClose: () => void;
}) {
  const {
    workingSlides,
    updateSlide,
    removeSlideById,
    snapshotSlide,
    restoreSlideVersionById,
    addCommentToSlide,
    removeCommentFromSlide,
  } = useStory();
  const reduce = useReducedMotion();
  const [commentDraft, setCommentDraft] = useState("");
  const [snapshotLabel, setSnapshotLabel] = useState("");

  useEffect(() => {
    if (!slideId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slideId, onClose]);

  const slide = slideId ? workingSlides.find((s) => s.id === slideId) : null;

  return (
    <AnimatePresence>
      {slide && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto px-4 py-[6vh]"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            aria-label="Close slide inspector"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Slide ${slide.index + 1} inspector`}
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-[85vh] w-full max-w-[960px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                  Slide {slide.index + 1}
                </p>
                <h2 className="text-[18px] font-semibold text-ink">
                  {slide.title || "Untitled slide"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="cursor-pointer rounded-full p-1.5 text-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <X className="size-4" weight="bold" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Content */}
                <section className="grid gap-3">
                  <Field label="Title">
                    <input
                      value={slide.title}
                      onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                      className="h-9 w-full rounded-md border border-line bg-bg px-2 text-[13px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </Field>
                  <Field label="Body">
                    <textarea
                      value={slide.body}
                      onChange={(e) => updateSlide(slide.id, { body: e.target.value })}
                      rows={4}
                      className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-[13px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </Field>
                  <Field label="Visual direction">
                    <input
                      value={slide.visual ?? ""}
                      onChange={(e) => updateSlide(slide.id, { visual: e.target.value })}
                      placeholder="e.g. handheld overhead of ceramic mug"
                      className="h-9 w-full rounded-md border border-line bg-bg px-2 text-[13px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </Field>
                  <Field label="Voiceover script">
                    <textarea
                      value={slide.voiceover ?? ""}
                      onChange={(e) => updateSlide(slide.id, { voiceover: e.target.value })}
                      rows={3}
                      className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-[13px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </Field>
                  <Field label="Music direction">
                    <input
                      value={slide.music ?? ""}
                      onChange={(e) => updateSlide(slide.id, { music: e.target.value })}
                      placeholder="e.g. lo-fi piano at 90 bpm"
                      className="h-9 w-full rounded-md border border-line bg-bg px-2 text-[13px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="CTA label">
                      <input
                        value={slide.cta?.label ?? ""}
                        onChange={(e) =>
                          updateSlide(slide.id, {
                            cta: e.target.value ? { ...slide.cta, label: e.target.value } : undefined,
                          })
                        }
                        placeholder="Shop now"
                        className="h-9 w-full rounded-md border border-line bg-bg px-2 text-[13px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </Field>
                    <Field label="CTA URL">
                      <input
                        value={slide.cta?.url ?? ""}
                        onChange={(e) =>
                          updateSlide(slide.id, {
                            cta: slide.cta ? { ...slide.cta, url: e.target.value } : { label: "", url: e.target.value },
                          })
                        }
                        placeholder="https://…"
                        className="h-9 w-full rounded-md border border-line bg-bg px-2 text-[13px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </Field>
                  </div>
                  <Field label="Notes">
                    <textarea
                      value={slide.notes ?? ""}
                      onChange={(e) => updateSlide(slide.id, { notes: e.target.value })}
                      rows={2}
                      placeholder="Internal notes for the team"
                      className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-[13px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </Field>
                </section>

                {/* Metadata */}
                <section className="grid gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <SelectField
                      label="Status"
                      value={slide.status}
                      options={SLIDE_STATUSES}
                      onChange={(v) => updateSlide(slide.id, { status: v as SlideStatus })}
                    />
                    <SelectField
                      label="Approval"
                      value={slide.approval}
                      options={SLIDE_APPROVALS}
                      onChange={(v) => updateSlide(slide.id, { approval: v as SlideApproval })}
                    />
                    <SelectField
                      label="Goal"
                      value={slide.goal}
                      options={SLIDE_GOALS}
                      onChange={(v) => updateSlide(slide.id, { goal: v as SlideGoal })}
                    />
                    <SelectField
                      label="Emotion"
                      value={slide.emotion}
                      options={SLIDE_EMOTIONS}
                      onChange={(v) => updateSlide(slide.id, { emotion: v as SlideEmotion })}
                    />
                    <SelectField
                      label="Transition"
                      value={slide.transition}
                      options={SLIDE_TRANSITIONS}
                      onChange={(v) => updateSlide(slide.id, { transition: v as SlideTransition })}
                    />
                    <SelectField
                      label="Animation"
                      value={slide.animation}
                      options={SLIDE_ANIMATIONS}
                      onChange={(v) => updateSlide(slide.id, { animation: v as SlideAnimation })}
                    />
                    <SelectField
                      label="Color label"
                      value={slide.color}
                      options={SLIDE_COLORS}
                      onChange={(v) => updateSlide(slide.id, { color: v as SlideColor })}
                    />
                    <Field label="Duration (s)">
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={slide.duration}
                        onChange={(e) => updateSlide(slide.id, { duration: Number(e.target.value) || 0 })}
                        className="h-9 w-full rounded-md border border-line bg-bg px-2 text-[13px] tabular-nums text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </Field>
                  </div>

                  {/* Version history */}
                  <section>
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                        Version history
                      </p>
                      <div className="flex items-center gap-1">
                        <input
                          value={snapshotLabel}
                          onChange={(e) => setSnapshotLabel(e.target.value)}
                          placeholder="Label"
                          className="h-7 w-24 rounded-md border border-line bg-surface px-2 text-[11.5px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            snapshotSlide(slide.id, snapshotLabel.trim() || undefined);
                            setSnapshotLabel("");
                          }}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        >
                          <NotePencil className="size-3" weight="bold" />
                          Snapshot
                        </button>
                      </div>
                    </div>
                    {slide.history.length === 0 ? (
                      <p className="text-[11.5px] text-faint">No history yet — snapshot to save the current state.</p>
                    ) : (
                      <ul className="grid gap-1">
                        {slide.history.map((v, i) => (
                          <li key={v.id} className="flex items-center gap-2 rounded-lg border border-line bg-bg px-2 py-1 text-[11.5px]">
                            <ClockClockwise className="size-3 text-faint" />
                            <span className="text-ink">v{slide.history.length - i}</span>
                            {v.label && <span className="text-faint">· {v.label}</span>}
                            <button
                              type="button"
                              onClick={() => restoreSlideVersionById(slide.id, v.id)}
                              className="ml-auto rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                            >
                              Restore
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  {/* Comments */}
                  <section>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">Comments</p>
                    <div className="mb-2 flex items-center gap-1">
                      <input
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        placeholder="Add a note…"
                        className="h-8 flex-1 rounded-md border border-line bg-bg px-2 text-[12px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!commentDraft.trim()) return;
                          addCommentToSlide(slide.id, commentDraft);
                          setCommentDraft("");
                        }}
                        className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        Add
                      </button>
                    </div>
                    {slide.comments.length > 0 && (
                      <ul className="grid gap-1">
                        {slide.comments.map((c) => (
                          <li key={c.id} className="flex items-center gap-2 rounded-lg border border-line bg-bg px-2 py-1 text-[11.5px]">
                            <span className="truncate text-ink">{c.body}</span>
                            <button
                              type="button"
                              onClick={() => removeCommentFromSlide(slide.id, c.id)}
                              className="ml-auto rounded-md p-0.5 text-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                              aria-label="Remove comment"
                            >
                              <Trash className="size-3" weight="bold" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </section>
              </div>
            </div>

            <footer className="flex items-center gap-2 border-t border-line px-6 py-3">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Remove this slide?")) {
                    removeSlideById(slide.id);
                    onClose();
                  }
                }}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[12px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <Trash className="size-3" weight="bold" />
                Remove slide
              </button>
              <button
                type="button"
                onClick={onClose}
                className="ml-auto cursor-pointer rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 text-[12px] font-medium text-ink hover:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                Done
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-faint">{label}</span>
      {children}
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-faint">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-9 rounded-md border border-line bg-bg px-2 text-[13px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
