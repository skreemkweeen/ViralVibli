import type { TransformOp, VaultTransformResult } from "@/lib/ai/types";

export type { TransformOp };

export type PromptCategory =
  | "image-gen"
  | "copywriting"
  | "social"
  | "video"
  | "research"
  | "code"
  | "analysis"
  | "creative";

export type PromptPlatform =
  | "chatgpt"
  | "claude"
  | "midjourney"
  | "dalle"
  | "runway"
  | "flux"
  | "stable-diffusion"
  | "sora";

export type PromptVersion = {
  id: string;
  content: string;
  note?: string;
  createdAt: number;
};

export type PromptEntry = {
  id: string;
  title: string;
  content: string;
  /**
   * One-line summary of what this prompt is for. Optional so legacy entries
   * hydrate cleanly; the inspector renders an empty affordance when absent.
   */
  description?: string;
  category: PromptCategory;
  tags: string[];
  platform?: PromptPlatform;
  source: "user" | "seed";
  favorite: boolean;
  pinned: boolean;
  collectionId?: string;
  usageCount: number;
  versions: PromptVersion[];
  createdAt: number;
  updatedAt: number;
  /** Optional project this prompt belongs to; stamped on save when a project
   * is active in the workspace. */
  projectId?: string;
};

export type VaultCollection = {
  id: string;
  name: string;
  createdAt: number;
};

export type VaultFilter = {
  category: PromptCategory | null;
  platform: PromptPlatform | null;
  search: string;
  scope: "all" | "favorites" | "pinned";
};

export type SortMode = "recent" | "popular" | "alphabetical";

export type TransformState = {
  transforming: boolean;
  enhancing: boolean;
  error: string | null;
  result: (VaultTransformResult & { promptId: string }) | null;
};
