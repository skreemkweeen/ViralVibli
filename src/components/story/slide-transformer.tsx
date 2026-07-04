"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Sparkle,
  ArrowsClockwise,
  ArrowsOutSimple,
  ArrowsInSimple,
  Check,
  X,
  StopCircle,
} from "@phosphor-icons/react";
import { useGeneration } from "@/hooks/studio/use-generation";
import type { VaultTransformResult, TransformOp } from "@/lib/ai/types";
import { useStory } from "@/lib/story/store";

const OPS: Array<{
  id: Extract<TransformOp, "rewrite" | "expand" | "condense">;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string; weight?: "regular" | "bold" | "fill" }>;
}> = [
  {
    id: "rewrite",
    label: "Rewrite",
    hint: "Tighten and sharpen the copy in the same voice",
    icon: ArrowsClockwise,
  },
  {
    id: "expand",
    label: "Expand",
    hint: "Add nuance and specificity to the copy",
    icon: ArrowsOutSimple,
  },
  {
    id: "condense",
    label: "Condense",
    hint: "Cut everything that isn't essential",
    icon: ArrowsInSimple,
  },
];

/**
 * Per-slide AI transformer. Reuses the existing /api/vault/transform pipeline
 * (via useGeneration) so slide-level operations share the exact same job,
 * cancellation, and error semantics as the vault. Result surfaces as an
 * Accept / Reject preview inline below the slide — the store only mutates
 * on Accept.
 */
export function SlideTransformer({
  conceptId,
  slideIndex,
  currentCopy,
  onOpenChange,
  open,
}: {
  conceptId: string;
  slideIndex: number;
  currentCopy: string;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const { updateSlideCopy } = useStory();
  const reduce = useReducedMotion();
  const [pending, setPending] = useState<string | null>(null);
  const [activeOp, setActiveOp] = useState<TransformOp | null>(null);
  const resultForRef = useRef<string | null>(null);

  const onTransformResult = useCallback(
    (result: VaultTransformResult) => {
      if (!result.content) return;
      resultForRef.current = currentCopy;
      setPending(result.content);
    },
    [currentCopy],
  );

  const { generating, error, generate, cancel, clearError } =
    useGeneration<VaultTransformResult>(onTransformResult, {
      createEndpoint: "/api/vault/transform",
      jobsBase: "/api/jobs",
    });

  const runOp = useCallback(
    (op: (typeof OPS)[number]["id"]) => {
      setPending(null);
      setActiveOp(op);
      clearError();
      generate({
        basePrompt: currentCopy,
        enhance: null,
        body: { content: currentCopy, operation: op, count: 1 },
      });
    },
    [currentCopy, generate, clearError],
  );

  const accept = useCallback(() => {
    if (!pending) return;
    updateSlideCopy(conceptId, slideIndex, pending);
    setPending(null);
    setActiveOp(null);
    onOpenChange(false);
  }, [pending, conceptId, slideIndex, updateSlideCopy, onOpenChange]);

  const reject = useCallback(() => {
    setPending(null);
    setActiveOp(null);
  }, []);

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={reduce ? false : { height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={reduce ? undefined : { height: 0, opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden border-t border-line/50"
        >
          <div className="px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkle weight="fill" className="size-3 text-accent-fg" />
                <p className="text-[10.5px] font-semibold uppercase tracking-widest text-faint">
                  AI actions
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  cancel();
                  onOpenChange(false);
                }}
                aria-label="Close AI actions"
                className="text-[10.5px] text-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 rounded"
              >
                Close
              </button>
            </div>

            {/* Op row */}
            <div className="flex flex-wrap gap-1.5">
              {OPS.map((op) => {
                const Icon = op.icon;
                const isRunning = generating && activeOp === op.id;
                const disabled = generating && activeOp !== op.id;
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => runOp(op.id)}
                    disabled={disabled}
                    title={op.hint}
                    aria-label={`${op.label} — ${op.hint}`}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                      isRunning
                        ? "border-accent/50 bg-accent/[0.10] text-accent-fg"
                        : "border-line bg-bg text-muted hover:border-faint hover:text-ink"
                    }`}
                  >
                    {isRunning ? (
                      <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Icon className="size-3" weight="bold" />
                    )}
                    {op.label}
                  </button>
                );
              })}
              {generating && (
                <button
                  type="button"
                  onClick={cancel}
                  aria-label="Cancel transform"
                  className="ml-1 flex cursor-pointer items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11.5px] text-faint transition-colors hover:border-red-500/40 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                >
                  <StopCircle className="size-3" weight="fill" />
                  Stop
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <p role="alert" className="mt-2 text-[11.5px] text-red-400">
                {error}
              </p>
            )}

            {/* Pending result */}
            <AnimatePresence>
              {pending && (
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: 4 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-3 rounded-xl border border-accent/30 bg-accent/[0.05] p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[10.5px] font-semibold uppercase tracking-widest text-accent-fg">
                      Suggested rewrite
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={accept}
                        aria-label="Accept and replace slide copy"
                        className="flex cursor-pointer items-center gap-1 rounded-lg bg-accent px-2 py-1 text-[11.5px] font-semibold text-accent-ink transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                      >
                        <Check weight="bold" className="size-3" />
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={reject}
                        aria-label="Discard suggestion"
                        className="flex cursor-pointer items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11.5px] text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line"
                      >
                        <X className="size-3" weight="bold" />
                        Discard
                      </button>
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed text-ink">
                    {pending}
                  </p>
                  {resultForRef.current && resultForRef.current !== pending && (
                    <p className="mt-2 border-t border-accent/20 pt-2 font-mono text-[10.5px] text-faint">
                      was: {truncate(resultForRef.current, 120)}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
