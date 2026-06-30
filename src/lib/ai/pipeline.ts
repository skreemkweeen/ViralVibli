import type { EnhanceGoal, EnhanceResult } from "./types";

// ── Enhance ───────────────────────────────────────────────────────────────────

export async function enhanceViaAPI(
  prompt: string,
  subject: string,
  goals: EnhanceGoal[],
  signal?: AbortSignal,
): Promise<EnhanceResult> {
  const res = await fetch("/api/vision/enhance", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, subject, goals }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: "Enhancement failed" }))) as {
      error?: string;
    };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<EnhanceResult>;
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

/** Minimal job shape returned from poll/create calls. Callers cast result as needed. */
export type JobPollResult = {
  id: string;
  status: string;
  progress?: number;
  result?: unknown;
  error?: string;
};

export async function createJobViaAPI(
  body: Record<string, unknown>,
  signal?: AbortSignal,
  endpoint = "/api/vision/generate",
): Promise<JobPollResult> {
  const res = await fetch(endpoint, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<JobPollResult>;
}

export async function pollJobViaAPI(
  jobId: string,
  signal?: AbortSignal,
  jobsBase = "/api/jobs",
): Promise<JobPollResult> {
  const res = await fetch(`${jobsBase}/${jobId}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<JobPollResult>;
}

export async function cancelJobViaAPI(
  jobId: string,
  jobsBase = "/api/jobs",
): Promise<void> {
  await fetch(`${jobsBase}/${jobId}`, { method: "DELETE" });
}
