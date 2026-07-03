import { describe, expect, it } from "vitest";
import { emptySlide, type RichSlide } from "./story-slides";
import { narrationSeconds, predictStory, totalStorySeconds } from "./story-analytics";

const s = (id: string, index: number, patch: Partial<RichSlide> = {}): RichSlide => ({
  ...emptySlide(id, index),
  ...patch,
});

describe("predictStory", () => {
  it("returns 10 predictions with the required fields", () => {
    const preds = predictStory([s("a", 0)]);
    expect(preds).toHaveLength(10);
    for (const p of preds) {
      expect(typeof p.value).toBe("number");
      expect(p.label).toBeTruthy();
      expect(p.reason).toBeTruthy();
      expect(p.suggestedImprovement).toBeTruthy();
      expect(p.expectedLift).toBeTruthy();
      expect(p.confidence).toBeGreaterThan(0);
    }
  });

  it("completion drops as slide count grows", () => {
    const small = predictStory([s("a", 0)]).find((p) => p.id === "completion")!.value;
    const large = predictStory(
      Array.from({ length: 12 }, (_, i) => s(`s${i}`, i, { body: "a ".repeat(80) })),
    ).find((p) => p.id === "completion")!.value;
    expect(large).toBeLessThan(small);
  });

  it("replies rise with question stickers on question-capable platforms", () => {
    const bare = predictStory([s("a", 0)], { platform: "instagram" }).find(
      (p) => p.id === "replies",
    )!.value;
    const rich = predictStory(
      [s("a", 0, { question: { prompt: "Which one?" } })],
      { platform: "instagram" },
    ).find((p) => p.id === "replies")!.value;
    expect(rich).toBeGreaterThan(bare);
  });

  it("ctr rises with an urgent cta on the last slide", () => {
    const bare = predictStory([s("a", 0, { goal: "hook" })]).find((p) => p.id === "ctr")!.value;
    const withCta = predictStory([
      s("a", 0, { goal: "hook" }),
      s("b", 1, { goal: "cta", cta: { label: "Shop", style: "urgent" } }),
    ]).find((p) => p.id === "ctr")!.value;
    expect(withCta).toBeGreaterThan(bare);
  });

  it("exit rate rises when slides exceed platform word cap", () => {
    const heavy = Array(80).fill("word").join(" ");
    const low = predictStory([s("a", 0, { body: heavy })], { platform: "lemon8" }).find(
      (p) => p.id === "exit-rate",
    )!.value;
    const high = predictStory([s("a", 0, { body: heavy })], { platform: "tiktok" }).find(
      (p) => p.id === "exit-rate",
    )!.value;
    expect(high).toBeGreaterThan(low);
  });
});

describe("time helpers", () => {
  it("narrationSeconds derives from voiceover / body words at 140 wpm", () => {
    const list = [s("a", 0, { voiceover: Array(140).fill("word").join(" ") })];
    expect(narrationSeconds(list)).toBeCloseTo(60, -1);
  });

  it("totalStorySeconds sums the durations", () => {
    const list = [
      s("a", 0, { duration: 5 }),
      s("b", 1, { duration: 8 }),
    ];
    expect(totalStorySeconds(list)).toBe(13);
  });
});
