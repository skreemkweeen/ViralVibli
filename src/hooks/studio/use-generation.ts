"use client";

import { useState, useCallback, useRef } from "react";
import { allEnhanceGoals, type EnhanceGoal } from "@/lib/ai/types";
import {
  enhanceViaAPI,
  createJobViaAPI,
  pollJobViaAPI,
  cancelJobViaAPI,
} from "@/lib/ai/pipeline";

export type GenerationRequest = {
  /** Raw prompt for history and display (before enhancement). */
  basePrompt: string;
  /**
   * Enhancement step. When set, runs the enhance API and merges the result
   * into `body` as { prompt: enhancedPrompt }. Pass null to skip enhancement.
   */
  enhance: {
    prompt: string;
    subject?: string;
    goals?: EnhanceGoal[];
  } | null;
  /** Exact JSON body to POST to the create endpoint. */
  body: Record<string, unknown>;
};

export type GenerationApiConfig = {
  /** Endpoint to create jobs. Default: "/api/vision/generate" */
  createEndpoint?: string;
  /** Base URL for GET/DELETE job operations. Default: "/api/jobs" */
  jobsBase?: string;
};

/**
 * Orchestrates the full enhance → create-job → poll pipeline.
 * Generic over TResult so Vision Studio (ImageResult) and Story Studio
 * (StoryResult) can share the same infrastructure without duplication.
 */
export function useGeneration<TResult>(
  onResult: (result: TResult, enhancedPrompt: string | null, basePrompt: string) => void,
  apiConfig?: GenerationApiConfig,
) {
  const {
    createEndpoint = "/api/vision/generate",
    jobsBase = "/api/jobs",
  } = apiConfig ?? {};

  const [generating, setGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    if (jobIdRef.current) {
      void cancelJobViaAPI(jobIdRef.current, jobsBase);
      jobIdRef.current = null;
    }
    setGenerating(false);
    setEnhancing(false);
    setError(null);
  }, [jobsBase]);

  const generate = useCallback(
    (req: GenerationRequest) => {
      if (generating) return;

      const ac = new AbortController();
      abortRef.current = ac;
      setGenerating(true);
      setEnhancedPrompt(null);
      setError(null);

      const { basePrompt, enhance, body } = req;

      (async () => {
        // ── Step 1: Enhance (optional) ───────────────────────────────────────
        let finalPrompt = enhance?.prompt ?? basePrompt;
        let mergedBody = body;

        if (enhance) {
          setEnhancing(true);
          try {
            const goals = enhance.goals ?? allEnhanceGoals;
            const enhanced = await enhanceViaAPI(
              enhance.prompt,
              enhance.subject ?? "",
              goals,
              ac.signal,
            );
            finalPrompt = enhanced.prompt;
            setEnhancedPrompt(finalPrompt);
            mergedBody = { ...body, prompt: finalPrompt };
          } catch {
            // non-fatal; proceed with base prompt
          }
          setEnhancing(false);
          if (ac.signal.aborted) return;
        }

        // ── Step 2: Create job ───────────────────────────────────────────────
        let jobId: string;
        try {
          const job = await createJobViaAPI(mergedBody, ac.signal, createEndpoint);
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
            const job = await pollJobViaAPI(jobId, ac.signal, jobsBase);

            if (job.status === "succeeded" && job.result != null) {
              const didEnhance = enhance && finalPrompt !== basePrompt;
              onResult(
                job.result as TResult,
                didEnhance ? finalPrompt : null,
                basePrompt,
              );
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
    [generating, onResult, createEndpoint, jobsBase],
  );

  const clearError = useCallback(() => setError(null), []);

  /** Reset transient state (enhanced prompt + error) between sessions. */
  const reset = useCallback(() => {
    setEnhancedPrompt(null);
    setError(null);
  }, []);

  return { generating, enhancing, enhancedPrompt, error, generate, cancel, clearError, reset };
}
