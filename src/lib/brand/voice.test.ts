import { describe, expect, it } from "vitest";
import { emptyBrand, addValueTag } from "./brand-dna";
import {
  analyseVoice,
  applyVoiceTransform,
  defaultVoiceProfile,
  readingGrade,
  voiceFromBrand,
} from "./voice";

describe("defaultVoiceProfile", () => {
  it("has sane starting numbers", () => {
    const p = defaultVoiceProfile();
    expect(p.sentenceLength).toBe(14);
    expect(p.readingLevel).toBe("9th");
    expect(p.humor).toBeGreaterThanOrEqual(0);
  });
});

describe("voiceFromBrand", () => {
  it("copies personality-derived numbers", () => {
    const brand = { ...emptyBrand("b"), voice: "candid", readingLevel: "college" as const };
    const p = voiceFromBrand(brand);
    expect(p.description).toBe("candid");
    expect(p.readingLevel).toBe("college");
  });
});

describe("analyseVoice", () => {
  it("penalises forbidden words", () => {
    const brand = addValueTag(emptyBrand("b"), "forbiddenWords", "awesome");
    const on = analyseVoice("A quiet, considered piece.", brand);
    const off = analyseVoice("This is awesome.", brand);
    expect(on.score).toBeGreaterThan(off.score);
    expect(off.forbiddenHits).toContain("awesome");
  });
  it("rewards preferred vocabulary", () => {
    const brand = addValueTag(emptyBrand("b"), "vocabulary", "quiet");
    const on = analyseVoice("A quiet, considered piece.", brand);
    const off = analyseVoice("A short unrelated line.", brand);
    expect(on.vocabHits).toContain("quiet");
    expect(on.score).toBeGreaterThan(off.score);
  });
});

describe("applyVoiceTransform", () => {
  it("increase-luxury swaps punchy vocab", () => {
    const r = applyVoiceTransform("Amazing and big product.", "increase-luxury");
    expect(r.after.toLowerCase()).toMatch(/quiet|considered|refined/);
    expect(r.confidence).toBeGreaterThan(0);
  });
  it("make-minimal strips filler", () => {
    const r = applyVoiceTransform("This is really very cool.", "make-minimal");
    expect(r.after.toLowerCase()).not.toContain("really");
    expect(r.after.toLowerCase()).not.toContain("very");
  });
  it("no-op on empty", () => {
    const r = applyVoiceTransform("   ", "increase-luxury");
    expect(r.confidence).toBe(0);
  });
});

describe("readingGrade", () => {
  it("returns a rough grade", () => {
    const g = readingGrade("The cat sat on the mat.");
    expect(g).toBeGreaterThan(-5);
    expect(g).toBeLessThan(20);
  });
  it("returns 0 for empty", () => {
    expect(readingGrade("")).toBe(0);
  });
});
