import { describe, expect, it, vi } from "vitest";
import { ProviderError } from "./types";

// The registry is memoized at module load and reads process.env, so we mock
// it before importing jobs. Every provider is replaced with a controllable
// stub that returns whatever we ask for.
type Runner = (req: unknown, signal: AbortSignal) => Promise<unknown>;

const image = { id: "test-image", generate: vi.fn<Runner>() };
const story = { id: "test-story", generate: vi.fn<Runner>() };
const vault = { id: "test-vault", transform: vi.fn<Runner>() };

vi.mock("./registry", () => ({
  getPrimaryImageProvider: () => image,
  getPrimaryStoryProvider: () => story,
  getPrimaryVaultProvider: () => vault,
}));

// Import _after_ the mock so the mock resolves.
import {
  createImageJob,
  createStoryJob,
  createVaultJob,
  getJob,
  cancelJob,
} from "./jobs";

async function waitFor(check: () => boolean, timeout = 500): Promise<void> {
  const start = Date.now();
  while (!check() && Date.now() - start < timeout) {
    await new Promise((r) => setTimeout(r, 10));
  }
  if (!check()) throw new Error("waitFor timeout");
}

describe("job store", () => {
  it("creates a queued job and returns immediately with the request", () => {
    image.generate.mockImplementationOnce(async () => ({ images: [] }));
    const job = createImageJob({
      prompt: "a mug",
      aspect: "4:5",
      count: 2,
    });
    expect(job.status).toBe("queued");
    expect(job.provider).toBe("test-image");
    expect(job.request).toMatchObject({ prompt: "a mug" });
  });

  it("transitions to succeeded when the provider resolves", async () => {
    image.generate.mockImplementationOnce(async () => ({
      images: [{ seed: 1 }],
    }));
    const job = createImageJob({ prompt: "x", aspect: "1:1", count: 1 });
    await waitFor(() => getJob(job.id)?.status === "succeeded");
    const final = getJob(job.id);
    expect(final?.status).toBe("succeeded");
    expect(final?.progress).toBe(1);
    expect(final?.result).toMatchObject({ images: expect.any(Array) });
  });

  it("marks the job failed and records the error message when the provider throws non-retryably", async () => {
    story.generate.mockImplementationOnce(async () => {
      throw new ProviderError("nope", "test-story", false);
    });
    const job = createStoryJob({
      brief: "x",
      framework: "aida",
      platform: "instagram",
      count: 3,
    });
    await waitFor(() => getJob(job.id)?.status === "failed");
    const final = getJob(job.id);
    expect(final?.status).toBe("failed");
    expect(final?.error).toContain("nope");
    expect(final?.attempts).toBe(1);
  });

  it("cancelJob flips the job to cancelled", async () => {
    // Provider that never resolves so we can cancel it in flight.
    let resolveIt: (value: unknown) => void = () => {};
    vault.transform.mockImplementationOnce(
      (_req: unknown, signal: AbortSignal) =>
        new Promise((resolve, reject) => {
          resolveIt = resolve;
          signal.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const job = createVaultJob({
      operation: "improve",
      content: "x",
      count: 3,
    });
    await waitFor(() => getJob(job.id)?.status === "running");
    const cancelled = cancelJob(job.id);
    expect(cancelled).toBe(true);
    expect(getJob(job.id)?.status).toBe("cancelled");
    // release the stuck promise so vitest doesn't hang
    resolveIt(undefined);
  });

  it("cancelJob is a no-op for already-completed jobs", async () => {
    image.generate.mockImplementationOnce(async () => ({ images: [] }));
    const job = createImageJob({ prompt: "x", aspect: "1:1", count: 1 });
    await waitFor(() => getJob(job.id)?.status === "succeeded");
    const cancelled = cancelJob(job.id);
    expect(cancelled).toBe(false);
    expect(getJob(job.id)?.status).toBe("succeeded");
  });
});
