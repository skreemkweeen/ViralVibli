"use client";

import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  X,
  ArrowRight,
  Sparkle,
  SquaresFour,
  CopySimple,
} from "@phosphor-icons/react";
import { useVision } from "@/lib/vision/vision-store";
import { buildCampaign, type CampaignShot } from "@/lib/vision/campaign";
import { assemblePrompt } from "@/lib/vision/prompt";

/**
 * Campaign Planner — derives a 6-shot campaign from the current builder
 * direction and lets the creator load any variant back into the builder for
 * a real generation pass. Read-only preview; no state mutation until the
 * user explicitly picks a shot.
 */
export function CampaignPlanner({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { direction, setDirection } = useVision();
  const reduce = useReducedMotion();

  const shots = useMemo<CampaignShot[]>(
    () => buildCampaign(direction),
    [direction],
  );

  function directShot(shot: CampaignShot) {
    setDirection(shot.direction);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="campaign-title"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[8vh]"
        >
          <button
            type="button"
            aria-label="Close campaign planner"
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.85)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line-soft px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-accent/10 text-accent-fg">
                  <SquaresFour className="size-4" weight="fill" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                    Campaign planner
                  </p>
                  <h2
                    id="campaign-title"
                    className="text-[15px] font-medium text-ink"
                  >
                    Six shots derived from your current direction
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

            {/* Grid */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {shots.map((shot, i) => (
                  <ShotCard
                    key={shot.kind}
                    shot={shot}
                    index={i}
                    onDirect={() => directShot(shot)}
                    reduce={reduce}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-line-soft px-6 py-3">
              <p className="text-[11.5px] text-faint">
                Picking a shot loads its direction into the builder — you can
                tweak, then hit Generate.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ShotCard({
  shot,
  index,
  onDirect,
  reduce,
}: {
  shot: CampaignShot;
  index: number;
  onDirect: () => void;
  reduce: boolean | null;
}) {
  const prompt = useMemo(() => assemblePrompt(shot.direction), [shot.direction]);
  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-bg"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md border border-line-soft bg-surface font-mono text-[10.5px] tabular-nums text-faint">
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="text-[13.5px] font-semibold text-ink">{shot.label}</p>
        </div>
        <button
          type="button"
          onClick={onDirect}
          aria-label={`Load ${shot.label} direction into the builder`}
          className="flex cursor-pointer items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11.5px] font-medium text-muted transition-colors hover:border-accent/50 hover:text-accent-fg active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <Sparkle weight="fill" className="size-3" />
          Direct
        </button>
      </div>
      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 px-4 py-3">
        <p className="text-[11.5px] italic leading-relaxed text-faint">
          {shot.hint}
        </p>
        <p className="line-clamp-4 text-[12px] leading-relaxed text-muted">
          {prompt}
        </p>
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between border-t border-line-soft bg-surface/50 px-4 py-2 text-[10.5px] text-faint">
        <CopyPromptButton prompt={prompt} />
        <span className="flex items-center gap-1">
          <span>Open in builder</span>
          <ArrowRight className="size-3" weight="bold" />
        </span>
      </div>
    </motion.article>
  );
}

function CopyPromptButton({ prompt }: { prompt: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(prompt);
        } catch {
          // clipboard unavailable
        }
      }}
      aria-label="Copy prompt"
      className="flex cursor-pointer items-center gap-1 rounded transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
    >
      <CopySimple className="size-3" />
      Copy prompt
    </button>
  );
}
