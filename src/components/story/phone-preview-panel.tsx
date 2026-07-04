"use client";

/**
 * Phone Preview panel — realistic device chrome for each of the 6
 * supported platforms with per-slide progress bars, safe zones, and
 * tap-forward/back controls.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CaretLeft, CaretRight, DeviceMobileCamera, X } from "@phosphor-icons/react";
import { useStory } from "@/lib/story/store";
import { STORY_PLATFORMS, platformSpec, type StoryPlatformId } from "@/lib/story/story-platforms";

export function PhonePreviewPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { workingSlides, targetPlatform, setTargetPlatform } = useStory();
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, workingSlides.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, workingSlides.length]);

  useEffect(() => {
    if (index >= workingSlides.length && workingSlides.length > 0) setIndex(0);
  }, [workingSlides.length, index]);

  const platform = platformSpec(targetPlatform);
  const active = workingSlides[index];

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
            aria-label="Close phone preview"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Phone preview"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-[85vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <div className="mb-1 inline-flex items-center gap-2">
                  <DeviceMobileCamera className="size-4 text-accent-fg" weight="fill" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">Live</p>
                </div>
                <h2 className="text-[18px] font-semibold text-ink">Phone Preview</h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  {platform.label} · slide {workingSlides.length ? index + 1 : 0} of {workingSlides.length}
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
              {/* Platform picker */}
              <aside className="border-r border-line p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-faint">
                  Platform
                </p>
                <ul className="grid gap-1">
                  {STORY_PLATFORMS.map((p) => {
                    const activePlat = p.id === targetPlatform;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => setTargetPlatform(p.id)}
                          aria-pressed={activePlat}
                          className={`w-full cursor-pointer rounded-lg border px-2 py-1.5 text-left text-[12px] transition-colors ${
                            activePlat
                              ? "border-accent/60 bg-accent/[0.06] text-ink"
                              : "border-transparent text-muted hover:border-line hover:text-ink"
                          }`}
                        >
                          <p className="font-medium text-ink">{p.label}</p>
                          <p className="mt-0.5 text-[11px] text-faint">{p.aspect} · ≤{p.maxSlideSeconds}s</p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>

              {/* Preview */}
              <section className="flex flex-col items-center justify-center gap-4 p-6">
                {workingSlides.length === 0 ? (
                  <div className="text-[13px] text-muted">
                    Add a slide to preview the story.
                  </div>
                ) : (
                  <>
                    <PhoneFrame platformId={targetPlatform}>
                      <ProgressBar count={workingSlides.length} activeIndex={index} platform={targetPlatform} />
                      <SafeZone
                        topPct={platform.safeZoneTopPct}
                        bottomPct={platform.safeZoneBottomPct}
                        handleLabel={platform.handleLabel}
                      >
                        <SlideBody
                          title={active?.title ?? ""}
                          body={active?.body ?? ""}
                          cta={active?.cta?.label}
                        />
                      </SafeZone>
                    </PhoneFrame>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIndex((i) => Math.max(i - 1, 0))}
                        aria-label="Previous slide"
                        disabled={index === 0}
                        className="cursor-pointer rounded-full border border-line p-1.5 text-muted hover:border-faint hover:text-ink disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        <CaretLeft className="size-3" weight="bold" />
                      </button>
                      <span className="text-[12px] tabular-nums text-muted">
                        {index + 1} / {workingSlides.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIndex((i) => Math.min(i + 1, workingSlides.length - 1))}
                        aria-label="Next slide"
                        disabled={index === workingSlides.length - 1}
                        className="cursor-pointer rounded-full border border-line p-1.5 text-muted hover:border-faint hover:text-ink disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        <CaretRight className="size-3" weight="bold" />
                      </button>
                    </div>
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

// ─── Phone chrome ────────────────────────────────────────────────────────

function PhoneFrame({
  platformId,
  children,
}: {
  platformId: StoryPlatformId;
  children: React.ReactNode;
}) {
  const aspect = platformSpec(platformId).aspect;
  const [w, h] = useMemo(() => {
    const [a, b] = aspect.split("-").map(Number);
    return [a!, b!];
  }, [aspect]);
  // Cap portrait height, otherwise fill to a reasonable width.
  const isPortrait = w < h;
  const width = isPortrait ? 260 : 340;
  const height = Math.round((width * h) / w);
  return (
    <div
      className="relative rounded-[36px] border-[10px] border-black bg-black shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]"
      style={{ width, height }}
    >
      {isPortrait && (
        <div className="absolute left-1/2 top-1 z-20 h-4 w-16 -translate-x-1/2 rounded-full bg-black" />
      )}
      <div className="relative h-full w-full overflow-hidden rounded-[26px] bg-neutral-900 text-white">
        {children}
      </div>
    </div>
  );
}

function ProgressBar({
  count,
  activeIndex,
  platform,
}: {
  count: number;
  activeIndex: number;
  platform: StoryPlatformId;
}) {
  const showBars = platform === "instagram" || platform === "facebook" || platform === "tiktok" || platform === "pinterest";
  if (!showBars) return null;
  return (
    <div className="absolute inset-x-2 top-2 z-10 flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={`h-0.5 flex-1 rounded-full ${i < activeIndex ? "bg-white/80" : i === activeIndex ? "bg-white" : "bg-white/25"}`}
        />
      ))}
    </div>
  );
}

function SafeZone({
  topPct,
  bottomPct,
  handleLabel,
  children,
}: {
  topPct: number;
  bottomPct: number;
  handleLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 flex flex-col text-white">
      <div style={{ height: `${topPct}%` }} className="flex items-end px-3 pb-1">
        <div className="flex items-center gap-1 text-[10px] text-white/80">
          <span className="size-4 rounded-full bg-white/40" />
          <span>{handleLabel}</span>
        </div>
      </div>
      <div className="min-h-0 flex-1 px-4">{children}</div>
      <div style={{ height: `${bottomPct}%` }} />
    </div>
  );
}

function SlideBody({ title, body, cta }: { title: string; body: string; cta?: string }) {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {title && <p className="text-[15px] font-semibold leading-snug drop-shadow">{title}</p>}
      {body && <p className="text-[12.5px] leading-snug text-white/90">{body}</p>}
      {cta && (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-black">
          {cta} →
        </span>
      )}
    </div>
  );
}
