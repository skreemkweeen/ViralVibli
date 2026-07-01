import { describe, expect, it } from "vitest";
import { computeInsights, INSIGHT_METRICS } from "./insights";
import type { StoryConcept } from "@/lib/story/types";
import type { StorySlide } from "@/lib/ai/types";

function concept(slides: StorySlide[]): StoryConcept {
  return {
    id: "test",
    label: undefined,
    direction: {
      subject: "",
      framework: "aida",
      platform: "instagram",
      length: "medium",
      audience: null,
      goal: null,
      voice: null,
      tone: null,
      hookStrength: null,
      visualDirection: null,
      ctaStyle: null,
      postingSchedule: null,
      campaignObjective: null,
    },
    slides,
    createdAt: 0,
    favorite: false,
  } as unknown as StoryConcept;
}

function slide(patch: Partial<StorySlide>): StorySlide {
  return {
    slide: 1,
    copy: "",
    visualSuggestion: "",
    ...patch,
  };
}

describe("computeInsights", () => {
  it("returns zero across every metric for an empty concept", () => {
    const result = computeInsights(concept([]));
    for (const m of INSIGHT_METRICS) {
      expect(result[m]).toBe(0);
    }
  });

  it("clamps every metric to 0..100", () => {
    // Cram every trigger into one heavy slide
    const s = slide({
      copy: "Stop. Wait. Nobody tells you why this is wrong. Notice today.",
      cta: "Shop now, buy today, get yours before it's gone",
      stickerRecommendation: "Poll: are you ready?",
      speakerNotes: "Framework, system, proven, professional, data, study, research.",
    });
    const result = computeInsights(concept([s, s, s, s, s, s, s]));
    for (const m of INSIGHT_METRICS) {
      expect(result[m]).toBeGreaterThanOrEqual(0);
      expect(result[m]).toBeLessThanOrEqual(100);
    }
  });

  it("rewards a strong hook on slide 1 with curiosity", () => {
    const weak = computeInsights(
      concept([slide({ copy: "This is a caption about mugs." })]),
    );
    const strong = computeInsights(
      concept([slide({ copy: "Stop. You have been doing this wrong." })]),
    );
    expect(strong.curiosity).toBeGreaterThan(weak.curiosity);
  });

  it("rewards authority signals when slides carry framework vocabulary", () => {
    const plain = computeInsights(
      concept([
        slide({ copy: "A caption about our newest release." }),
        slide({ copy: "Another slide with some vibes." }),
      ]),
    );
    const authoritative = computeInsights(
      concept([
        slide({
          copy: "A 3-part framework tested across 240 studies with senior directors.",
        }),
        slide({
          copy: "Data from proven research shows the professional pattern.",
        }),
      ]),
    );
    expect(authoritative.authority).toBeGreaterThan(plain.authority);
  });

  it("rewards sales when CTAs and shop verbs appear", () => {
    const dry = computeInsights(
      concept([slide({ copy: "Some product exists." })]),
    );
    const salesy = computeInsights(
      concept([
        slide({ copy: "Meet the new drop." }),
        slide({
          copy: "Shop today.",
          cta: "Shop now — link in bio",
        }),
      ]),
    );
    expect(salesy.sales).toBeGreaterThan(dry.sales);
  });

  it("rewards retention for ideally paced sequences (5–9 slides)", () => {
    const long = computeInsights(
      concept(Array.from({ length: 20 }, () => slide({ copy: "you you you" }))),
    );
    const paced = computeInsights(
      concept(
        Array.from({ length: 7 }, () =>
          slide({
            copy: "you should notice this",
            stickerRecommendation: "Poll",
          }),
        ),
      ),
    );
    expect(paced.retention).toBeGreaterThan(long.retention);
  });
});
