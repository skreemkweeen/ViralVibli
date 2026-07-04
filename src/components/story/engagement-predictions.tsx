"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChatCircle,
  Eye,
  CheckCircle,
  CursorClick,
  ShareNetwork,
  CaretDown,
  Info,
} from "@phosphor-icons/react";
import type { StoryConcept } from "@/lib/story/types";
import {
  computeInsights,
  predictEngagement,
  PREDICTION_LABELS,
  PREDICTION_METRICS,
  PREDICTION_UNITS,
  type PredictionMetric,
} from "@/lib/story/insights";

const ICONS: Record<PredictionMetric, React.ComponentType<{ className?: string; weight?: "regular" | "bold" | "fill" }>> = {
  replies: ChatCircle,
  retention: Eye,
  completionRate: CheckCircle,
  clicks: CursorClick,
  shares: ShareNetwork,
};

/**
 * Engagement predictions — collapsible strip rendered under the Psychology
 * Insights bar. Every metric is a range { low, expected, high } so the
 * uncertainty stays visible; predictions are entirely deterministic and
 * derive from the concept's insights.
 */
export function StoryEngagementPredictions({ concept }: { concept: StoryConcept }) {
  const reduce = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const predictions = useMemo(() => {
    const insights = computeInsights(concept);
    return predictEngagement(insights);
  }, [concept]);

  return (
    <div className="border-t border-line-soft">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-2/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
      >
        <div className="flex min-w-0 items-center gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
            Engagement forecast
          </p>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
            {PREDICTION_METRICS.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 text-[11px] text-muted"
              >
                <span className="font-mono tabular-nums text-ink">
                  {predictions[m].expected}
                </span>
                <span className="text-faint">{PREDICTION_UNITS[m]}</span>
                <span className="text-faint">{PREDICTION_LABELS[m]}</span>
              </span>
            ))}
          </div>
        </div>
        <CaretDown
          className={`size-3.5 shrink-0 text-faint transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Detail — expanded per-metric cards with the range */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {PREDICTION_METRICS.map((m) => {
                  const Icon = ICONS[m];
                  const range = predictions[m];
                  return (
                    <div
                      key={m}
                      className="rounded-xl border border-line-soft bg-bg px-2.5 py-2"
                    >
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <Icon className="size-3 text-faint" weight="bold" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                          {PREDICTION_LABELS[m]}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono text-[16px] font-medium tabular-nums text-ink">
                          {range.expected}
                        </span>
                        <span className="text-[10.5px] text-faint">
                          {PREDICTION_UNITS[m]}
                        </span>
                      </div>
                      <RangeTrack range={range} unit={PREDICTION_UNITS[m]} />
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-faint">
                <Info className="mt-px size-3 shrink-0" weight="bold" />
                Directional estimates from the same slide signals as the
                Psychology Insights above. Ranges reflect uncertainty —
                treat as guidance, not truth.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RangeTrack({
  range,
  unit,
}: {
  range: { low: number; expected: number; high: number };
  unit: string;
}) {
  const span = Math.max(range.high, 1);
  const lowPct = (range.low / span) * 100;
  const highPct = (range.high / span) * 100;
  const expectedPct = (range.expected / span) * 100;
  return (
    <div className="mt-2">
      <div className="relative h-1 w-full rounded-full bg-surface-2">
        <div
          className="absolute inset-y-0 rounded-full bg-muted/40"
          style={{
            left: `${lowPct}%`,
            right: `${100 - highPct}%`,
          }}
        />
        <div
          className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
          style={{ left: `${expectedPct}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between font-mono text-[9.5px] tabular-nums text-faint">
        <span>{range.low}{unit}</span>
        <span>{range.high}{unit}</span>
      </div>
    </div>
  );
}
