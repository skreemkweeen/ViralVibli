/**
 * Story Inspector — 15-dimension deterministic diagnostic pass over a
 * slide-deck. Every dimension returns a 0-100 score plus reason,
 * recommendation, and (where relevant) suggested fix.
 *
 * Grounded in signals derived from the slides + the story's target
 * platform. No AI round-trip.
 */

import type { RichSlide, SlideEmotion, SlideGoal } from "./story-slides";
import { totalDurationSeconds } from "./story-slides";

// ─── Types ────────────────────────────────────────────────────────────────

export type StoryDimensionId =
  | "hook"
  | "curiosity"
  | "trust"
  | "authority"
  | "emotion"
  | "retention"
  | "flow"
  | "pacing"
  | "cta"
  | "sales"
  | "brand-consistency"
  | "platform-fit"
  | "accessibility"
  | "reading-time"
  | "visual-balance";

export type StoryDimensionScore = {
  id: StoryDimensionId;
  label: string;
  score: number;
  reason: string;
  recommendation: string;
  fix?: string;
};

export type StoryInspection = {
  overall: number;
  dimensions: StoryDimensionScore[];
};

export type InspectOptions = {
  platform?: string;
  brandVocabulary?: string[];
};

// ─── Utility ─────────────────────────────────────────────────────────────

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const wordCount = (s?: string) => (s ? s.split(/\s+/).filter(Boolean).length : 0);

function contains(text: string, needles: string[]): number {
  const t = text.toLowerCase();
  return needles.filter((n) => t.includes(n)).length;
}

const HOOK_VOCAB = [
  "you",
  "why",
  "how",
  "what",
  "stop",
  "wait",
  "nobody",
  "imagine",
  "notice",
];
const CURIOSITY_VOCAB = ["most people", "here's what", "secret", "the reason", "why", "before you"];
const TRUST_VOCAB = ["honestly", "real", "small", "hand", "care", "no filter", "quiet"];
const AUTHORITY_VOCAB = ["framework", "years", "study", "proven", "system", "research", "data"];
const EMOTION_VOCAB = ["feel", "love", "hate", "afraid", "hurt", "proud", "grateful"];

// ─── Per-dimension inspectors ───────────────────────────────────────────

function inspectHook(slides: RichSlide[]): StoryDimensionScore {
  const first = slides[0];
  if (!first) {
    return {
      id: "hook",
      label: "Hook",
      score: 0,
      reason: "No first slide.",
      recommendation: "Write a hook that stops the scroll.",
      fix: "Add a slide 1 with a pattern-interrupt opener.",
    };
  }
  const text = `${first.title} ${first.body}`.toLowerCase();
  const hits = contains(text, HOOK_VOCAB);
  const short = wordCount(first.title) <= 8;
  const goalIsHook = first.goal === "hook";
  const score = clamp(30 + hits * 8 + (short ? 15 : 0) + (goalIsHook ? 10 : 0));
  return {
    id: "hook",
    label: "Hook",
    score,
    reason:
      hits === 0
        ? "The opener doesn't use any of the classic hook triggers."
        : `${hits} hook trigger(s) detected in slide 1.`,
    recommendation:
      score >= 75 ? "Strong opener — leave it alone." : "Rework slide 1 to lead with a question or 'you' address.",
    fix: !short ? "Tighten the title to ≤8 words." : undefined,
  };
}

function inspectCuriosity(slides: RichSlide[]): StoryDimensionScore {
  const joined = slides.map((s) => `${s.title} ${s.body}`).join(" ").toLowerCase();
  const hits = contains(joined, CURIOSITY_VOCAB);
  const score = clamp(35 + hits * 12);
  return {
    id: "curiosity",
    label: "Curiosity",
    score,
    reason: `${hits} curiosity-gap phrase(s) across the deck.`,
    recommendation: score >= 70 ? "The gap is open." : "Delay the payoff with 'most people miss this' phrasing.",
    fix: score < 55 ? "Add a 'here's what nobody tells you' beat in slide 2." : undefined,
  };
}

function inspectTrust(slides: RichSlide[], opts: InspectOptions): StoryDimensionScore {
  const joined = slides.map((s) => `${s.title} ${s.body}`).join(" ").toLowerCase();
  const hits = contains(joined, TRUST_VOCAB);
  const brandHits = (opts.brandVocabulary ?? [])
    .map((v) => v.toLowerCase())
    .filter((v) => joined.includes(v)).length;
  const score = clamp(30 + hits * 10 + brandHits * 5);
  return {
    id: "trust",
    label: "Trust",
    score,
    reason: `${hits} trust marker(s); ${brandHits} brand vocabulary match(es).`,
    recommendation: score >= 75 ? "Feels honest." : "Add a candid line ('honestly?') to lower the wall.",
    fix: hits === 0 ? "Sprinkle in a 'small', 'quiet' or 'real' anywhere in slides 2-3." : undefined,
  };
}

function inspectAuthority(slides: RichSlide[]): StoryDimensionScore {
  const joined = slides.map((s) => `${s.title} ${s.body}`).join(" ").toLowerCase();
  const hits = contains(joined, AUTHORITY_VOCAB);
  const score = clamp(30 + hits * 12);
  return {
    id: "authority",
    label: "Authority",
    score,
    reason: `${hits} credibility signal(s) detected.`,
    recommendation: score >= 70 ? "Read as expert." : "Cite a framework, number of years, or data point.",
    fix: hits === 0 ? "Add one specific credential line early." : undefined,
  };
}

function inspectEmotion(slides: RichSlide[]): StoryDimensionScore {
  const joined = slides.map((s) => `${s.title} ${s.body}`).join(" ").toLowerCase();
  const hits = contains(joined, EMOTION_VOCAB);
  const emotionSet = new Set<SlideEmotion>(slides.map((s) => s.emotion));
  const score = clamp(35 + hits * 8 + emotionSet.size * 4);
  return {
    id: "emotion",
    label: "Emotion",
    score,
    reason: `${hits} felt word(s); ${emotionSet.size} emotion beat(s) declared across slides.`,
    recommendation:
      score >= 75 ? "Emotionally alive." : "Name a specific feeling somewhere in the deck.",
    fix: hits === 0 ? "Add a felt line: 'honestly, it hurt' — or the equivalent." : undefined,
  };
}

function inspectRetention(slides: RichSlide[]): StoryDimensionScore {
  const promises = slides.filter((s) =>
    /keep going|by the end|last slide|save this|part 2/i.test(`${s.title} ${s.body}`),
  ).length;
  const goalDist = new Set<SlideGoal>(slides.map((s) => s.goal)).size;
  const score = clamp(35 + promises * 15 + goalDist * 5);
  return {
    id: "retention",
    label: "Retention",
    score,
    reason: `${promises} keep-watching promise(s); ${goalDist} distinct slide goal(s).`,
    recommendation:
      score >= 70 ? "Retention levers in place." : "Add a 'by the end you'll…' promise near the top.",
    fix: promises === 0 ? "Add a promise line in slide 1 or 2." : undefined,
  };
}

function inspectFlow(slides: RichSlide[]): StoryDimensionScore {
  // Flow rewards a mix of goals in a sensible order: hook → context → reveal → cta.
  if (slides.length < 2) {
    return {
      id: "flow",
      label: "Flow",
      score: slides.length === 1 ? 40 : 0,
      reason: "Not enough slides to measure flow.",
      recommendation: "Add supporting slides.",
    };
  }
  const goals = slides.map((s) => s.goal);
  const startsWithHook = goals[0] === "hook";
  const endsWithCta = goals[goals.length - 1] === "cta";
  const hasVariety = new Set(goals).size >= 3;
  const score = clamp((startsWithHook ? 40 : 20) + (endsWithCta ? 30 : 10) + (hasVariety ? 30 : 10));
  return {
    id: "flow",
    label: "Flow",
    score,
    reason: `Starts with ${goals[0]}, ends with ${goals[goals.length - 1]}.`,
    recommendation:
      score >= 75 ? "Structured shape." : "Anchor slide 1 as 'hook' and last slide as 'cta'.",
    fix: !endsWithCta ? "Set the last slide's goal to 'cta'." : undefined,
  };
}

function inspectPacing(slides: RichSlide[]): StoryDimensionScore {
  // Pacing rewards each slide having ≤ 60 words and duration in [3, 12]s.
  const overlong = slides.filter((s) => wordCount(s.body) > 60).length;
  const badDuration = slides.filter((s) => s.duration < 3 || s.duration > 12).length;
  const score = clamp(90 - overlong * 12 - badDuration * 10);
  return {
    id: "pacing",
    label: "Pacing",
    score,
    reason: `${overlong} slide(s) exceed 60 words; ${badDuration} slide(s) out of [3, 12]s duration.`,
    recommendation:
      score >= 75 ? "Pacing feels right." : "Cap each slide at ~60 words and hold each for 3-12s.",
    fix: overlong > 0 ? "Split any slide over 60 words." : undefined,
  };
}

function inspectCTA(slides: RichSlide[]): StoryDimensionScore {
  const ctaSlides = slides.filter((s) => !!s.cta);
  const last = slides[slides.length - 1];
  const lastHasCta = !!last?.cta;
  const many = ctaSlides.length > 2;
  const score = clamp(
    (lastHasCta ? 60 : 20) + (ctaSlides.length > 0 ? 25 : 0) - (many ? 15 : 0),
  );
  return {
    id: "cta",
    label: "CTA",
    score,
    reason: `${ctaSlides.length} CTA(s); ${lastHasCta ? "last slide has a CTA" : "no CTA on the final slide"}.`,
    recommendation:
      score >= 70 ? "One clear ask — good." : "Add exactly one CTA on the final slide.",
    fix: !lastHasCta ? "Attach a CTA to the last slide." : undefined,
  };
}

function inspectSales(slides: RichSlide[]): StoryDimensionScore {
  const joined = slides.map((s) => `${s.title} ${s.body}`).join(" ").toLowerCase();
  const evidence = contains(joined, [
    "before",
    "after",
    "result",
    "saved",
    "$",
    "%",
    "in 30 days",
    "in a week",
    "students",
    "customers",
  ]);
  const score = clamp(30 + evidence * 8);
  return {
    id: "sales",
    label: "Sales",
    score,
    reason: `${evidence} evidence marker(s) supporting the offer.`,
    recommendation:
      score >= 70 ? "Sales feel earned." : "Add specific outcomes or numbers.",
    fix: evidence === 0 ? "Cite a concrete before/after or number." : undefined,
  };
}

function inspectBrandConsistency(
  slides: RichSlide[],
  opts: InspectOptions,
): StoryDimensionScore {
  const vocab = (opts.brandVocabulary ?? []).map((v) => v.toLowerCase()).filter((v) => v.length > 3);
  const joined = slides.map((s) => `${s.title} ${s.body}`).join(" ").toLowerCase();
  if (vocab.length === 0) {
    return {
      id: "brand-consistency",
      label: "Brand consistency",
      score: 60,
      reason: "No brand vocabulary provided.",
      recommendation: "Set brand personality / visual keywords in the brief.",
    };
  }
  const hits = vocab.filter((v) => joined.includes(v)).length;
  const score = clamp((hits / vocab.length) * 100);
  return {
    id: "brand-consistency",
    label: "Brand consistency",
    score,
    reason: `${hits} of ${vocab.length} brand vocabulary word(s) present.`,
    recommendation:
      score >= 70 ? "On-brand." : "Weave in more brand vocabulary in slides 2-3.",
    fix: hits === 0 ? "Add at least one brand word to the deck." : undefined,
  };
}

const PLATFORM_MAX_WORDS: Record<string, number> = {
  instagram: 50,
  lemon8: 80,
  tiktok: 40,
  pinterest: 90,
  facebook: 80,
  threads: 45,
};

function inspectPlatformFit(
  slides: RichSlide[],
  opts: InspectOptions,
): StoryDimensionScore {
  const platform = (opts.platform ?? "instagram").toLowerCase();
  const max = PLATFORM_MAX_WORDS[platform] ?? 60;
  const violations = slides.filter((s) => wordCount(s.body) > max).length;
  const score = clamp(90 - violations * 12);
  return {
    id: "platform-fit",
    label: "Platform fit",
    score,
    reason: `${violations} slide(s) exceed the recommended ${max}-word cap for ${platform}.`,
    recommendation: score >= 75 ? `Fits ${platform}.` : `Trim slides for ${platform}.`,
    fix: violations > 0 ? `Cap each slide body at ${max} words.` : undefined,
  };
}

function inspectAccessibility(slides: RichSlide[]): StoryDimensionScore {
  const missingVoiceover = slides.filter((s) => !s.voiceover).length;
  const missingAlt = slides.filter((s) => !s.visual).length;
  const score = clamp(90 - missingVoiceover * 6 - missingAlt * 4);
  return {
    id: "accessibility",
    label: "Accessibility",
    score,
    reason: `${missingVoiceover} slide(s) without voiceover; ${missingAlt} slide(s) without a visual description.`,
    recommendation:
      score >= 75 ? "Captions and visual notes covered." : "Add voiceover text to every slide for captions.",
    fix: missingVoiceover > 0 ? "Set voiceover text on every slide." : undefined,
  };
}

function inspectReadingTime(slides: RichSlide[]): StoryDimensionScore {
  const total = slides.reduce((n, s) => n + wordCount(s.body), 0);
  const duration = totalDurationSeconds(slides);
  // Target ~140 words per minute of narrated content.
  const readableMinutes = total / 140;
  const durationMinutes = duration / 60;
  const ratio = durationMinutes > 0 ? readableMinutes / durationMinutes : 1;
  // Ratio ~1 is ideal. <0.7 = too little copy, >1.4 = too much for the duration.
  let score = 80;
  if (ratio < 0.7 || ratio > 1.4) score -= 30;
  if (ratio < 0.4 || ratio > 1.8) score -= 25;
  return {
    id: "reading-time",
    label: "Reading time",
    score: clamp(score),
    reason: `~${total} words over ${duration}s → ratio ${ratio.toFixed(2)}.`,
    recommendation:
      ratio > 1.4
        ? "Trim copy or extend slide durations."
        : ratio < 0.7
          ? "Add more copy or shorten slide durations."
          : "Balanced for narration.",
  };
}

function inspectVisualBalance(slides: RichSlide[]): StoryDimensionScore {
  const withVisual = slides.filter((s) => !!s.visual || !!s.visionConceptId).length;
  const withAnim = slides.filter((s) => s.animation !== "none").length;
  const total = slides.length || 1;
  const visualRatio = withVisual / total;
  const animRatio = withAnim / total;
  const score = clamp(30 + visualRatio * 50 + animRatio * 20);
  return {
    id: "visual-balance",
    label: "Visual balance",
    score,
    reason: `${withVisual}/${total} slide(s) have a visual; ${withAnim}/${total} have animation.`,
    recommendation:
      score >= 75 ? "Visually rich." : "Attach a visual direction to more slides.",
    fix: withVisual < total ? "Give every slide a visual note or Vision concept." : undefined,
  };
}

// ─── Public entry ───────────────────────────────────────────────────────

export function inspectStory(
  slides: RichSlide[],
  opts: InspectOptions = {},
): StoryInspection {
  const dims: StoryDimensionScore[] = [
    inspectHook(slides),
    inspectCuriosity(slides),
    inspectTrust(slides, opts),
    inspectAuthority(slides),
    inspectEmotion(slides),
    inspectRetention(slides),
    inspectFlow(slides),
    inspectPacing(slides),
    inspectCTA(slides),
    inspectSales(slides),
    inspectBrandConsistency(slides, opts),
    inspectPlatformFit(slides, opts),
    inspectAccessibility(slides),
    inspectReadingTime(slides),
    inspectVisualBalance(slides),
  ];
  const overall = clamp(dims.reduce((n, d) => n + d.score, 0) / dims.length);
  return { overall, dimensions: dims };
}
