import { describe, expect, it } from "vitest";
import { emptyDirection } from "./prompt";
import { scorePrompt, type DirectorScorecard } from "./director-scores";

function scoreOf(sc: DirectorScorecard, id: string): number {
  return sc.axes.find((a) => a.id === id)!.score;
}

describe("scorePrompt", () => {
  it("returns 7 axes with headline + weakest", () => {
    const sc = scorePrompt(emptyDirection, "");
    expect(sc.axes).toHaveLength(7);
    const ids = sc.axes.map((a) => a.id);
    expect(ids).toContain("creative");
    expect(ids).toContain("commercial");
    expect(ids).toContain("luxury");
    expect(ids).toContain("virality");
    expect(ids).toContain("editorial");
    expect(ids).toContain("brand-consistency");
    expect(ids).toContain("product-focus");
    expect(sc.headline).toBeTruthy();
    expect(sc.weakest).toBeTruthy();
  });

  it("scores luxury higher for Aesop-style direction", () => {
    const luxe = scorePrompt(
      { ...emptyDirection, style: "luxe", material: "marble", mood: "refined" },
      "editorial minimal marble luxury premium restraint quiet",
    );
    const baseline = scorePrompt(emptyDirection, "");
    expect(scoreOf(luxe, "luxury")).toBeGreaterThan(scoreOf(baseline, "luxury"));
  });

  it("scores virality higher for 9:16 punchy directions", () => {
    const viral = scorePrompt(
      { ...emptyDirection, aspect: "9-16", mood: "energetic", style: "bold" },
      "bold saturated candid handheld punchy",
    );
    const baseline = scorePrompt(emptyDirection, "");
    expect(scoreOf(viral, "virality")).toBeGreaterThan(
      scoreOf(baseline, "virality"),
    );
  });

  it("scores editorial higher when render is Editorial print", () => {
    const editorial = scorePrompt(
      { ...emptyDirection, render: "editorial-print", style: "editorial" },
      "editorial magazine art-directed negative space cinematic film moody grain",
    );
    const baseline = scorePrompt(emptyDirection, "");
    expect(scoreOf(editorial, "editorial")).toBeGreaterThan(
      scoreOf(baseline, "editorial"),
    );
  });

  it("scores commercial higher with softbox + centered composition", () => {
    const commercial = scorePrompt(
      { ...emptyDirection, lighting: "softbox", composition: "centered", quality: "ultra" },
      "product packaging clean centered softbox studio matte hero",
    );
    const baseline = scorePrompt(emptyDirection, "");
    expect(scoreOf(commercial, "commercial")).toBeGreaterThan(
      scoreOf(baseline, "commercial"),
    );
  });

  it("scores product focus higher with concrete subject + material", () => {
    const focused = scorePrompt(
      {
        ...emptyDirection,
        subject: "hand-thrown ceramic mug",
        material: "ceramic",
        composition: "closeup",
      },
      "product detail macro closeup material texture sharp",
    );
    const baseline = scorePrompt(emptyDirection, "");
    expect(scoreOf(focused, "product-focus")).toBeGreaterThan(
      scoreOf(baseline, "product-focus"),
    );
  });

  it("headline points to the highest axis", () => {
    const sc = scorePrompt(
      { ...emptyDirection, style: "luxe", material: "marble", mood: "refined" },
      "editorial luxe polished considered marble linen restraint quiet elegant",
    );
    const max = Math.max(...sc.axes.map((a) => a.score));
    expect(sc.axes.find((a) => a.id === sc.headline)!.score).toBe(max);
  });

  it("weakest points to the lowest axis", () => {
    const sc = scorePrompt(emptyDirection, "");
    const min = Math.min(...sc.axes.map((a) => a.score));
    expect(sc.axes.find((a) => a.id === sc.weakest)!.score).toBe(min);
  });

  it("supplies improve suggestions where the score is low", () => {
    const sc = scorePrompt(emptyDirection, "");
    for (const a of sc.axes) {
      if (a.score < 50) expect(a.improve).toBeTruthy();
    }
  });
});
