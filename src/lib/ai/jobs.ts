/**
 * In-process job store for generation jobs.
 * Survives for the lifetime of the Node server process.
 * Replace the Map with Redis/Upstash for multi-instance deployments.
 *
 * createJob is internal; callers use createImageJob / createStoryJob.
 */

import type { Job, ImageRequest, StoryRequest, VaultTransformRequest } from "./types";
import { getPrimaryImageProvider, getPrimaryStoryProvider, getPrimaryVaultProvider } from "./registry";
import { ProviderError } from "./types";

const jobs = new Map<string, Job>();
const controllers = new Map<string, AbortController>();

let seq = 0;
function newId() {
  return `job-${Date.now()}-${++seq}`;
}

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = [1000, 3000, 8000];

type JobRunner = (request: unknown, signal: AbortSignal) => Promise<unknown>;

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

async function runAttempt(id: string, attempt: number, runner: JobRunner): Promise<void> {
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
    patch(id, { progress: 0.2 });
    const result = await runner(job.request, controller.signal);
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
    await runAttempt(id, attempt + 1, runner);
  } finally {
    controllers.delete(id);
  }
}

function createJob(request: unknown, runner: JobRunner, providerHint = "unknown"): Job {
  const id = newId();
  const now = Date.now();
  const job: Job = {
    id,
    status: "queued",
    progress: 0,
    request,
    attempts: 0,
    provider: providerHint,
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(id, job);
  void runAttempt(id, 1, runner);
  return job;
}

export function createImageJob(request: ImageRequest): Job {
  const provider = getPrimaryImageProvider();
  return createJob(
    request,
    (req, signal) => provider.generate(req as ImageRequest, signal),
    provider.id,
  );
}

export function createStoryJob(request: StoryRequest): Job {
  const provider = getPrimaryStoryProvider();
  return createJob(
    request,
    (req, signal) => provider.generate(req as StoryRequest, signal),
    provider.id,
  );
}

export function createVaultJob(request: VaultTransformRequest): Job {
  const provider = getPrimaryVaultProvider();
  return createJob(
    request,
    (req, signal) => provider.transform(req as VaultTransformRequest, signal),
    provider.id,
  );
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
