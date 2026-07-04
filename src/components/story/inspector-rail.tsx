"use client";

/**
 * Story Studio inspector rail — persistent right-hand column that
 * surfaces live signals from the Inspector, Analytics predictions,
 * Story tree HEAD, and the Publishing queue.
 */

import { useMemo } from "react";
import {
  Brain,
  ChartLineUp,
  ClockClockwise,
  PaperPlaneTilt,
  Target,
} from "@phosphor-icons/react";
import { useStory } from "@/lib/story/store";
import { storyHead } from "@/lib/story/story-versions";
import { statusSummary } from "@/lib/story/story-publishing";

export function StoryInspectorRail({
  onOpen,
}: {
  onOpen: (id: "intelligence" | "analytics" | "versions" | "publishing") => void;
}) {
  const { inspection, predictions, storyTree, publishQueue, targetPlatform } = useStory();

  const lowestDims = useMemo(
    () => [...inspection.dimensions].sort((a, b) => a.score - b.score).slice(0, 3),
    [inspection.dimensions],
  );

  const topPrediction = useMemo(() => predictions.find((p) => p.id === "completion"), [predictions]);
  const retention = useMemo(() => predictions.find((p) => p.id === "retention"), [predictions]);

  const head = storyHead(storyTree);
  const publish = statusSummary(publishQueue);
  const scheduled = publish.scheduled + publish.queued;

  return (
    <aside className="grid gap-3 overflow-y-auto p-3">
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
        <p className="text-[11px] text-muted">Target · {targetPlatform}</p>
        <ul className="mt-2 grid gap-1 text-[11px]">
          {lowestDims.map((d) => (
            <li key={d.id} className="flex items-baseline justify-between gap-1">
              <span className="truncate text-muted">{d.label}</span>
              <span className="shrink-0 tabular-nums text-faint">{d.score}</span>
            </li>
          ))}
        </ul>
      </button>

      {/* Analytics */}
      <button
        type="button"
        onClick={() => onOpen("analytics")}
        className="cursor-pointer rounded-xl border border-line bg-bg p-3 text-left transition-colors hover:border-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-faint">
          <ChartLineUp className="size-3" weight="bold" />
          Predictions
        </div>
        {topPrediction && (
          <p className="text-[15px] font-semibold text-ink">
            {topPrediction.value}
            <span className="text-[11px] tabular-nums text-faint">{topPrediction.unit}</span>
            <span className="ml-1 text-[11px] text-faint">completion</span>
          </p>
        )}
        {retention && (
          <p className="text-[11px] text-muted">
            Retention {retention.value}
            {retention.unit}
          </p>
        )}
      </button>

      {/* Versions */}
      <button
        type="button"
        onClick={() => onOpen("versions")}
        className="cursor-pointer rounded-xl border border-line bg-bg p-3 text-left transition-colors hover:border-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-faint">
          <ClockClockwise className="size-3" weight="bold" />
          Versions
        </div>
        <p className="text-[13px] text-ink">
          {storyTree.snapshots.length === 0
            ? "No snapshots yet"
            : (head?.label ?? head?.id.slice(0, 12) ?? "—")}
        </p>
        <p className="mt-0.5 text-[11px] text-muted">
          {storyTree.snapshots.length} snapshot(s)
        </p>
      </button>

      {/* Publishing */}
      <button
        type="button"
        onClick={() => onOpen("publishing")}
        className="cursor-pointer rounded-xl border border-line bg-bg p-3 text-left transition-colors hover:border-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-faint">
          <PaperPlaneTilt className="size-3" weight="bold" />
          Publishing
        </div>
        <p className="text-[15px] font-semibold text-ink">{scheduled}</p>
        <p className="mt-0.5 text-[11px] text-muted">
          Draft {publish.draft} · Published {publish.published} · Failed {publish.failed}
        </p>
      </button>

      {/* Director shortcut */}
      <button
        type="button"
        onClick={() => onOpen("intelligence")}
        className="cursor-pointer rounded-xl border border-accent/40 bg-accent/[0.06] p-3 text-left transition-colors hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-faint">
          <Brain className="size-3" weight="bold" />
          Director
        </div>
        <p className="text-[13px] text-ink">Open the AI Story Director</p>
        <p className="mt-0.5 text-[11px] text-muted">17 rewrite actions with reasoning</p>
      </button>
    </aside>
  );
}
