import { describe, expect, it } from "vitest";
import {
  applyDirectorAction,
  DIRECTOR_ACTIONS,
  directorSpec,
  type DirectorActionId,
} from "./story-director";

const SAMPLE =
  "This is a really cool new tool. It totally changes how we work every day. You are going to love it.";

describe("DIRECTOR_ACTIONS", () => {
  it("has 17 actions", () => {
    expect(DIRECTOR_ACTIONS).toHaveLength(17);
  });
  it("every action has a label + category + hint", () => {
    for (const a of DIRECTOR_ACTIONS) {
      expect(a.label).toBeTruthy();
      expect(a.hint).toBeTruthy();
      expect(a.category).toBeTruthy();
    }
  });
  it("directorSpec looks up by id", () => {
    expect(directorSpec("improve-hook").label).toBe("Improve hook");
  });
});

describe("applyDirectorAction", () => {
  it("returns a result with the required fields on every action", () => {
    for (const a of DIRECTOR_ACTIONS) {
      const r = applyDirectorAction(SAMPLE, a.id);
      expect(r.action).toBe(a.id);
      expect(r.before).toBe(SAMPLE);
      expect(r.after).toBeTruthy();
      expect(Array.isArray(r.changed)).toBe(true);
      expect(r.why).toBeTruthy();
      expect(Array.isArray(r.expected)).toBe(true);
      expect(typeof r.confidence).toBe("number");
    }
  });

  it("no-ops on empty input", () => {
    const r = applyDirectorAction("   ", "improve-hook");
    expect(r.confidence).toBe(0);
    expect(r.expected).toEqual([]);
  });

  it("make-conversational contracts formal phrasings", () => {
    const r = applyDirectorAction("You are going to love it.", "make-conversational");
    expect(r.after.toLowerCase()).toContain("you're");
  });

  it("corporate-voice removes contractions", () => {
    const r = applyDirectorAction("You're going to love it.", "corporate-voice");
    expect(r.after.toLowerCase()).toContain("you are");
  });

  it("make-minimal strips filler adverbs", () => {
    const r = applyDirectorAction(SAMPLE, "make-minimal");
    expect(r.after.toLowerCase()).not.toContain("really");
    expect(r.after.toLowerCase()).not.toContain("totally");
  });

  it("condense shortens and preserves punctuation", () => {
    const r = applyDirectorAction(SAMPLE, "condense");
    expect(r.after.length).toBeLessThan(SAMPLE.length);
    expect(/[.!?]$/.test(r.after)).toBe(true);
  });

  it("expand grows the copy with specificity", () => {
    const r = applyDirectorAction("The tool changed everything.", "expand");
    expect(r.after.length).toBeGreaterThan("The tool changed everything.".length);
  });

  it("increase-luxury replaces punchy vocab", () => {
    const r = applyDirectorAction("A big and cool product.", "increase-luxury");
    expect(r.after.toLowerCase()).toContain("considered");
    expect(r.after.toLowerCase()).toContain("quiet");
  });

  it("increase-retention appends a keep-watching promise", () => {
    const r = applyDirectorAction("Watch this.", "increase-retention");
    expect(r.after.toLowerCase()).toContain("keep going");
  });

  it("every id is reachable from the handler map", () => {
    const ids = DIRECTOR_ACTIONS.map((a) => a.id);
    const set = new Set<DirectorActionId>(ids);
    for (const id of set) {
      const r = applyDirectorAction("Hello.", id);
      expect(r.action).toBe(id);
    }
  });
});
