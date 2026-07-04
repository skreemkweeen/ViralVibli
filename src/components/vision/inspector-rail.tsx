"use client";

/**
 * Inspector Rail — the right column of the professional Vision Studio
 * layout. Persistent live view of:
 *   • Creative Director scorecard headline + weakest
 *   • Prompt Inspector overall + top-3 lowest-scoring dimensions
 *   • Shot list summary (counts by status)
 *   • Version tip (HEAD label + comment count)
 *   • Batch queue snapshot
 *
 * Every section is a tight card that either surfaces a signal or points
 * to the panel where the creator can dig deeper.
 */

import { useMemo } from "react";
import {
  Brain,
  ClockClockwise,
  FilmSlate,
  GridFour,
  Target,
} from "@phosphor-icons/react";
import { useVision } from "@/lib/vision/vision-store";
import { head } from "@/lib/vision/prompt-versions";
import { shotStatusSummary } from "@/lib/vision/shots";

export function InspectorRail({
  onOpen,
}: {
  onOpen: (tool: "intelligence" | "shots" | "batch") => void;
}) {
  const { scorecard, inspection, shots, promptTree, batchVariants, batchConfig } =
    useVision();

  const headline = scorecard.axes.find((a) => a.id === scorecard.headline);
  const weakest = scorecard.axes.find((a) => a.id === scorecard.weakest);

  const lowestDims = useMemo(
    () =>
      [...inspection.dimensions]
        .sort((a, b) => a.score - b.score)
        .slice(0, 3),
    [inspection.dimensions],
  );

  const status = useMemo(() => shotStatusSummary(shots), [shots]);

  const headSnap = head(promptTree);
  const comments =
    headSnap?.comments.length ??
    promptTree.snapshots.reduce((n, s) => n + s.comments.length, 0);

  return (
    <aside className="grid gap-3 overflow-y-auto p-3">
      {/* Director */}
      <button
        type="button"
        onClick={() => onOpen("intelligence")}
        className="cursor-pointer rounded-xl border border-line bg-bg p-3 text-left transition-colors hover:border-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-faint">
          <Brain className="size-3" weight="bold" />
          Director
        </div>
        <p className="text-[12.5px] text-muted">
          Leans hardest into
        </p>
        <p className="text-[15px] font-semibold text-ink">
          {headline?.label ?? "—"}
          {headline && (
            <span className="ml-1.5 text-[11px] tabular-nums text-faint">
              {headline.score}
            </span>
          )}
        </p>
        <p className="mt-1 text-[11.5px] text-muted">
          Weakest ·{" "}
          <span className="text-ink">
            {weakest?.label ?? "—"}
            {weakest && (
              <span className="ml-1 tabular-nums text-faint">
                {weakest.score}
              </span>
            )}
          </span>
        </p>
      </button>

      {/* Inspector */}
      <button
        type="button"
        onClick={() => onOpen("intelligence")}
        className="cursor-pointer rounded-xl border border-line bg-bg p-3 text-left transition-colors hover:border-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-faint">
          <Target className="size-3" weight="bold" />
          Inspector
        </div>
        <p className="text-[15px] font-semibold text-ink">
          {inspection.overall}
          <span className="text-[11px] tabular-nums text-faint">/100</span>
        </p>
        <ul className="mt-2 grid gap-1 text-[11px]">
          {lowestDims.map((d) => (
            <li
              key={d.id}
              className="flex items-baseline justify-between gap-1"
            >
              <span className="truncate text-muted">{d.label}</span>
              <span className="shrink-0 tabular-nums text-faint">{d.score}</span>
            </li>
          ))}
        </ul>
      </button>

      {/* Shots */}
      <button
        type="button"
        onClick={() => onOpen("shots")}
        className="cursor-pointer rounded-xl border border-line bg-bg p-3 text-left transition-colors hover:border-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-faint">
          <FilmSlate className="size-3" weight="bold" />
          Shots
        </div>
        <p className="text-[15px] font-semibold text-ink">{shots.length}</p>
        <div className="mt-1 grid grid-cols-3 gap-1 text-[10.5px]">
          <StatusCell label="Idle" count={status.idle} />
          <StatusCell label="Queued" count={status.queued} />
          <StatusCell label="Running" count={status.running} />
          <StatusCell label="Done" count={status.done} />
          <StatusCell label="Failed" count={status.failed} />
        </div>
      </button>

      {/* Version tip */}
      <button
        type="button"
        onClick={() => onOpen("intelligence")}
        className="cursor-pointer rounded-xl border border-line bg-bg p-3 text-left transition-colors hover:border-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-faint">
          <ClockClockwise className="size-3" weight="bold" />
          Versions
        </div>
        <p className="text-[13px] text-ink">
          {promptTree.snapshots.length === 0
            ? "No snapshots yet"
            : (headSnap?.label ?? headSnap?.id?.slice(0, 12) ?? "—")}
        </p>
        <p className="mt-0.5 text-[11px] text-muted">
          {promptTree.snapshots.length} snapshot(s) · {comments} comment(s)
        </p>
      </button>

      {/* Batch queue */}
      <button
        type="button"
        onClick={() => onOpen("batch")}
        className="cursor-pointer rounded-xl border border-line bg-bg p-3 text-left transition-colors hover:border-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-faint">
          <GridFour className="size-3" weight="bold" />
          Batch
        </div>
        <p className="text-[15px] font-semibold text-ink">
          {batchVariants.length}
          <span className="ml-1 text-[11px] tabular-nums text-faint">
            /{batchConfig.size}
          </span>
        </p>
        <p className="mt-1 text-[11px] text-muted">
          {batchConfig.styles.length +
            batchConfig.compositions.length +
            batchConfig.platforms.length}{" "}
          filter(s) active · seed {batchConfig.seed}
        </p>
      </button>
    </aside>
  );
}

function StatusCell({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-md border border-line bg-surface px-1.5 py-0.5">
      <p className="uppercase tracking-widest text-faint">{label}</p>
      <p className="text-[12px] tabular-nums text-ink">{count}</p>
    </div>
  );
}
