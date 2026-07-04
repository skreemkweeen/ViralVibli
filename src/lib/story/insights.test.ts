import { describe, expect, it } from "vitest";
import {
  computeInsights,
  INSIGHT_METRICS,
  predictEngagement,
  PREDICTION_METRICS,
} from "./insights";
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

describe("predictEngagement", () => {
  const zero = {
    curiosity: 0,
    authority: 0,
    trust: 0,
    emotion: 0,
    urgency: 0,
    retention: 0,
    sales: 0,
  };

  it("is deterministic — same input produces same output", () => {
    const insights = {
      curiosity: 60,
      authority: 55,
      trust: 50,
      emotion: 65,
      urgency: 45,
      retention: 70,
      sales: 40,
    };
    const a = predictEngagement(insights);
    const b = predictEngagement(insights);
    expect(a).toEqual(b);
  });

  it("returns a range { low, expected, high } per metric with low ≤ expected ≤ high", () => {
    const insights = {
      curiosity: 60,
      authority: 55,
      trust: 50,
      emotion: 65,
      urgency: 45,
      retention: 70,
      sales: 40,
    };
    const p = predictEngagement(insights);
    for (const m of PREDICTION_METRICS) {
      expect(p[m].low).toBeLessThanOrEqual(p[m].expected);
      expect(p[m].expected).toBeLessThanOrEqual(p[m].high);
    }
  });

  it("clamps every metric within its unit's safe range", () => {
    const maxed = {
      curiosity: 100,
      authority: 100,
      trust: 100,
      emotion: 100,
      urgency: 100,
      retention: 100,
      sales: 100,
    };
    const p = predictEngagement(maxed);
    // Percent metrics never exceed 100
    expect(p.retention.high).toBeLessThanOrEqual(100);
    expect(p.completionRate.high).toBeLessThanOrEqual(100);
    // Per-1k metrics never exceed their defined ceilings
    expect(p.replies.high).toBeLessThanOrEqual(120);
    expect(p.clicks.high).toBeLessThanOrEqual(90);
    expect(p.shares.high).toBeLessThanOrEqual(80);
  });

  it("produces small but non-negative values for a zero-insight concept", () => {
    const p = predictEngagement(zero);
    for (const m of PREDICTION_METRICS) {
      expect(p[m].expected).toBeGreaterThanOrEqual(0);
      expect(p[m].low).toBeGreaterThanOrEqual(0);
    }
  });

  it("scales replies with curiosity + emotion", () => {
    const lo = predictEngagement({ ...zero, curiosity: 10, emotion: 10 });
    const hi = predictEngagement({ ...zero, curiosity: 90, emotion: 90 });
    expect(hi.replies.expected).toBeGreaterThan(lo.replies.expected);
  });

  it("scales clicks with sales + urgency", () => {
    const lo = predictEngagement({ ...zero, sales: 10, urgency: 10 });
    const hi = predictEngagement({ ...zero, sales: 90, urgency: 90 });
    expect(hi.clicks.expected).toBeGreaterThan(lo.clicks.expected);
  });

  it("scales shares with emotion + authority", () => {
    const lo = predictEngagement({ ...zero, emotion: 10, authority: 10 });
    const hi = predictEngagement({ ...zero, emotion: 90, authority: 90 });
    expect(hi.shares.expected).toBeGreaterThan(lo.shares.expected);
  });

  it("chains with computeInsights end-to-end without runtime errors", () => {
    const insights = computeInsights({
      id: "t",
      direction: {} as never,
      slides: [
        {
          slide: 1,
          copy: "Stop. This changes today.",
          visualSuggestion: "close-up",
          cta: "Shop the launch",
          stickerRecommendation: "Poll",
        },
      ],
      createdAt: 0,
      favorite: false,
    } as never);
    const predictions = predictEngagement(insights);
    for (const m of PREDICTION_METRICS) {
      expect(Number.isFinite(predictions[m].expected)).toBe(true);
    }
  });
});
