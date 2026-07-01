"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  MagnifyingGlass,
  Sparkle,
  Handshake,
  Heart,
  ClockCountdown,
  ChartLineUp,
  ShoppingCart,
} from "@phosphor-icons/react";
import type { StoryConcept } from "@/lib/story/types";
import {
  computeInsights,
  INSIGHT_METRICS,
  INSIGHT_LABELS,
  type InsightMetric,
} from "@/lib/story/insights";

const ICONS: Record<InsightMetric, React.ComponentType<{ className?: string; weight?: "regular" | "bold" | "fill" }>> = {
  curiosity: MagnifyingGlass,
  authority: Sparkle,
  trust: Handshake,
  emotion: Heart,
  urgency: ClockCountdown,
  retention: ChartLineUp,
  sales: ShoppingCart,
};

/**
 * Compact 7-metric insights strip rendered under a StoryConcept header.
 * Deterministic — reads the concept's slides through the pure computeInsights
 * heuristic. No AI round-trip, no server call, no store mutation.
 */
export function StoryInsightsBar({ concept }: { concept: StoryConcept }) {
  const insights = useMemo(() => computeInsights(concept), [concept]);
  const reduce = useReducedMotion();

  return (
    <div className="border-t border-line-soft px-4 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
          Psychology insights
        </p>
        <p className="text-[10px] text-faint">Derived from slide copy</p>
      </div>
      <div
        role="group"
        aria-label="Psychology insights"
        className="grid grid-cols-4 gap-1.5 sm:grid-cols-7"
      >
        {INSIGHT_METRICS.map((m) => {
          const Icon = ICONS[m];
          const value = insights[m];
          const tone = toneFor(value);
          return (
            <div
              key={m}
              className={`flex flex-col items-start gap-1 rounded-lg border px-2 py-1.5 transition-colors ${tone.container}`}
              title={`${INSIGHT_LABELS[m]}: ${value}/100`}
            >
              <div className="flex w-full items-center justify-between">
                <Icon
                  className={`size-3 ${tone.icon}`}
                  weight={value >= 70 ? "fill" : "regular"}
                />
                <span className={`font-mono text-[10.5px] tabular-nums ${tone.number}`}>
                  {value}
                </span>
              </div>
              <span className="w-full text-[9.5px] uppercase tracking-widest text-faint">
                {INSIGHT_LABELS[m]}
              </span>
              {/* Track */}
              <div className="mt-0.5 h-[3px] w-full overflow-hidden rounded-full bg-surface-2">
                <motion.span
                  className={`block h-full ${tone.bar}`}
                  initial={reduce ? { width: `${value}%` } : { width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function toneFor(value: number): {
  container: string;
  icon: string;
  number: string;
  bar: string;
} {
  if (value >= 70) {
    return {
      container: "border-accent/40 bg-accent/[0.06]",
      icon: "text-accent-fg",
      number: "text-accent-fg",
      bar: "bg-accent",
    };
  }
  if (value >= 35) {
    return {
      container: "border-line bg-bg",
      icon: "text-muted",
      number: "text-ink",
      bar: "bg-muted/60",
    };
  }
  return {
    container: "border-line/60 bg-bg/50",
    icon: "text-faint",
    number: "text-faint",
    bar: "bg-faint/40",
  };
}
