/**
 * Story Analytics prediction — 10 metrics predicted from the current
 * slide deck + target platform. Every prediction returns:
 *   - value: predicted number (percentage or count)
 *   - unit: "%" | "×" | "s" | "" for the value's meaning
 *   - reason: why this prediction, based on which signals
 *   - suggestedImprovement: one action that would move the number
 *   - expectedLift: how big the improvement would be
 *   - confidence: 0-100
 *
 * All predictions are deterministic heuristics — no ML model, no API.
 */

import { totalDurationSeconds, type RichSlide } from "./story-slides";
import { platformSpec, type StoryPlatformId } from "./story-platforms";

// ─── Types ────────────────────────────────────────────────────────────────

export type StoryMetricId =
  | "completion"
  | "retention"
  | "replies"
  | "shares"
  | "saves"
  | "ctr"
  | "exit-rate"
  | "swipe-away"
  | "tap-forward"
  | "tap-back";

export type StoryPrediction = {
  id: StoryMetricId;
  label: string;
  value: number;
  unit: "%" | "×" | "s" | "";
  reason: string;
  suggestedImprovement: string;
  expectedLift: string;
  confidence: number;
};

export type PredictOptions = {
  platform?: StoryPlatformId;
};

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(n)));
const wc = (s?: string) => (s ? s.split(/\s+/).filter(Boolean).length : 0);

// ─── Per-metric predictors ────────────────────────────────────────────────

function predictCompletion(slides: RichSlide[]): StoryPrediction {
  // Completion drops as slide count and per-slide word count grow.
  const total = slides.length || 1;
  const overlong = slides.filter((s) => wc(s.body) > 60).length;
  const withHook = slides[0]?.goal === "hook";
  const base = 78 - Math.max(0, total - 5) * 3 - overlong * 5 + (withHook ? 5 : -5);
  return {
    id: "completion",
    label: "Completion",
    value: clamp(base, 15, 92),
    unit: "%",
    reason: `${total} slides, ${overlong} above 60 words, ${withHook ? "hook opener" : "no hook opener"}.`,
    suggestedImprovement: withHook
      ? "Trim any slide over 60 words to protect completion."
      : "Set slide 1's goal to 'hook' and lead with a pattern-break line.",
    expectedLift: withHook ? "+3-5%" : "+8-12%",
    confidence: 72,
  };
}

function predictRetention(slides: RichSlide[]): StoryPrediction {
  // Retention: slides with 'keep going' promises + goal variety keep viewers.
  const promises = slides.filter((s) =>
    /keep going|by the end|last slide|save this|part 2/i.test(`${s.title} ${s.body}`),
  ).length;
  const variety = new Set(slides.map((s) => s.goal)).size;
  const base = 55 + promises * 10 + variety * 5;
  return {
    id: "retention",
    label: "Retention",
    value: clamp(base, 20, 95),
    unit: "%",
    reason: `${promises} promise line(s); ${variety} distinct goal(s).`,
    suggestedImprovement: promises === 0
      ? "Add a 'by the end you'll…' promise near the top."
      : "Vary slide goals — hook / teach / reveal / cta.",
    expectedLift: "+6-10%",
    confidence: 68,
  };
}

function predictReplies(slides: RichSlide[], opts: PredictOptions): StoryPrediction {
  const questions = slides.filter((s) => !!s.question).length;
  const polls = slides.filter((s) => !!s.poll).length;
  const platform = opts.platform ? platformSpec(opts.platform) : undefined;
  const bonus = platform?.supportsQuestions ? 5 : 0;
  const base = 25 + questions * 12 + polls * 8 + bonus;
  return {
    id: "replies",
    label: "Replies",
    value: clamp(base, 5, 92),
    unit: "%",
    reason: `${questions} question(s), ${polls} poll(s)${platform ? ` on ${platform.label}` : ""}.`,
    suggestedImprovement: questions === 0
      ? "Attach a question sticker to a mid-deck slide."
      : "Ask a specific 'this or that' rather than open-ended.",
    expectedLift: "+8-15%",
    confidence: 62,
  };
}

function predictShares(slides: RichSlide[]): StoryPrediction {
  const educational = slides.filter((s) => s.goal === "teach").length;
  const bold = slides.filter((s) => s.emotion === "bold" || s.emotion === "urgent").length;
  const base = 30 + educational * 8 + bold * 6;
  return {
    id: "shares",
    label: "Shares",
    value: clamp(base, 5, 82),
    unit: "%",
    reason: `${educational} teach slide(s); ${bold} bold/urgent beat(s).`,
    suggestedImprovement: "Add a share-worthy stat or quote in slide 2.",
    expectedLift: "+5-9%",
    confidence: 60,
  };
}

function predictSaves(slides: RichSlide[]): StoryPrediction {
  const teach = slides.filter((s) => s.goal === "teach").length;
  const total = slides.length || 1;
  const base = 25 + (teach / total) * 60;
  return {
    id: "saves",
    label: "Saves",
    value: clamp(base, 5, 90),
    unit: "%",
    reason: `${teach}/${total} slide(s) tagged 'teach'.`,
    suggestedImprovement: "Frame at least one slide as a checklist or step list.",
    expectedLift: "+8-14%",
    confidence: 66,
  };
}

function predictCTR(slides: RichSlide[]): StoryPrediction {
  const last = slides[slides.length - 1];
  const lastCta = !!last?.cta;
  const urgent = last?.cta?.style === "urgent";
  const base = 3 + (lastCta ? 5 : 0) + (urgent ? 3 : 0);
  return {
    id: "ctr",
    label: "CTR",
    value: Math.round(base * 10) / 10,
    unit: "%",
    reason: lastCta
      ? `Last slide has a ${last?.cta?.style ?? "soft"} CTA.`
      : "No CTA on the final slide.",
    suggestedImprovement: lastCta ? "Test an urgent CTA style." : "Attach a CTA to the last slide.",
    expectedLift: lastCta ? "+0.5-1.2%" : "+2-4%",
    confidence: 70,
  };
}

function predictExitRate(slides: RichSlide[], opts: PredictOptions): StoryPrediction {
  const platform = opts.platform ? platformSpec(opts.platform) : undefined;
  const max = platform?.maxWords ?? 60;
  const overs = slides.filter((s) => wc(s.body) > max).length;
  const base = 18 + overs * 6;
  return {
    id: "exit-rate",
    label: "Exit rate",
    value: clamp(base, 6, 74),
    unit: "%",
    reason: `${overs} slide(s) exceed the ${max}-word cap${platform ? ` for ${platform.label}` : ""}.`,
    suggestedImprovement: overs > 0 ? `Trim slides to ≤${max} words.` : "Keep hooks strong.",
    expectedLift: "−4-8% exit",
    confidence: 66,
  };
}

function predictSwipeAway(slides: RichSlide[]): StoryPrediction {
  const first = slides[0];
  const strongHook = first && (first.goal === "hook" || wc(first.title) <= 6);
  const base = 22 - (strongHook ? 6 : -6);
  return {
    id: "swipe-away",
    label: "Swipe away",
    value: clamp(base, 6, 62),
    unit: "%",
    reason: strongHook ? "Slide 1 hooks fast." : "Slide 1 doesn't hook fast enough.",
    suggestedImprovement: strongHook
      ? "Keep the visual bold on slide 1."
      : "Rework slide 1 with a 6-word or less title.",
    expectedLift: "−3-6%",
    confidence: 60,
  };
}

function predictTapForward(slides: RichSlide[]): StoryPrediction {
  // Higher tap-forward means viewers skim past. Long text-heavy slides
  // push it up.
  const heavy = slides.filter((s) => wc(s.body) > 70).length;
  const base = 40 + heavy * 6;
  return {
    id: "tap-forward",
    label: "Tap forward",
    value: clamp(base, 15, 80),
    unit: "%",
    reason: `${heavy} text-heavy slide(s).`,
    suggestedImprovement: "Break text-heavy slides into two shorter ones.",
    expectedLift: "−4-8% skip",
    confidence: 58,
  };
}

function predictTapBack(slides: RichSlide[]): StoryPrediction {
  // Tap back indicates viewers re-reading. Good = 8-15% band.
  const teach = slides.filter((s) => s.goal === "teach").length;
  const base = 6 + teach * 3;
  return {
    id: "tap-back",
    label: "Tap back",
    value: clamp(base, 2, 30),
    unit: "%",
    reason: `${teach} teach slide(s) invite re-reading.`,
    suggestedImprovement: "Frame teach slides as steps so viewers return to them.",
    expectedLift: "+2-4%",
    confidence: 54,
  };
}

// ─── Public entry ───────────────────────────────────────────────────────

export function predictStory(
  slides: RichSlide[],
  opts: PredictOptions = {},
): StoryPrediction[] {
  return [
    predictCompletion(slides),
    predictRetention(slides),
    predictReplies(slides, opts),
    predictShares(slides),
    predictSaves(slides),
    predictCTR(slides),
    predictExitRate(slides, opts),
    predictSwipeAway(slides),
    predictTapForward(slides),
    predictTapBack(slides),
  ];
}

export function narrationSeconds(slides: RichSlide[]): number {
  // Roughly 140 words per minute.
  const words = slides.reduce((n, s) => n + wc(s.voiceover ?? s.body), 0);
  return Math.round((words / 140) * 60);
}

export function totalStorySeconds(slides: RichSlide[]): number {
  return totalDurationSeconds(slides);
}
