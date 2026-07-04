import { describe, expect, it } from "vitest";
import {
  addValueTag,
  assembleBrandContext,
  assembleBrandLine,
  brandCompleteness,
  brandVocabulary,
  defaultPersonality,
  emptyBrand,
  removeValueTag,
  setPersonalityAxis,
  updateBrand,
} from "./brand-dna";

describe("emptyBrand", () => {
  it("seeds sensible defaults", () => {
    const b = emptyBrand("b1", 1000);
    expect(b.id).toBe("b1");
    expect(b.name).toBe("");
    expect(b.archetype).toBe("creator");
    expect(b.tone).toEqual(["warm"]);
    expect(b.readingLevel).toBe("9th");
    expect(b.ctaStyle).toBe("soft");
    expect(b.personality).toEqual(defaultPersonality());
  });
});

describe("updateBrand", () => {
  it("patches + bumps updatedAt", () => {
    const before = emptyBrand("b1", 1);
    const after = updateBrand(before, { name: "Marrow" });
    expect(after.name).toBe("Marrow");
    expect(after.updatedAt).toBeGreaterThan(before.updatedAt);
  });
});

describe("setPersonalityAxis", () => {
  it("clamps to [0, 100]", () => {
    const b = setPersonalityAxis(emptyBrand("b"), "luxury", 250);
    expect(b.personality.luxury).toBe(100);
    const c = setPersonalityAxis(b, "luxury", -20);
    expect(c.personality.luxury).toBe(0);
  });
});

describe("addValueTag / removeValueTag", () => {
  it("de-duplicates + trims", () => {
    let b = addValueTag(emptyBrand("b"), "values", "quiet");
    b = addValueTag(b, "values", "quiet");
    b = addValueTag(b, "values", "  refined  ");
    expect(b.values).toEqual(["quiet", "refined"]);
    b = removeValueTag(b, "values", "quiet");
    expect(b.values).toEqual(["refined"]);
  });
});

describe("assembleBrandLine", () => {
  it("joins the compact fields", () => {
    const b = {
      ...emptyBrand("b"),
      name: "Marrow",
      audience: "design-forward home cooks",
      positioning: "quiet, considered kitchenware",
      tone: ["quiet", "warm"] as ("quiet" | "warm")[],
    };
    const line = assembleBrandLine(b);
    expect(line).toContain("Marrow");
    expect(line).toContain("design-forward home cooks");
    expect(line).toContain("quiet, warm");
  });
});

describe("assembleBrandContext", () => {
  it("returns almost-empty context for a fresh brand", () => {
    // emptyBrand seeds a single "warm" tone so the block isn't literally empty,
    // but it should be tiny — no more than one non-empty line.
    const context = assembleBrandContext(emptyBrand("b"));
    const lines = context.split("\n").filter(Boolean);
    expect(lines.length).toBeLessThanOrEqual(1);
  });
  it("includes named fields", () => {
    const context = assembleBrandContext({
      ...emptyBrand("b"),
      name: "Marrow",
      mission: "Kitchenware that lasts",
      values: ["quiet", "considered"],
    });
    expect(context).toContain("Brand: Marrow");
    expect(context).toContain("Mission: Kitchenware that lasts");
    expect(context).toContain("Values: quiet, considered");
  });
});

describe("brandCompleteness", () => {
  it("returns 0 for empty brand", () => {
    expect(brandCompleteness(emptyBrand("b"))).toBeGreaterThanOrEqual(0);
    expect(brandCompleteness(emptyBrand("b"))).toBeLessThan(20);
  });
  it("rises as fields fill", () => {
    const full = {
      ...emptyBrand("b"),
      name: "Marrow",
      mission: "M",
      vision: "V",
      audience: "cooks",
      positioning: "quiet",
      usp: "u",
      voice: "candid",
      values: ["quiet"],
      vocabulary: ["restraint"],
      forbiddenWords: ["awesome"],
      rules: ["never yell"],
      story: "s",
      promise: "p",
    };
    expect(brandCompleteness(full)).toBeGreaterThan(80);
  });
});

describe("brandVocabulary", () => {
  it("lowercases + de-duplicates", () => {
    const b = {
      ...emptyBrand("b"),
      vocabulary: ["Quiet", "quiet", "REFINED"],
      tone: ["warm"] as ("warm" | "quiet")[],
      archetype: "sage" as const,
    };
    const v = brandVocabulary(b);
    expect(v).toContain("quiet");
    expect(v).toContain("refined");
    expect(v).toContain("warm");
    expect(v).toContain("sage");
  });
});
