/**
 * In-process job store for image generation jobs.
 * Survives for the lifetime of the Node server process.
 * Replace the Map with Redis/Upstash for multi-instance deployments.
 */

import type { Job, ImageRequest, ImageResult } from "./types";
import { getPrimaryImageProvider } from "./registry";
import { ProviderError } from "./types";

const jobs = new Map<string, Job>();
const controllers = new Map<string, AbortController>();

let seq = 0;
function newId() {
  return `job-${Date.now()}-${++seq}`;
}

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = [1000, 3000, 8000];

function patch(id: string, updates: Partial<Job>) {
  const job = jobs.get(id);
  if (!job) return;
  jobs.set(id, { ...job, ...updates, updatedAt: Date.now() });
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function listJobs(): Job[] {
  return [...jobs.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function cancelJob(id: string): boolean {
  const job = jobs.get(id);
  if (!job || job.status === "succeeded" || job.status === "failed") return false;
  controllers.get(id)?.abort();
  patch(id, { status: "cancelled" });
  return true;
}

async function runAttempt(id: string, attempt: number): Promise<void> {
  const job = jobs.get(id);
  if (!job || job.status === "cancelled") return;

  patch(id, {
    status: "running",
    attempts: attempt,
    progress: 0.1 + attempt * 0.05,
  });

  const controller = new AbortController();
  controllers.set(id, controller);

  try {
    const provider = getPrimaryImageProvider();
    patch(id, { provider: provider.id, progress: 0.2 });

    const result: ImageResult = await provider.generate(job.request, controller.signal);

    patch(id, { status: "succeeded", progress: 1, result });
  } catch (err) {
    const retryable = err instanceof ProviderError ? err.retryable : true;
    const isLast = attempt >= MAX_ATTEMPTS;

    if (!retryable || isLast || controller.signal.aborted) {
      patch(id, {
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    const delay = RETRY_DELAY_MS[attempt - 1] ?? 8000;
    await new Promise((r) => setTimeout(r, delay));
    await runAttempt(id, attempt + 1);
  } finally {
    controllers.delete(id);
  }
}

export function createJob(request: ImageRequest): Job {
  const id = newId();
  const provider = getPrimaryImageProvider().id;
  const now = Date.now();
  const job: Job = {
    id,
    status: "queued",
    progress: 0,
    request,
    attempts: 0,
    provider,
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(id, job);
  // Fire-and-forget; status is polled by the client
  void runAttempt(id, 1);
  return job;
}

// Prune jobs older than 2 hours to prevent memory leak
setInterval(
  () => {
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    for (const [id, job] of jobs) {
      if (
        job.createdAt < cutoff &&
        (job.status === "succeeded" || job.status === "failed" || job.status === "cancelled")
      ) {
        jobs.delete(id);
      }
    }
  },
  15 * 60 * 1000,
);
