"use client";

/**
 * Project Health surface — deterministic project intelligence rendered
 * inside the Project Workspace Overview.
 *
 * Data comes from `computeProjectHealth`, which is a pure function of the
 * project + its persisted studio slices. The UI here just picks how to
 * present it — never re-derives.
 *
 * Sections render conditionally so a fresh project reads clean; things
 * only appear as they become relevant.
 */

import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Sparkle,
  TrendUp,
  TrendDown,
  Minus,
  Warning,
  Path,
} from "@phosphor-icons/react";
import type { ProjectHealth, Recommendation } from "@/lib/projects/intelligence";
import { openAIDock } from "@/components/app/app-shell";

type Props = {
  health: ProjectHealth;
};

export function ProjectHealthPanel({ health }: Props) {
  const reduce = useReducedMotion();
  const momentumIcon =
    health.momentum.trend === "up" ? (
      <TrendUp className="size-3.5" weight="bold" />
    ) : health.momentum.trend === "down" ? (
      <TrendDown className="size-3.5" weight="bold" />
    ) : (
      <Minus className="size-3.5" weight="bold" />
    );
  const momentumColor =
    health.momentum.trend === "up"
      ? "text-accent-fg"
      : health.momentum.trend === "down"
        ? "text-red-400"
        : "text-muted";

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
            Project health
          </p>
          <h3 className="mt-1 text-[15px] font-semibold text-ink">
            {health.completion >= 100
              ? "Ready to ship"
              : "Where you are"}
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-line/60 bg-bg px-2 py-0.5 text-[11px] tabular-nums ${momentumColor}`}
        >
          {momentumIcon}
          {health.momentum.recent} this week
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricRing
          label="Completion"
          value={health.completion}
          suffix="%"
          reduce={Boolean(reduce)}
        />
        <MetricRing
          label="Creative score"
          value={health.score}
          suffix=""
          reduce={Boolean(reduce)}
        />
        <div className="flex flex-col justify-center rounded-xl border border-line/60 bg-bg px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
            Next step
          </p>
          <p className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-ink">
            {health.nextStep}
          </p>
        </div>
      </div>
    </section>
  );
}

function MetricRing({
  label,
  value,
  suffix,
  reduce,
}: {
  label: string;
  value: number;
  suffix: string;
  reduce: boolean;
}) {
  const R = 24;
  const C = 2 * Math.PI * R;
  const dash = (value / 100) * C;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line/60 bg-bg px-3 py-2.5">
      <svg
        viewBox="0 0 64 64"
        className="size-14 shrink-0 -rotate-90"
        aria-hidden="true"
      >
        <circle cx="32" cy="32" r={R} stroke="currentColor" strokeWidth="4" fill="none" className="text-line" />
        <motion.circle
          cx="32"
          cy="32"
          r={R}
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          className="text-accent"
          initial={reduce ? false : { strokeDasharray: `0 ${C}` }}
          animate={{ strokeDasharray: `${dash} ${C}` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
          {label}
        </p>
        <p className="text-[18px] font-semibold tabular-nums text-ink">
          {value}
          <span className="text-[12px] text-faint">{suffix}</span>
        </p>
      </div>
    </div>
  );
}

// ─── Recommendations block ─────────────────────────────────────────

export function ProjectRecommendations({
  recommendations,
}: {
  recommendations: Recommendation[];
}) {
  if (recommendations.length === 0) return null;
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkle className="size-3.5 text-accent-fg" weight="fill" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
          AI observations
        </p>
      </div>
      <ul className="space-y-2">
        {recommendations.map((r) => (
          <RecommendationRow key={r.id} r={r} />
        ))}
      </ul>
    </section>
  );
}

function RecommendationRow({ r }: { r: Recommendation }) {
  const icon =
    r.severity === "warning" ? (
      <Warning className="size-3.5 text-amber-400" weight="fill" />
    ) : r.severity === "opportunity" ? (
      <Sparkle className="size-3.5 text-accent-fg" weight="fill" />
    ) : (
      <Path className="size-3.5 text-muted" weight="fill" />
    );
  return (
    <li className="group flex items-start gap-3 rounded-xl border border-line/60 bg-bg px-3 py-2.5 transition-colors hover:border-faint">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-ink">{r.headline}</p>
        {r.detail && (
          <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
            {r.detail}
          </p>
        )}
      </div>
      {r.aiPrompt && (
        <button
          type="button"
          onClick={() => openAIDock({ prefill: r.aiPrompt!, autoSend: true })}
          className="mt-0.5 inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-line/60 bg-surface px-2 py-1 text-[11px] text-muted transition-colors hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label={`Ask AI about: ${r.headline}`}
        >
          Ask AI
          <ArrowRight className="size-3" />
        </button>
      )}
    </li>
  );
}

// ─── Dependencies + Reuse blocks ───────────────────────────────────

export function ProjectDependencies({
  dependencies,
}: {
  dependencies: ProjectHealth["dependencies"];
}) {
  if (dependencies.length === 0) return null;
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <Path className="size-3.5 text-faint" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
          Dependencies
        </p>
      </div>
      <ul className="space-y-1.5">
        {dependencies.slice(0, 4).map((d, i) => (
          <li
            key={i}
            className="flex items-center gap-2 rounded-lg border border-line/60 bg-bg px-3 py-2 text-[12px]"
          >
            <span className="truncate text-ink">{d.from.label}</span>
            <ArrowRight className="size-3 shrink-0 text-faint" />
            <span className="truncate text-ink">{d.to.label}</span>
            <span className="ml-auto shrink-0 text-[11px] text-faint">
              {d.reason}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
