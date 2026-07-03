import { describe, expect, it } from "vitest";
import {
  assembleBriefFull,
  assembleBriefLine,
  emptyCreativeBrief,
  isBriefEmpty,
  mergeBrief,
} from "./brief";

describe("Creative Brief", () => {
  it("empty brief is detected as empty", () => {
    expect(isBriefEmpty(emptyCreativeBrief)).toBe(true);
  });

  it("brief with only whitespace still reads as empty", () => {
    expect(
      isBriefEmpty({
        ...emptyCreativeBrief,
        objective: "   ",
        audience: "\n\t",
      }),
    ).toBe(true);
  });

  it("brief with any real content is not empty", () => {
    expect(
      isBriefEmpty({ ...emptyCreativeBrief, objective: "Launch" }),
    ).toBe(false);
  });

  it("assembleBriefLine renders a compact one-liner with prepositions", () => {
    const line = assembleBriefLine({
      ...emptyCreativeBrief,
      objective: "Announce spring launch",
      audience: "skincare enthusiasts",
      platform: "instagram",
      visualKeywords: "warm brass, oat, matte ceramic",
    });
    expect(line).toBe(
      "Announce spring launch for skincare enthusiasts on instagram — warm brass, oat, matte ceramic",
    );
  });

  it("assembleBriefLine gracefully drops missing fields", () => {
    expect(
      assembleBriefLine({
        ...emptyCreativeBrief,
        objective: "Launch",
      }),
    ).toBe("Launch");
  });

  it("assembleBriefLine returns empty string for an empty brief", () => {
    expect(assembleBriefLine(emptyCreativeBrief)).toBe("");
  });

  it("assembleBriefFull labels each populated field on its own line", () => {
    const out = assembleBriefFull({
      ...emptyCreativeBrief,
      objective: "Launch",
      audience: "creators",
      constraints: "no neon",
    });
    expect(out).toContain("Objective: Launch");
    expect(out).toContain("Audience: creators");
    expect(out).toContain("Constraints: no neon");
    expect(out.split("\n").length).toBe(3);
  });

  it("assembleBriefFull skips blank fields", () => {
    const out = assembleBriefFull({
      ...emptyCreativeBrief,
      objective: "Launch",
      audience: "   ", // whitespace only should drop
    });
    expect(out).toBe("Objective: Launch");
  });

  it("mergeBrief returns a new object without mutating input", () => {
    const before = { ...emptyCreativeBrief, objective: "A" };
    const after = mergeBrief(before, { objective: "B" });
    expect(after.objective).toBe("B");
    expect(before.objective).toBe("A");
    expect(after).not.toBe(before);
  });

  it("mergeBrief ignores non-string values", () => {
    const before = { ...emptyCreativeBrief, objective: "A" };
    // Cast to satisfy TS since Partial<CreativeBrief> has only strings
    const after = mergeBrief(before, {
      objective: 42 as unknown as string,
    });
    expect(after.objective).toBe("A");
  });
});
