import { describe, expect, it } from "vitest";
import {
  buildCampaignPlan,
  CAMPAIGN_RECIPES,
  findRecipe,
  planChildren,
  planParents,
  planRoots,
  planShotCounts,
} from "./campaign-plans";

describe("CAMPAIGN_RECIPES", () => {
  it("contains all documented scopes", () => {
    const scopes = new Set(CAMPAIGN_RECIPES.map((r) => r.scope));
    expect(scopes.has("launch")).toBe(true);
    expect(scopes.has("social")).toBe(true);
    expect(scopes.has("debut")).toBe(true);
    expect(scopes.has("seasonal")).toBe(true);
    expect(scopes.has("rebrand")).toBe(true);
    expect(scopes.has("sample")).toBe(true);
  });

  it("every non-hero item declares its dependencies", () => {
    for (const recipe of CAMPAIGN_RECIPES) {
      for (const item of recipe.items) {
        if (item.type === "hero") continue;
        expect(
          item.dependsOn?.length ?? 0,
          `${recipe.id} :: ${item.type} must declare dependsOn`,
        ).toBeGreaterThan(0);
      }
    }
  });
});

describe("findRecipe", () => {
  it("returns the recipe by id", () => {
    expect(findRecipe("full-launch")?.label).toBe("Full launch");
  });
  it("returns undefined for unknowns", () => {
    expect(findRecipe("nope")).toBeUndefined();
  });
});

describe("buildCampaignPlan", () => {
  it("expands the recipe into shots at the right multiplicities", () => {
    const plan = buildCampaignPlan({
      planId: "camp-1",
      recipeId: "sample-plate",
      now: 1_000,
    });
    const counts = planShotCounts(plan);
    expect(counts.hero).toBe(1);
    expect(counts.lifestyle).toBe(1);
    expect(counts.detail).toBe(1);
    expect(counts.macro).toBe(1);
    expect(counts.packaging).toBe(1);
    expect(counts.instagram).toBe(1);
    expect(plan.shots).toHaveLength(6);
  });

  it("stamps campaignId on every shot", () => {
    const plan = buildCampaignPlan({
      planId: "camp-x",
      recipeId: "sample-plate",
    });
    for (const s of plan.shots) expect(s.campaignId).toBe("camp-x");
  });

  it("names duplicates 1..N", () => {
    const plan = buildCampaignPlan({
      planId: "camp-3",
      recipeId: "full-launch",
    });
    const lifestyle = plan.shots.filter((s) => s.type === "lifestyle");
    expect(lifestyle).toHaveLength(4);
    expect(lifestyle.map((s) => s.name)).toEqual([
      "Lifestyle 1",
      "Lifestyle 2",
      "Lifestyle 3",
      "Lifestyle 4",
    ]);
  });

  it("emits dependency edges from parents to children", () => {
    const plan = buildCampaignPlan({
      planId: "c",
      recipeId: "sample-plate",
      makeShotId: (t, i) => `${t}-${i}`,
    });
    // Hero → Lifestyle, Detail, Packaging (per sample-plate)
    const heroEdges = plan.edges.filter((e) => e.from === "hero-0");
    const targets = new Set(heroEdges.map((e) => e.to));
    expect(targets.has("lifestyle-1")).toBe(true);
    expect(targets.has("detail-2")).toBe(true);
    expect(targets.has("packaging-4")).toBe(true);
  });

  it("throws on unknown recipe", () => {
    expect(() =>
      buildCampaignPlan({ planId: "x", recipeId: "not-real" }),
    ).toThrow(/Unknown recipe/);
  });
});

describe("plan graph helpers", () => {
  it("planRoots returns nodes with no incoming edges", () => {
    const plan = buildCampaignPlan({
      planId: "c",
      recipeId: "sample-plate",
      makeShotId: (t, i) => `${t}-${i}`,
    });
    const roots = planRoots(plan);
    expect(roots.map((r) => r.id)).toEqual(["hero-0"]);
  });

  it("planChildren returns downstream shots for a given parent", () => {
    const plan = buildCampaignPlan({
      planId: "c",
      recipeId: "sample-plate",
      makeShotId: (t, i) => `${t}-${i}`,
    });
    const kids = planChildren(plan, "hero-0");
    expect(kids.length).toBeGreaterThan(0);
    expect(kids.some((k) => k.id === "lifestyle-1")).toBe(true);
  });

  it("planParents returns upstream shots for a given child", () => {
    const plan = buildCampaignPlan({
      planId: "c",
      recipeId: "sample-plate",
      makeShotId: (t, i) => `${t}-${i}`,
    });
    const parents = planParents(plan, "macro-3");
    expect(parents.length).toBeGreaterThan(0);
    // Macro depends on Detail per the recipe
    expect(parents.some((p) => p.type === "detail")).toBe(true);
  });
});
