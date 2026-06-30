/**
 * Unified AI layer contracts. The UI never imports a provider; it calls our
 * own API routes, which resolve a provider from env config. Providers are
 * interchangeable and addable without touching this interface or the UI.
 */

export type EnhanceGoal =
  | "composition"
  | "lighting"
  | "camera"
  | "materials"
  | "rendering"
  | "cinematic";

export const allEnhanceGoals: EnhanceGoal[] = [
  "composition",
  "lighting",
  "camera",
  "materials",
  "rendering",
  "cinematic",
];

export type EnhanceInput = {
  /** the composed brief to elaborate */
  prompt: string;
  /** the user's subject; must be preserved verbatim, never overwritten */
  subject: string;
  /** which dimensions to improve */
  goals: EnhanceGoal[];
};

export type EnhanceResult = {
  prompt: string;
  provider: string;
};

export type ImageRequest = {
  prompt: string;
  /** "4:5", "16:9", ... */
  aspect: string;
  count: number;
  seed?: number;
  quality?: string;
};

export type GeneratedImage = {
  /** present when a real provider returns a rendered asset */
  url?: string;
  /** stable seed; the local engine renders a designed concept from it */
  seed: string;
  width?: number;
  height?: number;
  provider: string;
};

export type ImageResult = {
  images: GeneratedImage[];
  provider: string;
};

export type JobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type Job = {
  id: string;
  status: JobStatus;
  /** 0..1 */
  progress: number;
  request: ImageRequest;
  result?: ImageResult;
  error?: string;
  attempts: number;
  provider: string;
  createdAt: number;
  updatedAt: number;
};

export interface TextProvider {
  readonly id: string;
  enhance(input: EnhanceInput, signal?: AbortSignal): Promise<EnhanceResult>;
}

export interface ImageProvider {
  readonly id: string;
  generate(req: ImageRequest, signal?: AbortSignal): Promise<ImageResult>;
}

/** Provider failure that should surface to retry logic. */
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    readonly retryable = true,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export function aspectToSize(aspect: string, base = 1024): {
  width: number;
  height: number;
} {
  const [w, h] = aspect.split(":").map(Number);
  if (!w || !h) return { width: base, height: base };
  if (w >= h) return { width: base, height: Math.round((base * h) / w) };
  return { width: Math.round((base * w) / h), height: base };
}
