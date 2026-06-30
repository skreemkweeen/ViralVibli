"use client";

import { StopCircle } from "@phosphor-icons/react";
import { motion } from "motion/react";

export function StudioGenerateButton({
  generating,
  enhancing,
  onGenerate,
  onCancel,
  disabled = false,
  label = "Generate",
  enhancingLabel = "Enhancing…",
  generatingLabel = "Generating…",
}: {
  generating: boolean;
  enhancing: boolean;
  onGenerate: () => void;
  onCancel: () => void;
  disabled?: boolean;
  label?: string;
  enhancingLabel?: string;
  generatingLabel?: string;
}) {
  const activeLabel = enhancing ? enhancingLabel : generating ? generatingLabel : label;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={generating ? undefined : onGenerate}
        disabled={disabled || generating}
        aria-busy={generating}
        className="relative flex h-10 flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent px-4 text-[13.5px] font-semibold text-accent-contrast transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
      >
        {generating && (
          <motion.span
            className="absolute inset-0 origin-left bg-black/10"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 180, ease: "linear" }}
          />
        )}
        <span className="relative">{activeLabel}</span>
      </button>

      {generating && (
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel generation"
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface text-faint transition-colors hover:border-faint hover:text-muted"
        >
          <StopCircle className="size-5" />
        </button>
      )}
    </div>
  );
}
