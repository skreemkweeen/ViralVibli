/**
 * Story Psychology Insights — deterministic heuristic scores derived from a
 * story concept's slides. Zero AI round-trip, zero network. Every score is a
 * 0..100 integer and every metric is grounded in a specific signal you can
 * point at in the slide copy so the panel never feels magic.
 *
 * We publish seven metrics:
 *   Curiosity · Authority · Trust · Emotion · Urgency · Retention · Sales
 *
 * Signals we look at (all strictly derived, no randomness):
 *   - Hooks (opening questions, "you", "wrong", "nobody tells you")
 *   - Directness / brevity (short sentences, imperatives)
 *   - CTA presence + shape ("save", "buy", "link", "shop")
 *   - Numbers, comparatives, superlatives
 *   - Emotional openers ("feel", "love", "hate", "afraid")
 *   - Time markers ("today", "now", "before", "gone")
 *   - Slide count vs. sequence pacing
 *   - Speaker-note richness (indicates production intent)
 */

import type { StorySlide } from "@/lib/ai/types";
import type { StoryConcept } from "@/lib/story/types";

export type InsightMetric =
  | "curiosity"
  | "authority"
  | "trust"
  | "emotion"
  | "urgency"
  | "retention"
  | "sales";

export type Insights = Record<InsightMetric, number>;

const HOOK_WORDS = [
  "stop",
  "wait",
  "nobody",
  "wrong",
  "you",
  "your",
  "why",
  "how",
  "what if",
  "notice",
  "before you",
];

const AUTHORITY_WORDS = [
  "framework",
  "system",
  "study",
  "data",
  "research",
  "proven",
  "years",
  "professional",
  "senior",
  "director",
  "designer",
  "expert",
];

const TRUST_WORDS = [
  "honestly",
  "quiet",
  "care",
  "handmade",
  "small",
  "family",
  "made",
  "crafted",
  "no filter",
  "real",
];

const EMOTION_WORDS = [
  "feel",
  "felt",
  "love",
  "hate",
  "afraid",
  "quiet",
  "warm",
  "soft",
  "tired",
  "beautiful",
  "peaceful",
  "alive",
];

const URGENCY_WORDS = [
  "today",
  "now",
  "before",
  "gone",
  "last",
  "closing",
  "only",
  "limited",
  "few",
  "left",
];

const SALES_CTA = [
  "buy",
  "shop",
  "link",
  "order",
  "get yours",
  "cart",
  "checkout",
  "reserve",
  "join",
];

function count(text: string, words: string[]): number {
  const lower = text.toLowerCase();
  return words.reduce((acc, w) => (lower.includes(w) ? acc + 1 : acc), 0);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function sentenceStats(text: string) {
  const raw = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const avgWords =
    raw.length > 0
      ? raw.reduce((a, s) => a + s.split(/\s+/).length, 0) / raw.length
      : 0;
  return { count: raw.length, avgWords };
}

function slideBody(s: StorySlide): string {
  return [s.copy, s.stickerRecommendation, s.cta, s.speakerNotes]
    .filter(Boolean)
    .join(" ");
}

export function computeInsights(concept: StoryConcept): Insights {
  const slides = concept.slides;
  if (slides.length === 0) {
    return {
      curiosity: 0,
      authority: 0,
      trust: 0,
      emotion: 0,
      urgency: 0,
      retention: 0,
      sales: 0,
    };
  }

  const all = slides.map(slideBody).join(" ");
  const first = slides[0]?.copy ?? "";
  const last = slides[slides.length - 1] ?? slides[0];
  const withCta = slides.filter((s) => s.cta && s.cta.trim().length > 0).length;
  const withStickers = slides.filter(
    (s) => s.stickerRecommendation && s.stickerRecommendation.trim().length > 0,
  ).length;
  const withNotes = slides.filter(
    (s) => s.speakerNotes && s.speakerNotes.trim().length > 0,
  ).length;

  const stats = sentenceStats(all);

  // Curiosity — hook words in slide 1, question marks anywhere, short avg
  // sentence length ("stopping power" pattern)
  const questionMarks = (all.match(/\?/g) ?? []).length;
  const hookHits = count(first, HOOK_WORDS);
  const curiosity =
    hookHits * 22 +
    questionMarks * 8 +
    Math.max(0, 18 - stats.avgWords) * 2 + // shorter sentences → more curiosity
    (first.length > 0 && first.length < 90 ? 12 : 0);

  // Authority — specific vocabulary, numbers, framework signals
  const numbers = (all.match(/\b\d+\b/g) ?? []).length;
  const authority =
    count(all, AUTHORITY_WORDS) * 18 +
    numbers * 4 +
    withNotes * 6 +
    (slides.length >= 5 ? 10 : 0);

  // Trust — warm/considered vocabulary, first-person plural, notes richness
  const trust =
    count(all, TRUST_WORDS) * 18 +
    (all.match(/\bwe\b|\bour\b/gi)?.length ?? 0) * 5 +
    withNotes * 5 +
    (stats.avgWords > 8 ? 10 : 0);

  // Emotion — emotional openers, adverbs, exclamation marks
  const exclamations = (all.match(/!/g) ?? []).length;
  const emotion =
    count(all, EMOTION_WORDS) * 15 +
    exclamations * 6 +
    (all.match(/\byou'?ll\b|\byou'?re\b/gi)?.length ?? 0) * 6;

  // Urgency — time markers, "last chance" language, CTA in last slide
  const urgency =
    count(all, URGENCY_WORDS) * 20 +
    (last.cta && count(last.cta, ["today", "now", "before"]) > 0 ? 15 : 0) +
    (withCta > 0 ? 8 : 0);

  // Retention — good pacing (5–9 slides sweet spot), stickers/polls per slide,
  // consistent second-person address
  const idealPacing = 1 - Math.min(Math.abs(slides.length - 7) / 7, 1);
  const secondPerson = (all.match(/\byou\b/gi)?.length ?? 0);
  const retention =
    idealPacing * 40 +
    (withStickers / Math.max(slides.length, 1)) * 30 +
    Math.min(secondPerson, 8) * 4;

  // Sales — CTA-heavy slides, sales verbs, last slide has an action
  const salesHits = count(all, SALES_CTA);
  const sales =
    salesHits * 20 +
    withCta * 12 +
    (last.cta ? 15 : 0) +
    (last.stickerRecommendation ? 5 : 0);

  return {
    curiosity: clamp(curiosity),
    authority: clamp(authority),
    trust: clamp(trust),
    emotion: clamp(emotion),
    urgency: clamp(urgency),
    retention: clamp(retention),
    sales: clamp(sales),
  };
}

export const INSIGHT_LABELS: Record<InsightMetric, string> = {
  curiosity: "Curiosity",
  authority: "Authority",
  trust: "Trust",
  emotion: "Emotion",
  urgency: "Urgency",
  retention: "Retention",
  sales: "Sales",
};

/** Ordered metrics for consistent rendering. */
export const INSIGHT_METRICS: InsightMetric[] = [
  "curiosity",
  "authority",
  "trust",
  "emotion",
  "urgency",
  "retention",
  "sales",
];
