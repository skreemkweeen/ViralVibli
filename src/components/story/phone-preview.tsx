"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  X,
  CaretLeft,
  CaretRight,
  Sparkle,
  Speedometer,
} from "@phosphor-icons/react";
import type { StorySlide } from "@/lib/ai/types";
import type { StoryConcept } from "@/lib/story/types";

/**
 * Full-viewport phone-frame previewer. Renders one slide at a time in a 9:16
 * viewport that mimics an Instagram / TikTok Story surface. Navigation is
 * keyboard-driven (← / →, Escape) and touch/click-driven (tap zones).
 *
 * No state is added to the store; the previewer receives the concept and
 * owns its own current-slide index. Closes without side effects.
 */
export function StoryPhonePreview({
  concept,
  open,
  onClose,
}: {
  concept: StoryConcept | null;
  open: boolean;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const reduce = useReducedMotion();

  const slides = concept?.slides ?? [];
  const total = slides.length;

  useEffect(() => {
    if (open) setIdx(0);
  }, [open, concept?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, total - 1));
      else if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, total, onClose]);

  const next = useCallback(
    () => setIdx((i) => Math.min(i + 1, total - 1)),
    [total],
  );
  const prev = useCallback(() => setIdx((i) => Math.max(i - 1, 0)), []);

  if (!concept) return null;

  const slide: StorySlide | undefined = slides[idx];

  return (
    <AnimatePresence>
      {open && slide && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Story preview"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[85] flex items-center justify-center bg-black/85 backdrop-blur-lg"
        >
          {/* Scrim close */}
          <button
            type="button"
            aria-label="Close preview"
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Header — brand + slide counter + close */}
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-5">
            <span className="text-[13px] font-medium text-ink/80">
              Preview · {idx + 1} of {total}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="grid size-10 cursor-pointer place-items-center rounded-full border border-white/10 bg-black/40 text-ink/80 backdrop-blur-md transition-colors hover:border-white/30 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Phone frame */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-[9/16] h-[calc(100dvh-8rem)] max-h-[820px] overflow-hidden rounded-[36px] border-[6px] border-black bg-neutral-900 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
          >
            {/* Progress bar row */}
            <div className="absolute inset-x-2.5 top-2.5 z-20 flex items-center gap-1">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/20"
                >
                  <span
                    className={`block h-full transition-all duration-500 ${
                      i < idx
                        ? "w-full bg-white/70"
                        : i === idx
                          ? "w-full bg-white/90"
                          : "w-0 bg-white/60"
                    }`}
                  />
                </span>
              ))}
            </div>

            {/* Slide content — full-bleed */}
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={reduce ? false : { opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex flex-col justify-between p-6 pt-10"
                style={{
                  background: gradientForSlide(idx, total),
                }}
              >
                {/* Big copy area */}
                <div className="flex flex-1 flex-col justify-center gap-4 text-center">
                  <p className="text-balance text-[clamp(1.4rem,3.4vw,2rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-white">
                    {slide.copy}
                  </p>
                  {slide.stickerRecommendation && (
                    <span className="mx-auto inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11.5px] text-white/85 backdrop-blur-sm">
                      <Sparkle weight="fill" className="size-3 text-white" />
                      {slide.stickerRecommendation}
                    </span>
                  )}
                </div>

                {/* Bottom rail — CTA + visual suggestion */}
                <div className="space-y-2">
                  {slide.cta && (
                    <div className="mx-auto flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-neutral-950 shadow-lg">
                      {slide.cta}
                    </div>
                  )}
                  <p className="rounded-lg bg-black/50 px-3 py-2 text-center text-[10.5px] leading-relaxed text-white/60 backdrop-blur-md">
                    <span className="mr-1 font-semibold uppercase tracking-widest">
                      Visual:
                    </span>
                    {slide.visualSuggestion}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Tap zones — left half back, right half forward */}
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="absolute inset-y-0 left-0 z-10 w-1/3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            />
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="absolute inset-y-0 right-0 z-10 w-2/3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            />
          </motion.div>

          {/* Side arrows — visible affordance because tap zones are invisible */}
          <div className="absolute inset-x-0 bottom-6 z-10 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={prev}
              disabled={idx === 0}
              aria-label="Previous slide"
              className="grid size-11 cursor-pointer place-items-center rounded-full border border-white/10 bg-black/40 text-white/80 backdrop-blur-md transition-colors hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <CaretLeft className="size-5" weight="bold" />
            </button>
            <span className="rounded-full border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] tabular-nums text-white/70 backdrop-blur-md">
              {idx + 1} / {total}
            </span>
            <button
              type="button"
              onClick={next}
              disabled={idx === total - 1}
              aria-label="Next slide"
              className="grid size-11 cursor-pointer place-items-center rounded-full border border-white/10 bg-black/40 text-white/80 backdrop-blur-md transition-colors hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <CaretRight className="size-5" weight="bold" />
            </button>
          </div>

          {/* Speaker notes — floating panel opposite the phone at wide viewports */}
          {slide.speakerNotes && (
            <aside className="pointer-events-none absolute left-6 top-1/2 hidden max-w-[280px] -translate-y-1/2 rounded-2xl border border-white/10 bg-black/40 p-4 text-left backdrop-blur-md lg:block">
              <div className="mb-2 flex items-center gap-1.5 text-white/60">
                <Speedometer className="size-3" weight="bold" />
                <span className="text-[10px] font-semibold uppercase tracking-widest">
                  Speaker notes
                </span>
              </div>
              <p className="text-[12px] leading-relaxed text-white/85">
                {slide.speakerNotes}
              </p>
            </aside>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Deterministic gradient per slide index so consecutive slides feel visually
 * connected but distinct. Kept dark and desaturated to match the platform's
 * editorial palette; never rainbow.
 */
function gradientForSlide(i: number, total: number): string {
  // Hue drifts across the sequence within a tight window (blues → teals → warm)
  const hue = ((i / Math.max(total - 1, 1)) * 60 + 190) % 360;
  const hue2 = (hue + 30) % 360;
  return `radial-gradient(120% 130% at 25% 12%, hsl(${hue} 30% 22%) 0%, hsl(${hue2} 22% 10%) 70%)`;
}
