"use client";

import { useState, useCallback, useRef } from "react";
import { allEnhanceGoals, type EnhanceGoal, type ImageResult } from "@/lib/ai/types";
import {
  enhanceViaAPI,
  createJobViaAPI,
  pollJobViaAPI,
  cancelJobViaAPI,
} from "@/lib/ai/pipeline";

export type GenerateOptions = {
  prompt: string;
  subject?: string;
  aspect: string;
  count?: number;
  quality?: string;
  goals?: EnhanceGoal[];
};

export type GenerationState = {
  generating: boolean;
  enhancing: boolean;
  enhancedPrompt: string | null;
  error: string | null;
};

export type GenerationActions = {
  generate: (opts: GenerateOptions) => void;
  cancel: () => void;
  clearError: () => void;
};

/**
 * Orchestrates the full enhance → create-job → poll pipeline.
 * Returns raw ImageResult; callers map it to their own domain types.
 */
export function useGeneration(
  onResult: (result: ImageResult, enhancedPrompt: string | null, basePrompt: string) => void,
) {
  const [generating, setGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    if (jobIdRef.current) {
      void cancelJobViaAPI(jobIdRef.current);
      jobIdRef.current = null;
    }
    setGenerating(false);
    setEnhancing(false);
    setError(null);
  }, []);

  const generate = useCallback(
    (opts: GenerateOptions) => {
      if (generating) return;

      const ac = new AbortController();
      abortRef.current = ac;
      setGenerating(true);
      setEnhancing(true);
      setEnhancedPrompt(null);
      setError(null);

      const { prompt, subject = "", aspect, count = 3, quality, goals = allEnhanceGoals } = opts;

      (async () => {
        // ── Step 1: Enhance ──────────────────────────────────────────────────
        let finalPrompt = prompt;
        try {
          const enhanced = await enhanceViaAPI(prompt, subject, goals, ac.signal);
          finalPrompt = enhanced.prompt;
          setEnhancedPrompt(finalPrompt);
        } catch {
          // non-fatal; proceed with base prompt
        }
        setEnhancing(false);
        if (ac.signal.aborted) return;

        // ── Step 2: Create job ───────────────────────────────────────────────
        let jobId: string;
        try {
          const job = await createJobViaAPI(
            { prompt: finalPrompt, aspect: aspect.replace("-", ":"), count, quality },
            ac.signal,
          );
          jobId = job.id;
          jobIdRef.current = jobId;
        } catch (err) {
          if (!ac.signal.aborted) {
            setError(err instanceof Error ? err.message : "Failed to start generation");
            setGenerating(false);
          }
          return;
        }

        // ── Step 3: Poll ─────────────────────────────────────────────────────
        const deadline = Date.now() + 3 * 60 * 1000;
        while (Date.now() < deadline) {
          if (ac.signal.aborted) return;
          await new Promise((r) => setTimeout(r, 1200));
          if (ac.signal.aborted) return;

          try {
            const job = await pollJobViaAPI(jobId, ac.signal);

            if (job.status === "succeeded" && job.result) {
              onResult(job.result, finalPrompt !== prompt ? finalPrompt : null, prompt);
              setGenerating(false);
              jobIdRef.current = null;
              return;
            }

            if (job.status === "failed" || job.status === "cancelled") {
              setError(job.error ?? "Generation failed");
              setGenerating(false);
              jobIdRef.current = null;
              return;
            }
          } catch {
            // transient poll error — keep polling
          }
        }

        setError("Generation timed out. Please try again.");
        setGenerating(false);
        jobIdRef.current = null;
      })();
    },
    [generating, onResult],
  );

  const clearError = useCallback(() => setError(null), []);

  /** Reset transient state (enhanced prompt + error) between sessions. */
  const reset = useCallback(() => {
    setEnhancedPrompt(null);
    setError(null);
  }, []);

  return { generating, enhancing, enhancedPrompt, error, generate, cancel, clearError, reset };
}
