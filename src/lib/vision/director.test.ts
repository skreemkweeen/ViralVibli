import { describe, expect, it } from "vitest";
import { ACTIONS, applyDirectorAction, findAction } from "./director";

describe("Creative Director registry", () => {
  it("ships all 8 named actions", () => {
    expect(ACTIONS).toHaveLength(8);
    const ids = ACTIONS.map((a) => a.id);
    for (const id of [
      "cinematic",
      "luxury",
      "viral",
      "editorial",
      "premium",
      "emotional",
      "improve-composition",
      "conversion",
    ] as const) {
      expect(ids).toContain(id);
    }
  });

  it("findAction returns the spec or null", () => {
    expect(findAction("cinematic")?.label).toContain("cinematic");
    // @ts-expect-error unknown id
    expect(findAction("nope")).toBeNull();
  });
});

describe("applyDirectorAction", () => {
  it("appends cinematic descriptors that aren't already present", () => {
    const r = applyDirectorAction(
      "Editorial hero shot of a ceramic mug",
      "cinematic",
    );
    expect(r.changed.length).toBeGreaterThan(0);
    expect(r.prompt).toContain("35mm anamorphic");
    expect(r.action).toBe("cinematic");
  });

  it("is idempotent — running the same action twice adds nothing new", () => {
    const once = applyDirectorAction(
      "hero shot of a mug",
      "cinematic",
    );
    const twice = applyDirectorAction(once.prompt, "cinematic");
    expect(twice.changed).toEqual([]);
    expect(twice.prompt).toBe(once.prompt);
  });

  it("hoists composition descriptors to the front", () => {
    const r = applyDirectorAction(
      "warm brass hero shot",
      "improve-composition",
    );
    // rule of thirds should appear before "warm brass"
    const ruleIx = r.prompt.toLowerCase().indexOf("rule of thirds");
    const warmIx = r.prompt.toLowerCase().indexOf("warm brass");
    expect(ruleIx).toBeGreaterThanOrEqual(0);
    expect(warmIx).toBeGreaterThan(ruleIx);
  });

  it("strips negatives before layering — luxury removes 'cheap'", () => {
    const r = applyDirectorAction(
      "hero shot, cheap plastic, warm brass",
      "luxury",
    );
    expect(r.prompt.toLowerCase()).not.toContain("cheap");
    expect(r.prompt.toLowerCase()).not.toContain("plastic");
    expect(r.prompt.toLowerCase()).toContain("brass accents");
  });

  it("returns empty changed[] when every descriptor is already there", () => {
    const seeded =
      "existing prompt with strong focal hook and instant readability and high-contrast subject and unexpected color pop";
    const r = applyDirectorAction(seeded, "viral");
    expect(r.changed).toEqual([]);
  });

  it("handles an empty input prompt without crashing", () => {
    const r = applyDirectorAction("", "editorial");
    expect(r.changed.length).toBeGreaterThan(0);
    expect(r.prompt).toContain("negative space");
  });

  it("returns unchanged prompt for an unknown action", () => {
    const r = applyDirectorAction("hello", "nope" as unknown as "cinematic");
    expect(r.prompt).toBe("hello");
    expect(r.changed).toEqual([]);
  });

  it("preserves the original descriptors when appending", () => {
    const r = applyDirectorAction(
      "warm brass hero shot",
      "premium",
    );
    expect(r.prompt).toContain("warm brass hero shot");
  });
});
