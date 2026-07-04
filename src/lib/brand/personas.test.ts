import { describe, expect, it } from "vitest";
import {
  addPersonaTag,
  emptyPersona,
  removePersonaTag,
  scorePersonaFit,
  updatePersona,
} from "./personas";

describe("emptyPersona", () => {
  it("has empty defaults", () => {
    const p = emptyPersona("p1");
    expect(p.goals).toEqual([]);
    expect(p.brandFit).toBe(60);
  });
});

describe("updatePersona", () => {
  it("patches + bumps updatedAt", () => {
    const before = emptyPersona("p1", 1);
    const after = updatePersona(before, { name: "Maya, 32" });
    expect(after.name).toBe("Maya, 32");
    expect(after.updatedAt).toBeGreaterThan(before.updatedAt);
  });
});

describe("addPersonaTag / removePersonaTag", () => {
  it("adds unique tags across supported fields", () => {
    let p = addPersonaTag(emptyPersona("p1"), "goals", "eat better");
    p = addPersonaTag(p, "goals", "eat better");
    p = addPersonaTag(p, "painPoints", "no time");
    expect(p.goals).toEqual(["eat better"]);
    expect(p.painPoints).toEqual(["no time"]);
    p = removePersonaTag(p, "goals", "eat better");
    expect(p.goals).toEqual([]);
  });
});

describe("scorePersonaFit", () => {
  it("nudges fit up when preferences match brand vocab", () => {
    const p = updatePersona(emptyPersona("p1"), {
      contentPreferences: ["editorial", "quiet"],
      visualPreferences: ["minimal"],
      brandFit: 60,
    });
    const on = scorePersonaFit(p, ["quiet", "minimal"]);
    const off = scorePersonaFit(p, ["loud", "chaotic"]);
    expect(on).toBeGreaterThan(off);
  });
  it("returns brandFit when vocabulary is empty", () => {
    const p = emptyPersona("p1");
    expect(scorePersonaFit(p, [])).toBe(60);
  });
});
