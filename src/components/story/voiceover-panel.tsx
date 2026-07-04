"use client";

/**
 * Voiceover planner — per-slide script + timing.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Microphone, X } from "@phosphor-icons/react";
import { useStory } from "@/lib/story/store";
import { fitsInDuration, planVoiceover, requiredWpm } from "@/lib/story/voiceover";

export function VoiceoverPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { workingSlides, updateSlide } = useStory();
  const reduce = useReducedMotion();
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [wpm, setWpm] = useState(140);

  useEffect(() => {
    if (!open) return;
    setSelectedSlideId((prev) => prev ?? workingSlides[0]?.id ?? null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, workingSlides]);

  const slide = selectedSlideId ? workingSlides.find((s) => s.id === selectedSlideId) : null;
  const plan = useMemo(
    () => (slide ? planVoiceover(slide.voiceover ?? "", { wpm, targetSeconds: slide.duration }) : null),
    [slide, wpm],
  );

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
            aria-label="Close voiceover"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Voiceover planner"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-[85vh] w-full max-w-[1020px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <div className="mb-1 inline-flex items-center gap-2">
                  <Microphone className="size-4 text-accent-fg" weight="fill" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">Voice</p>
                </div>
                <h2 className="text-[18px] font-semibold text-ink">Voiceover Planner</h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  Script + timing + captions per slide at your target WPM.
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

            <div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)]">
              <aside className="min-h-0 overflow-y-auto border-r border-line p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-faint">Slides</p>
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
                          <p className="truncate text-ink">
                            #{s.index + 1} · {s.title || "Untitled"}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-faint">
                            {s.duration}s target
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>

              <section className="min-h-0 overflow-y-auto p-4">
                {!slide ? (
                  <p className="text-[12px] text-muted">Pick a slide.</p>
                ) : (
                  <>
                    <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_140px]">
                      <label className="grid gap-1 text-[11px]">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-faint">Script</span>
                        <textarea
                          value={slide.voiceover ?? ""}
                          onChange={(e) => updateSlide(slide.id, { voiceover: e.target.value })}
                          rows={5}
                          placeholder={"Write the voiceover script for this slide.\nUse ALL-CAPS for emphasis. Full stops trigger natural breaks."}
                          className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-[12.5px] leading-relaxed text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="grid gap-1 text-[11px]">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-faint">WPM</span>
                        <input
                          type="number"
                          value={wpm}
                          onChange={(e) => setWpm(Number(e.target.value) || 140)}
                          min={80}
                          max={220}
                          className="h-9 rounded-md border border-line bg-bg px-2 text-[13px] tabular-nums text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                    </div>

                    {plan && (
                      <>
                        <div className="mb-3 grid grid-cols-4 gap-2 text-[11px]">
                          <Stat label="Words" value={plan.totalWords} />
                          <Stat label="Sec" value={`${plan.totalSeconds.toFixed(1)}s`} />
                          <Stat
                            label="Fits"
                            value={fitsInDuration(plan, slide.duration) ? "yes" : "no"}
                            tone={fitsInDuration(plan, slide.duration) ? "ok" : "warn"}
                          />
                          <Stat
                            label="Req WPM"
                            value={requiredWpm(slide.voiceover ?? "", slide.duration)}
                          />
                        </div>

                        <div className="mb-3 rounded-xl border border-line bg-bg p-3">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">Captions</p>
                          {plan.captions.length === 0 ? (
                            <p className="text-[12px] text-muted">Write a script above to see captions.</p>
                          ) : (
                            <ul className="grid gap-0.5 text-[11.5px]">
                              {plan.captions.map((c, i) => (
                                <li key={i} className="flex items-baseline gap-2">
                                  <span className="w-14 text-[10.5px] tabular-nums text-faint">
                                    {c.startAt.toFixed(1)}s
                                  </span>
                                  <span className="text-ink">{c.text}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {plan.breaths.length > 0 && (
                          <p className="text-[11.5px] text-muted">
                            Suggested breaths after word{" "}
                            {plan.breaths.map((i) => `#${i + 1}`).join(", ")}.
                          </p>
                        )}
                      </>
                    )}
                  </>
                )}
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "ok" | "warn";
}) {
  return (
    <div
      className={`rounded-lg border px-2 py-1 ${
        tone === "warn"
          ? "border-amber-400/40 bg-amber-500/[0.06]"
          : tone === "ok"
            ? "border-emerald-400/40 bg-emerald-500/[0.06]"
            : "border-line bg-bg"
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest text-faint">{label}</p>
      <p className="text-[13px] font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}
