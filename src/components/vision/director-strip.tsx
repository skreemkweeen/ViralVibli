"use client";

/**
 * Director Strip — target-model picker + Creative Director quick actions.
 *
 * Sits at the top of the Prompt Composer. Left half toggles the target
 * model (ChatGPT / Midjourney / Flux / …); the right half is a row of
 * deterministic "make more X" buttons that transform the current prompt
 * without any AI round-trip.
 */

import { useMemo } from "react";
import { ArrowRight, Sparkle, X } from "@phosphor-icons/react";
import { useVision } from "@/lib/vision/vision-store";
import { TARGET_MODELS, type TargetModelId } from "@/lib/vision/models";
import { ACTIONS } from "@/lib/vision/director";

export function DirectorStrip() {
  const {
    targetModel,
    setTargetModel,
    applyDirectorMove,
    lastDirectorResult,
    clearDirectorResult,
    targetPrompt,
  } = useVision();

  const activeModel = useMemo(
    () => TARGET_MODELS.find((m) => m.id === targetModel) ?? TARGET_MODELS[0],
    [targetModel],
  );

  return (
    <div className="border-b border-line bg-bg/40">
      {/* Target model row */}
      <div className="flex items-center gap-2 overflow-x-auto px-3 py-2">
        <p className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-faint">
          Target
        </p>
        <div className="flex shrink-0 gap-1">
          {TARGET_MODELS.map((m) => {
            const active = m.id === targetModel;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setTargetModel(m.id as TargetModelId)}
                aria-pressed={active}
                aria-label={`Format for ${m.label}`}
                className={`shrink-0 cursor-pointer rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  active
                    ? "border-accent/60 bg-accent/10 text-ink"
                    : "border-line bg-surface text-muted hover:border-faint hover:text-ink"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Director actions row */}
      <div className="flex flex-wrap items-center gap-1 px-3 pb-2.5">
        <div className="mr-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
          <Sparkle className="size-3 text-accent-fg" weight="fill" />
          Director
        </div>
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => applyDirectorMove(a.id)}
            title={a.description}
            aria-label={a.label}
            className="cursor-pointer rounded-full border border-line bg-surface px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-ink active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {a.label.replace(/^Make more |^Increase |^Improve /, "")}
          </button>
        ))}
      </div>

      {/* Director result banner */}
      {lastDirectorResult && lastDirectorResult.changed.length > 0 && (
        <div className="flex items-start gap-2 border-t border-line/60 bg-accent/[0.03] px-3 py-2 text-[12px]">
          <Sparkle className="mt-0.5 size-3 shrink-0 text-accent-fg" weight="fill" />
          <div className="min-w-0 flex-1">
            <p className="text-ink">
              Added <span className="text-accent-fg">
                {lastDirectorResult.changed.length}
              </span>{" "}
              {lastDirectorResult.changed.length === 1 ? "descriptor" : "descriptors"}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-faint">
              {lastDirectorResult.changed.join(", ")}
            </p>
          </div>
          <button
            type="button"
            onClick={clearDirectorResult}
            aria-label="Dismiss director result"
            className="cursor-pointer rounded p-0.5 text-faint transition-colors hover:text-ink"
          >
            <X className="size-3" weight="bold" />
          </button>
        </div>
      )}

      {/* Target-model-formatted preview */}
      {targetPrompt && (
        <details className="border-t border-line/60 px-3 py-2 text-[12px]">
          <summary className="inline-flex cursor-pointer items-center gap-1 text-faint hover:text-ink">
            <ArrowRight className="size-3" />
            {activeModel.label} preview
          </summary>
          <p className="mt-1.5 whitespace-pre-wrap rounded-lg border border-line/60 bg-bg px-2.5 py-2 font-mono text-[11px] leading-relaxed text-muted">
            {targetPrompt}
          </p>
          <p className="mt-1 text-[10.5px] italic text-faint">
            {activeModel.notes}
          </p>
        </details>
      )}
    </div>
  );
}
