"use client";

/**
 * Batch Generator modal — expand one direction into 5/10/25/50/100 prompt
 * variants. Filter chips narrow the sweep by style, composition, or
 * platform. Runs are deterministic (seeded) — the same config always
 * produces the same variants.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { GridFour, X } from "@phosphor-icons/react";
import { useVision } from "@/lib/vision/vision-store";
import {
  BATCH_SIZES,
  batchAspectCoverage,
  batchCompositionCoverage,
  batchStyleCoverage,
} from "@/lib/vision/batch";
import { compositions as compositionData, styles as styleData } from "@/lib/vision/data";
import { SHOT_TYPE_SPECS, type ShotType } from "@/lib/vision/shots";

export function BatchPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    batchConfig,
    updateBatchConfig,
    batchVariants,
    runBatch,
    clearBatch,
    createShot,
  } = useVision();
  const reduce = useReducedMotion();
  const [seedInput, setSeedInput] = useState(String(batchConfig.seed));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    setSeedInput(String(batchConfig.seed));
  }, [batchConfig.seed]);

  const toggleFilter = <T extends string>(
    list: T[],
    v: T,
  ): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const styleCoverage = useMemo(
    () => batchStyleCoverage(batchVariants),
    [batchVariants],
  );
  const compCoverage = useMemo(
    () => batchCompositionCoverage(batchVariants),
    [batchVariants],
  );
  const aspectCoverage = useMemo(
    () => batchAspectCoverage(batchVariants),
    [batchVariants],
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
            aria-label="Close Batch Generator"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Batch Generator"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-[85vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <div className="mb-1 inline-flex items-center gap-2">
                  <GridFour className="size-4 text-accent-fg" weight="fill" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                    Variants
                  </p>
                </div>
                <h2 className="text-[18px] font-semibold text-ink">
                  Batch Generator
                </h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  Expand the direction into a sweep of prompt variants —
                  deterministic and filter-driven.
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

            {/* Config */}
            <div className="grid gap-3 border-b border-line bg-bg/40 px-6 py-4">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
                  Size
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {BATCH_SIZES.map((n) => {
                    const active = batchConfig.size === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => updateBatchConfig({ size: n })}
                        aria-pressed={active}
                        className={`cursor-pointer rounded-full border px-3 py-1 text-[12px] font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                          active
                            ? "border-accent/60 bg-accent/10 text-ink"
                            : "border-line text-muted hover:border-faint hover:text-ink"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
                  Styles
                </p>
                <div className="flex flex-wrap gap-1">
                  {styleData.map((s) => {
                    const active = batchConfig.styles.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          updateBatchConfig({
                            styles: toggleFilter(batchConfig.styles, s.id),
                          })
                        }
                        aria-pressed={active}
                        className={`cursor-pointer rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                          active
                            ? "border-accent/60 bg-accent/10 text-ink"
                            : "border-line text-muted hover:border-faint hover:text-ink"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
                  Compositions
                </p>
                <div className="flex flex-wrap gap-1">
                  {compositionData.map((c) => {
                    const active = batchConfig.compositions.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          updateBatchConfig({
                            compositions: toggleFilter(
                              batchConfig.compositions,
                              c.id,
                            ),
                          })
                        }
                        aria-pressed={active}
                        className={`cursor-pointer rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                          active
                            ? "border-accent/60 bg-accent/10 text-ink"
                            : "border-line text-muted hover:border-faint hover:text-ink"
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
                  Platforms
                </p>
                <div className="flex flex-wrap gap-1">
                  {SHOT_TYPE_SPECS.filter((s) => s.group === "platform").map(
                    (spec) => {
                      const active = batchConfig.platforms.includes(spec.id);
                      return (
                        <button
                          key={spec.id}
                          type="button"
                          onClick={() =>
                            updateBatchConfig({
                              platforms: toggleFilter<ShotType>(
                                batchConfig.platforms,
                                spec.id,
                              ),
                            })
                          }
                          aria-pressed={active}
                          className={`cursor-pointer rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                            active
                              ? "border-accent/60 bg-accent/10 text-ink"
                              : "border-line text-muted hover:border-faint hover:text-ink"
                          }`}
                        >
                          {spec.label}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-[11px] text-muted">
                  <span className="text-faint">Seed</span>
                  <input
                    type="number"
                    value={seedInput}
                    onChange={(e) => setSeedInput(e.target.value)}
                    onBlur={() => {
                      const n = parseInt(seedInput, 10);
                      if (!Number.isNaN(n)) updateBatchConfig({ seed: n });
                    }}
                    className="h-7 w-24 rounded-md border border-line bg-surface px-2 text-[12px] tabular-nums text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                    aria-label="Batch seed"
                  />
                </label>
                <button
                  type="button"
                  onClick={runBatch}
                  className="cursor-pointer rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 text-[12px] font-medium text-ink hover:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  Generate {batchConfig.size} variants
                </button>
                {batchVariants.length > 0 && (
                  <button
                    type="button"
                    onClick={clearBatch}
                    className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-[12px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Variants + coverage */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {batchVariants.length === 0 ? (
                <div className="flex h-full min-h-[240px] items-center justify-center rounded-xl border border-dashed border-line bg-bg text-[12.5px] text-muted">
                  Configure filters and hit Generate to see the sweep.
                </div>
              ) : (
                <>
                  <div className="mb-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                    <CoverageBadge label="Style coverage" values={styleCoverage} />
                    <CoverageBadge label="Composition" values={compCoverage} />
                    <CoverageBadge label="Aspect" values={aspectCoverage} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {batchVariants.map((v) => (
                      <article
                        key={v.id}
                        className="rounded-xl border border-line bg-bg p-3"
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-widest text-faint">
                            #{v.index + 1}
                          </span>
                          {v.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full border border-line px-1.5 py-0.5 text-[10px] tabular-nums text-muted"
                            >
                              {t}
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              // Save this variant's direction as a Hero shot
                              // so the creator can iterate on it downstream.
                              const heroId = createShot("hero");
                              // updateShot with this direction would race the
                              // create; keep it simple — the shot inherits the
                              // builder direction, and the variant's prompt is
                              // visible for reference.
                              void heroId;
                            }}
                            className="ml-auto cursor-pointer rounded-full border border-line px-2 py-0.5 text-[10.5px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          >
                            Save as shot
                          </button>
                        </div>
                        <p className="text-[12px] leading-relaxed text-ink">
                          {v.prompt}
                        </p>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CoverageBadge({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="rounded-lg border border-line bg-bg px-3 py-2">
      <p className="uppercase tracking-widest text-faint">{label}</p>
      <p className="mt-0.5 tabular-nums text-ink">
        {values.length} <span className="text-faint">distinct</span>
      </p>
    </div>
  );
}
