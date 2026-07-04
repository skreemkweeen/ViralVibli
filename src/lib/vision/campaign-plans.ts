/**
 * Campaign plan engine — expands one brief into a full campaign of shots
 * with a dependency graph. The Hero drives everything; every downstream
 * shot depends on it. Platform outputs depend on their production source
 * (Hero → Banner, Detail → Pinterest, Lifestyle → TikTok, etc.).
 *
 * Recipes are declarative — the engine walks the recipe and returns Shot
 * instances (already tuned via SHOT_TYPE_SPECS) plus the edge list. Pure.
 */

import type { CreativeBrief } from "./brief";
import type { LightingSetup } from "./lighting";
import type { Direction } from "./prompt";
import { emptyDirection } from "./prompt";
import { emptyLightingSetup } from "./lighting";
import { newShot, type Shot, type ShotType } from "./shots";

// ─── Types ────────────────────────────────────────────────────────────────

export type RecipeItem = {
  type: ShotType;
  count: number;
  /** Shot types this shot type is derived from (dependency parents) */
  dependsOn?: ShotType[];
};

export type CampaignRecipe = {
  id: string;
  label: string;
  hint: string;
  /** e.g. "Full launch", "Social burst", "Product debut" */
  scope: "launch" | "social" | "seasonal" | "debut" | "rebrand" | "sample";
  items: RecipeItem[];
};

export type CampaignEdge = { from: string; to: string };

export type CampaignPlan = {
  id: string;
  recipeId: string;
  label: string;
  shots: Shot[];
  edges: CampaignEdge[];
  createdAt: number;
  briefSnapshot?: CreativeBrief;
};

// ─── Recipes ──────────────────────────────────────────────────────────────
//
// Every recipe encodes a real production flow, not a random bag of shots.
// Dependencies read: "you need X in the can before Y is meaningful."

export const CAMPAIGN_RECIPES: CampaignRecipe[] = [
  {
    id: "full-launch",
    label: "Full launch",
    hint: "1 Hero → 4 Lifestyle · 5 Detail · 3 Macro · Packaging + Website + Social + Email + Ads",
    scope: "launch",
    items: [
      { type: "hero", count: 1 },
      { type: "lifestyle", count: 4, dependsOn: ["hero"] },
      { type: "detail", count: 5, dependsOn: ["hero"] },
      { type: "macro", count: 3, dependsOn: ["detail"] },
      { type: "packaging", count: 1, dependsOn: ["hero"] },
      { type: "website", count: 1, dependsOn: ["hero"] },
      { type: "instagram", count: 3, dependsOn: ["lifestyle"] },
      { type: "tiktok", count: 2, dependsOn: ["lifestyle"] },
      { type: "email", count: 2, dependsOn: ["hero"] },
      { type: "paid-ads", count: 3, dependsOn: ["hero"] },
    ],
  },
  {
    id: "social-burst",
    label: "Social burst",
    hint: "1 Hero → 3 Lifestyle → Instagram · TikTok · Pinterest · Thumbnail",
    scope: "social",
    items: [
      { type: "hero", count: 1 },
      { type: "lifestyle", count: 3, dependsOn: ["hero"] },
      { type: "instagram", count: 4, dependsOn: ["lifestyle"] },
      { type: "tiktok", count: 3, dependsOn: ["lifestyle"] },
      { type: "pinterest", count: 3, dependsOn: ["lifestyle"] },
      { type: "thumbnail", count: 2, dependsOn: ["hero"] },
    ],
  },
  {
    id: "product-debut",
    label: "Product debut",
    hint: "Editorial-forward hero + studio + macro trio for an intro moment",
    scope: "debut",
    items: [
      { type: "hero", count: 1 },
      { type: "studio", count: 2, dependsOn: ["hero"] },
      { type: "detail", count: 3, dependsOn: ["studio"] },
      { type: "macro", count: 3, dependsOn: ["detail"] },
      { type: "packaging", count: 1, dependsOn: ["studio"] },
      { type: "instagram", count: 3, dependsOn: ["hero"] },
    ],
  },
  {
    id: "seasonal",
    label: "Seasonal",
    hint: "Lifestyle-led seasonal moment with light social + email support",
    scope: "seasonal",
    items: [
      { type: "hero", count: 1 },
      { type: "lifestyle", count: 5, dependsOn: ["hero"] },
      { type: "flat-lay", count: 2, dependsOn: ["hero"] },
      { type: "instagram", count: 3, dependsOn: ["lifestyle"] },
      { type: "email", count: 1, dependsOn: ["hero"] },
      { type: "banner", count: 1, dependsOn: ["hero"] },
    ],
  },
  {
    id: "rebrand",
    label: "Rebrand",
    hint: "Editorial-heavy sample plate to define the new visual system",
    scope: "rebrand",
    items: [
      { type: "hero", count: 2 },
      { type: "studio", count: 3, dependsOn: ["hero"] },
      { type: "lifestyle", count: 3, dependsOn: ["hero"] },
      { type: "detail", count: 4, dependsOn: ["studio"] },
      { type: "website", count: 1, dependsOn: ["hero"] },
      { type: "banner", count: 2, dependsOn: ["hero"] },
    ],
  },
  {
    id: "sample-plate",
    label: "Sample plate",
    hint: "Small taste plate — one of each core shot type",
    scope: "sample",
    items: [
      { type: "hero", count: 1 },
      { type: "lifestyle", count: 1, dependsOn: ["hero"] },
      { type: "detail", count: 1, dependsOn: ["hero"] },
      { type: "macro", count: 1, dependsOn: ["detail"] },
      { type: "packaging", count: 1, dependsOn: ["hero"] },
      { type: "instagram", count: 1, dependsOn: ["lifestyle"] },
    ],
  },
];

const RECIPE_INDEX: Record<string, CampaignRecipe> = CAMPAIGN_RECIPES.reduce(
  (acc, r) => {
    acc[r.id] = r;
    return acc;
  },
  {} as Record<string, CampaignRecipe>,
);

export function findRecipe(id: string): CampaignRecipe | undefined {
  return RECIPE_INDEX[id];
}

// ─── Plan builder ─────────────────────────────────────────────────────────

export type BuildOptions = {
  planId: string;
  recipeId: string;
  baseDirection?: Direction;
  baseLighting?: LightingSetup;
  brief?: CreativeBrief;
  /**
   * Deterministic id generator. Called once per shot, receives the shot
   * type + running index. Kept injectable so tests get stable output.
   */
  makeShotId?: (type: ShotType, index: number) => string;
  now?: number;
};

export function buildCampaignPlan(opts: BuildOptions): CampaignPlan {
  const recipe = findRecipe(opts.recipeId);
  if (!recipe) throw new Error(`Unknown recipe: ${opts.recipeId}`);
  const now = opts.now ?? Date.now();
  const baseDir = opts.baseDirection ?? emptyDirection;
  const baseLight = opts.baseLighting ?? emptyLightingSetup();
  const makeId = opts.makeShotId ?? ((type, i) => `${opts.planId}-${type}-${i}`);

  const shots: Shot[] = [];
  const byType: Partial<Record<ShotType, Shot[]>> = {};

  let running = 0;
  for (const item of recipe.items) {
    for (let n = 0; n < item.count; n++) {
      const id = makeId(item.type, running++);
      const shot: Shot = {
        ...newShot(id, item.type, baseDir, baseLight, now),
        name: item.count > 1
          ? `${labelForType(item.type)} ${n + 1}`
          : labelForType(item.type),
        campaignId: opts.planId,
      };
      shots.push(shot);
      (byType[item.type] ??= []).push(shot);
    }
  }

  const edges: CampaignEdge[] = [];
  for (const item of recipe.items) {
    if (!item.dependsOn?.length) continue;
    const children = byType[item.type] ?? [];
    for (const parentType of item.dependsOn) {
      const parents = byType[parentType] ?? [];
      // Fan-out: each child depends on every parent of the parent type.
      // For a Hero (parent count 1) that's a clean 1:N.
      for (const parent of parents) {
        for (const child of children) {
          edges.push({ from: parent.id, to: child.id });
        }
      }
    }
  }

  return {
    id: opts.planId,
    recipeId: recipe.id,
    label: recipe.label,
    shots,
    edges,
    createdAt: now,
    briefSnapshot: opts.brief,
  };
}

function labelForType(type: ShotType): string {
  return type
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

// ─── Read helpers ─────────────────────────────────────────────────────────

export function planShotCounts(plan: CampaignPlan): Record<ShotType, number> {
  const acc: Partial<Record<ShotType, number>> = {};
  for (const s of plan.shots) acc[s.type] = (acc[s.type] ?? 0) + 1;
  return acc as Record<ShotType, number>;
}

export function planRoots(plan: CampaignPlan): Shot[] {
  const hasIncoming = new Set(plan.edges.map((e) => e.to));
  return plan.shots.filter((s) => !hasIncoming.has(s.id));
}

export function planChildren(plan: CampaignPlan, shotId: string): Shot[] {
  const ids = new Set(
    plan.edges.filter((e) => e.from === shotId).map((e) => e.to),
  );
  return plan.shots.filter((s) => ids.has(s.id));
}

export function planParents(plan: CampaignPlan, shotId: string): Shot[] {
  const ids = new Set(
    plan.edges.filter((e) => e.to === shotId).map((e) => e.from),
  );
  return plan.shots.filter((s) => ids.has(s.id));
}
