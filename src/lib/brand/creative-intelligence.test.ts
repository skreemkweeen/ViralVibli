import { describe, expect, it } from "vitest";
import { addValueTag, emptyBrand, updateBrand } from "./brand-dna";
import { defaultVisualLanguage } from "./visual-language";
import { emptyMemory, addPreference } from "@/lib/vision/creative-memory";
import {
  assembleAIContext,
  brandIntelligence,
  campaignIntelligence,
  memoryDigest,
  promptIntelligence,
} from "./creative-intelligence";

describe("brandIntelligence", () => {
  it("returns empties when brand is null", () => {
    const i = brandIntelligence(null, defaultVisualLanguage());
    expect(i.brandId).toBeNull();
    expect(i.vocabulary).toEqual([]);
  });
  it("returns brand + vocabulary when set", () => {
    const brand = updateBrand(emptyBrand("b"), { name: "Marrow" });
    const i = brandIntelligence(brand, defaultVisualLanguage());
    expect(i.brandName).toBe("Marrow");
    expect(i.primaryColor).toBe("#c8f04e");
  });
});

describe("promptIntelligence", () => {
  it("is empty for no brand", () => {
    expect(promptIntelligence(null)).toBe("");
  });
  it("names forbidden words + rules", () => {
    let brand = addValueTag(emptyBrand("b"), "forbiddenWords", "cheap");
    brand = addValueTag(brand, "rules", "always name the audience");
    const block = promptIntelligence(brand);
    expect(block).toContain("Never use: cheap");
    expect(block).toContain("Rules: always name the audience");
  });
});

describe("campaignIntelligence", () => {
  it("returns brand defaults", () => {
    const brand = updateBrand(emptyBrand("b"), {
      tone: ["quiet", "warm"] as never,
      ctaStyle: "soft",
      hookStyle: "curiosity",
      readingLevel: "college",
    });
    const c = campaignIntelligence(brand);
    expect(c.tone).toContain("quiet");
    expect(c.ctaStyle).toBe("soft");
    expect(c.readingLevel).toBe("college");
  });
});

describe("assembleAIContext", () => {
  it("combines brand + project + memory blocks", () => {
    let brand = updateBrand(emptyBrand("b"), { name: "Marrow" });
    brand = addValueTag(brand, "vocabulary", "quiet");
    let mem = emptyMemory();
    mem = addPreference(mem, "cameras", { id: "hb", label: "Hasselblad X2D", weight: 80 });
    const ctx = assembleAIContext({
      brand,
      visual: defaultVisualLanguage(),
      memory: mem,
      projectSummary: "Autumn Ceramic",
      campaignSummary: "Teaser week",
    });
    expect(ctx).toContain("BRAND CONTEXT");
    expect(ctx).toContain("Marrow");
    expect(ctx).toContain("PROJECT");
    expect(ctx).toContain("Autumn Ceramic");
    expect(ctx).toContain("CAMPAIGN");
    expect(ctx).toContain("CREATOR MEMORY");
    expect(ctx).toContain("Hasselblad");
  });
  it("returns the primary colour line when present", () => {
    const ctx = assembleAIContext({
      brand: null,
      visual: defaultVisualLanguage(),
      memory: emptyMemory(),
    });
    expect(ctx).toContain("PRIMARY COLOR");
  });
});

describe("memoryDigest", () => {
  it("returns empty string when memory is empty", () => {
    expect(memoryDigest(emptyMemory())).toBe("");
  });
});
