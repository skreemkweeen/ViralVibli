import type { EnhanceGoal, EnhanceResult, ImageRequest, Job } from "./types";

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

export async function createJobViaAPI(
  request: ImageRequest,
  signal?: AbortSignal,
): Promise<Job> {
  const res = await fetch("/api/vision/generate", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<Job>;
}

export async function pollJobViaAPI(
  jobId: string,
  signal?: AbortSignal,
): Promise<Job> {
  const res = await fetch(`/api/vision/jobs/${jobId}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<Job>;
}

export async function cancelJobViaAPI(jobId: string): Promise<void> {
  await fetch(`/api/vision/jobs/${jobId}`, { method: "DELETE" });
}
