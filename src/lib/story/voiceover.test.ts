import { describe, expect, it } from "vitest";
import { fitsInDuration, planVoiceover, requiredWpm } from "./voiceover";

describe("planVoiceover", () => {
  it("counts words and produces per-word timings", () => {
    const plan = planVoiceover("hello there friend how are you");
    expect(plan.totalWords).toBe(6);
    expect(plan.wordTimings).toHaveLength(6);
    expect(plan.wordTimings[0]!.startAt).toBe(0);
    expect(plan.wordTimings[5]!.endAt).toBeGreaterThan(0);
  });

  it("scales timings to a target duration when provided", () => {
    const plan = planVoiceover("hello there friend how are you", {
      targetSeconds: 10,
    });
    expect(plan.totalSeconds).toBeGreaterThan(9);
    expect(plan.totalSeconds).toBeLessThan(12);
  });

  it("marks ALL-CAPS and *emphasised* words", () => {
    const plan = planVoiceover("this is HUGE and *important*");
    expect(plan.emphasis).toContain(2);
    expect(plan.emphasis).toContain(4);
  });

  it("emits breath markers after full-stop breaks past the interval", () => {
    const long = ("one two three four five six seven eight. ".repeat(5)).trim();
    const plan = planVoiceover(long, { breathEverySeconds: 2 });
    expect(plan.breaths.length).toBeGreaterThan(0);
  });

  it("groups words into caption chunks of ~40 chars", () => {
    const plan = planVoiceover(
      "hand thrown ceramic mug on stone shelf morning light long form paragraph",
    );
    for (const chunk of plan.captions) {
      expect(chunk.text.length).toBeLessThanOrEqual(50);
    }
  });
});

describe("read helpers", () => {
  it("fitsInDuration returns whether the plan fits", () => {
    const plan = planVoiceover("one two three four five", { targetSeconds: 5 });
    expect(fitsInDuration(plan, 6)).toBe(true);
    expect(fitsInDuration(plan, 2)).toBe(false);
  });

  it("requiredWpm derives the WPM needed for a duration", () => {
    expect(requiredWpm("one two three four", 4)).toBe(60);
    expect(requiredWpm("one two three four", 0)).toBe(0);
    expect(requiredWpm("", 5)).toBe(0);
  });
});
