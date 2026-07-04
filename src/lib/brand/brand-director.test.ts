import { describe, expect, it } from "vitest";
import { addValueTag, emptyBrand, updateBrand } from "./brand-dna";
import {
  applyBrandDirector,
  BRAND_DIRECTOR_ACTIONS,
  brandDirectorSpec,
} from "./brand-director";

const SAMPLE = "Really cool new tool that helps you get better very fast.";

describe("BRAND_DIRECTOR_ACTIONS", () => {
  it("has 12 actions", () => {
    expect(BRAND_DIRECTOR_ACTIONS).toHaveLength(12);
  });
  it("each has a label + hint + category", () => {
    for (const a of BRAND_DIRECTOR_ACTIONS) {
      expect(a.label).toBeTruthy();
      expect(a.hint).toBeTruthy();
      expect(a.category).toBeTruthy();
    }
  });
  it("brandDirectorSpec looks up by id", () => {
    expect(brandDirectorSpec("simplify").label).toBe("Simplify");
  });
});

describe("applyBrandDirector", () => {
  it("no-ops on empty", () => {
    const brand = emptyBrand("b");
    const r = applyBrandDirector("   ", "simplify", brand);
    expect(r.confidence).toBe(0);
    expect(r.expected).toEqual([]);
  });

  it("simplify strips filler", () => {
    const brand = emptyBrand("b");
    const r = applyBrandDirector(SAMPLE, "simplify", brand);
    expect(r.after.toLowerCase()).not.toContain("really");
    expect(r.after.toLowerCase()).not.toContain("very");
  });

  it("modernize swaps archaic vocabulary", () => {
    const brand = emptyBrand("b");
    const r = applyBrandDirector("We utilize in order to facilitate action.", "modernize", brand);
    expect(r.after.toLowerCase()).toContain("use");
    expect(r.after.toLowerCase()).toContain("to");
    expect(r.after.toLowerCase()).toContain("help");
  });

  it("improve-consistency removes forbidden words and weaves in brand words", () => {
    let brand = emptyBrand("b");
    brand = addValueTag(brand, "forbiddenWords", "cool");
    brand = addValueTag(brand, "vocabulary", "quiet");
    const r = applyBrandDirector("This is a cool product.", "improve-consistency", brand);
    expect(r.after.toLowerCase()).not.toContain("cool");
    expect(r.after.toLowerCase()).toContain("quiet");
  });

  it("differentiate anchors to USP when present", () => {
    const brand = updateBrand(emptyBrand("b"), {
      name: "Marrow",
      usp: "kilnfire ceramic in three colours",
    });
    const r = applyBrandDirector("Everyday mugs.", "differentiate", brand);
    expect(r.after.toLowerCase()).toContain("kilnfire ceramic in three colours");
  });

  it("strengthen-positioning uses brand.positioning when set", () => {
    const brand = updateBrand(emptyBrand("b"), {
      positioning: "The considered choice for design-forward cooks.",
    });
    const r = applyBrandDirector("Mugs for you.", "strengthen-positioning", brand);
    expect(r.after).toContain("considered choice");
  });

  it("increase-luxury delegates to voice engine", () => {
    const brand = emptyBrand("b");
    const r = applyBrandDirector("Amazing and big product.", "increase-luxury", brand);
    expect(r.after.toLowerCase()).toMatch(/quiet|considered|refined/);
    expect(r.confidence).toBeGreaterThan(0);
  });
});
