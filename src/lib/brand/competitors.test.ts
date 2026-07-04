import { describe, expect, it } from "vitest";
import {
  addCompetitorTag,
  compareCompetitor,
  emptyCompetitor,
  removeCompetitorTag,
  updateCompetitor,
} from "./competitors";

describe("emptyCompetitor", () => {
  it("has empty defaults", () => {
    const c = emptyCompetitor("c1");
    expect(c.strengths).toEqual([]);
    expect(c.weaknesses).toEqual([]);
  });
});

describe("addCompetitorTag / removeCompetitorTag", () => {
  it("adds + removes uniques", () => {
    let c = addCompetitorTag(emptyCompetitor("c1"), "strengths", "brand recall");
    c = addCompetitorTag(c, "strengths", "brand recall");
    c = addCompetitorTag(c, "weaknesses", "slow shipping");
    expect(c.strengths).toEqual(["brand recall"]);
    expect(c.weaknesses).toEqual(["slow shipping"]);
    c = removeCompetitorTag(c, "strengths", "brand recall");
    expect(c.strengths).toEqual([]);
  });
});

describe("updateCompetitor", () => {
  it("patches + bumps updatedAt", () => {
    const before = emptyCompetitor("c1", 1);
    const after = updateCompetitor(before, { brand: "AesthetiCo" });
    expect(after.brand).toBe("AesthetiCo");
    expect(after.updatedAt).toBeGreaterThan(before.updatedAt);
  });
});

describe("compareCompetitor", () => {
  it("returns overlap + opportunity + risk", () => {
    const c = updateCompetitor(emptyCompetitor("c1"), {
      brand: "AesthetiCo",
      voice: "editorial quiet",
      messaging: "aspirational restraint",
      visualStyle: "minimal editorial",
      strengths: ["brand recall"],
      weaknesses: ["slow shipping"],
      positioning: "quiet luxury for design lovers",
    });
    const insight = compareCompetitor(
      ["editorial", "quiet"],
      "considered kitchenware",
      c,
    );
    expect(insight.competitorName).toBe("AesthetiCo");
    expect(insight.overlap).toContain("editorial");
    expect(insight.overlap).toContain("quiet");
    expect(insight.risk).toEqual(["brand recall"]);
    expect(insight.opportunity.some((o) => o.includes("slow shipping"))).toBe(true);
  });
});
