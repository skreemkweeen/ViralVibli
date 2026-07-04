"use client";

/**
 * Story Intelligence panel — three tabs over the current deck:
 *   Inspector  — 15 diagnostic dimensions
 *   Analytics  — 10 platform-aware predictions
 *   Director   — 17 rewrite actions for the selected slide
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Brain,
  ChartLineUp,
  Target,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import { useStory } from "@/lib/story/store";
import { DIRECTOR_ACTIONS, type DirectorActionId } from "@/lib/story/story-director";

type Tab = "inspector" | "analytics" | "director";

export function StoryIntelligencePanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    inspection,
    predictions,
    workingSlides,
    applyDirectorToSlide,
  } = useStory();
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("inspector");
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ReturnType<typeof applyDirectorToSlide> | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedSlideId((prev) => prev ?? workingSlides[0]?.id ?? null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, workingSlides]);

  const selected = selectedSlideId ? workingSlides.find((s) => s.id === selectedSlideId) : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto px-4 py-[6vh]"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            aria-label="Close story intelligence"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Story Intelligence"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-[85vh] w-full max-w-[1120px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <div className="mb-1 inline-flex items-center gap-2">
                  <Brain className="size-4 text-accent-fg" weight="fill" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">Intelligence</p>
                </div>
                <h2 className="text-[18px] font-semibold text-ink">Story Intelligence</h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  Diagnostics, analytics, and the AI Story Director — over the current deck.
                </p>
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

            <div className="flex items-center gap-1 border-b border-line bg-bg/40 px-6 py-2">
              {[
                { id: "inspector" as const, label: "Inspector", icon: Target },
                { id: "analytics" as const, label: "Analytics", icon: ChartLineUp },
                { id: "director" as const, label: "Director", icon: Sparkle },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  aria-pressed={tab === id}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    tab === id
                      ? "border-accent/60 bg-accent/10 text-ink"
                      : "border-transparent text-muted hover:border-line hover:text-ink"
                  }`}
                >
                  <Icon className="size-3.5" weight="bold" />
                  {label}
                </button>
              ))}
            </div>

            {tab === "inspector" && (
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <div className="mb-3 flex items-baseline gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">Overall</p>
                  <p className="text-[24px] font-semibold tabular-nums text-ink">
                    {inspection.overall}
                    <span className="text-[13px] text-faint">/100</span>
                  </p>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {inspection.dimensions.map((d) => (
                    <li key={d.id} className="rounded-xl border border-line bg-bg p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-[13px] font-semibold text-ink">{d.label}</p>
                        <p className="text-[13px] font-semibold tabular-nums text-ink">{d.score}</p>
                      </div>
                      <ScoreBar value={d.score} />
                      <p className="mt-1 text-[11.5px] leading-snug text-muted">{d.reason}</p>
                      <p className="mt-1 text-[11px] leading-snug text-faint">{d.recommendation}</p>
                      {d.fix && (
                        <p className="mt-1 rounded-md border border-accent/30 bg-accent/[0.06] px-2 py-1 text-[11px] text-ink">
                          {d.fix}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === "analytics" && (
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <ul className="grid gap-2 sm:grid-cols-2">
                  {predictions.map((p) => (
                    <li key={p.id} className="rounded-xl border border-line bg-bg p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-[13px] font-semibold text-ink">{p.label}</p>
                        <p className="text-[15px] font-semibold tabular-nums text-ink">
                          {p.value}
                          <span className="text-[11px] text-faint">{p.unit}</span>
                        </p>
                      </div>
                      <p className="mt-1 text-[11.5px] leading-snug text-muted">{p.reason}</p>
                      <p className="mt-1 rounded-md border border-accent/30 bg-accent/[0.06] px-2 py-1 text-[11px] text-ink">
                        {p.suggestedImprovement}{" "}
                        <span className="text-faint">— {p.expectedLift}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === "director" && (
              <div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)]">
                <aside className="min-h-0 overflow-y-auto border-r border-line p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-faint">Target slide</p>
                  {workingSlides.length === 0 ? (
                    <p className="text-[12px] text-faint">Add a slide first.</p>
                  ) : (
                    <ul className="grid gap-1">
                      {workingSlides.map((s) => {
                        const active = s.id === selectedSlideId;
                        return (
                          <li key={s.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedSlideId(s.id)}
                              aria-pressed={active}
                              className={`w-full cursor-pointer rounded-lg border px-2 py-1.5 text-left text-[12px] transition-colors ${
                                active
                                  ? "border-accent/60 bg-accent/[0.06] text-ink"
                                  : "border-transparent text-muted hover:border-line hover:text-ink"
                              }`}
                            >
                              <p className="truncate text-ink">#{s.index + 1} · {s.title || "Untitled"}</p>
                              <p className="mt-0.5 truncate text-[11px] text-faint">{s.body || "—"}</p>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </aside>

                <section className="min-h-0 overflow-y-auto p-4">
                  {selected ? (
                    <>
                      <div className="mb-3 rounded-xl border border-line bg-bg p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">Before</p>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-ink">{selected.body}</p>
                      </div>

                      <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                        {DIRECTOR_ACTIONS.map((a) => (
                          <li key={a.id}>
                            <button
                              type="button"
                              onClick={() => {
                                const r = applyDirectorToSlide(selected.id, a.id as DirectorActionId);
                                if (r) setLastResult(r);
                              }}
                              className="w-full cursor-pointer rounded-lg border border-line bg-bg px-3 py-2 text-left transition-colors hover:border-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                            >
                              <p className="text-[12.5px] font-medium text-ink">{a.label}</p>
                              <p className="mt-0.5 text-[11px] text-muted">{a.hint}</p>
                            </button>
                          </li>
                        ))}
                      </ul>

                      {lastResult && lastResult.expected.length > 0 && (
                        <div className="mt-3 rounded-xl border border-accent/40 bg-accent/[0.06] p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">Last change</p>
                          <p className="mt-1 text-[12.5px] leading-relaxed text-ink">{lastResult.after}</p>
                          <p className="mt-1 text-[11px] text-muted">
                            {lastResult.why} · confidence {lastResult.confidence}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1 text-[10px] uppercase tracking-widest text-faint">
                            {lastResult.expected.map((imp) => (
                              <span key={imp} className="rounded-full border border-line px-1.5 py-0.5">{imp}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-[12px] text-muted">Pick a slide to run a Director action.</p>
                  )}
                </section>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div
      className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-bg"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${value}%` }} />
    </div>
  );
}
