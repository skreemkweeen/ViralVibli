/**
 * Voice engine — the reusable writing intelligence a brand carries into
 * every studio. Extracts + applies voice rules deterministically.
 */

import type { BrandDNA, ReadingLevel } from "./brand-dna";

// ─── Voice profile ───────────────────────────────────────────────────────

export type VoiceProfile = {
  /** Freeform description ("candid, quiet, considered") */
  description: string;
  /** Example sentences that model the voice */
  examples: string[];
  /** Things the brand always does */
  do: string[];
  /** Things the brand never does */
  dont: string[];
  /** Preferred sentence length in words */
  sentenceLength: number;
  /** Target reading grade */
  readingLevel: ReadingLevel;
  /** How often to use humor (0-100) */
  humor: number;
  /** Authority axis (0-100) */
  authority: number;
  /** Luxury axis (0-100) */
  luxury: number;
  /** Emotion axis (0-100) */
  emotion: number;
  /** Conversational axis (0-100) */
  conversation: number;
  /** Technical axis (0-100) */
  technical: number;
};

export function defaultVoiceProfile(): VoiceProfile {
  return {
    description: "",
    examples: [],
    do: [],
    dont: [],
    sentenceLength: 14,
    readingLevel: "9th",
    humor: 30,
    authority: 60,
    luxury: 55,
    emotion: 55,
    conversation: 60,
    technical: 40,
  };
}

export function voiceFromBrand(brand: BrandDNA): VoiceProfile {
  const base = defaultVoiceProfile();
  return {
    ...base,
    description: brand.voice || base.description,
    readingLevel: brand.readingLevel,
    do: brand.rules,
    dont: brand.forbiddenWords,
    luxury: brand.personality.luxury,
    emotion: brand.personality.emotion,
    authority: brand.personality.authority,
    conversation: Math.round(
      (brand.personality.friendliness + brand.personality.playfulness) / 2,
    ),
    technical: 100 - brand.personality.friendliness,
  };
}

// ─── Voice analysis ──────────────────────────────────────────────────────

export type VoiceCheck = {
  score: number;
  reason: string;
  forbiddenHits: string[];
  vocabHits: string[];
  averageSentenceLength: number;
};

const SENTENCE_RE = /[^.!?]+[.!?]?/g;

export function analyseVoice(text: string, brand: BrandDNA): VoiceCheck {
  const lower = text.toLowerCase();
  const forbiddenHits = brand.forbiddenWords.filter((w) =>
    w && lower.includes(w.toLowerCase()),
  );
  const vocabHits = brand.vocabulary.filter((w) =>
    w && lower.includes(w.toLowerCase()),
  );
  const sentences = (text.match(SENTENCE_RE) ?? [])
    .map((s) => s.trim())
    .filter(Boolean);
  const wordCounts = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const avg = wordCounts.length
    ? wordCounts.reduce((n, x) => n + x, 0) / wordCounts.length
    : 0;

  let score = 65;
  if (vocabHits.length > 0) score += Math.min(20, vocabHits.length * 5);
  if (forbiddenHits.length > 0) score -= Math.min(40, forbiddenHits.length * 15);
  if (avg > 26) score -= 8;
  if (avg > 40) score -= 12;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const reasons: string[] = [];
  if (forbiddenHits.length)
    reasons.push(`${forbiddenHits.length} forbidden word hit(s)`);
  if (vocabHits.length)
    reasons.push(`${vocabHits.length} brand vocab word hit(s)`);
  if (avg > 26) reasons.push(`avg sentence ${avg.toFixed(0)}w feels long`);

  return {
    score,
    reason: reasons.length ? reasons.join(" · ") : "On-brand cadence.",
    forbiddenHits,
    vocabHits,
    averageSentenceLength: Math.round(avg * 10) / 10,
  };
}

// ─── Voice transforms — used by the AI Brand Director ──────────────────

export type VoiceTransformId =
  | "increase-authority"
  | "increase-emotion"
  | "increase-luxury"
  | "increase-friendliness"
  | "make-conversational"
  | "make-editorial"
  | "make-minimal"
  | "make-founder";

export type VoiceTransformResult = {
  action: VoiceTransformId;
  before: string;
  after: string;
  why: string;
  confidence: number;
};

function contract(s: string): string {
  return s
    .replace(/\byou are\b/gi, "you're")
    .replace(/\bwe are\b/gi, "we're")
    .replace(/\bit is\b/gi, "it's")
    .replace(/\bdo not\b/gi, "don't")
    .replace(/\bcannot\b/gi, "can't");
}

function stripFiller(s: string): string {
  const filler = ["very", "really", "actually", "basically", "literally", "quite"];
  let out = s;
  for (const w of filler) out = out.replace(new RegExp(`\\b${w}\\b\\s*`, "gi"), "");
  return out.replace(/\s{2,}/g, " ").trim();
}

const HANDLERS: Record<VoiceTransformId, (text: string) => VoiceTransformResult> = {
  "increase-authority": (t) => ({
    action: "increase-authority",
    before: t,
    after: `Here's what we know: ${t}`,
    why: "A credibility anchor at the front lifts authority.",
    confidence: 70,
  }),
  "increase-emotion": (t) => ({
    action: "increase-emotion",
    before: t,
    after: `${t} And honestly — that mattered more than expected.`,
    why: "Naming a felt beat drops the reader's guard.",
    confidence: 72,
  }),
  "increase-luxury": (t) => ({
    action: "increase-luxury",
    before: t,
    after: t
      .replace(/\bbig\b/gi, "considered")
      .replace(/\bawesome\b/gi, "quiet")
      .replace(/\bamazing\b/gi, "refined"),
    why: "Restraint reads as luxury.",
    confidence: 68,
  }),
  "increase-friendliness": (t) => ({
    action: "increase-friendliness",
    before: t,
    after: contract(t),
    why: "Contractions read like a friend talking.",
    confidence: 74,
  }),
  "make-conversational": (t) => ({
    action: "make-conversational",
    before: t,
    after: contract(t),
    why: "Contractions + direct address feel human.",
    confidence: 76,
  }),
  "make-editorial": (t) => ({
    action: "make-editorial",
    before: t,
    after: `${t} What follows is a considered look at why.`,
    why: "A magazine-style bridge signals slower attention.",
    confidence: 66,
  }),
  "make-minimal": (t) => ({
    action: "make-minimal",
    before: t,
    after: stripFiller(t),
    why: "Every unnecessary word dilutes the true one.",
    confidence: 80,
  }),
  "make-founder": (t) => ({
    action: "make-founder",
    before: t,
    after: `Real talk from the founder — ${t.charAt(0).toLowerCase()}${t.slice(1)}`,
    why: "Founder-first voice earns permission other framings can't.",
    confidence: 68,
  }),
};

export function applyVoiceTransform(
  text: string,
  id: VoiceTransformId,
): VoiceTransformResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      action: id,
      before: text,
      after: text,
      why: "Nothing to transform.",
      confidence: 0,
    };
  }
  return HANDLERS[id](trimmed);
}

// ─── Reading level heuristic ────────────────────────────────────────────

const SYLLABLE_RE = /[aeiouy]+/gi;

function estimateSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  const matches = w.match(SYLLABLE_RE);
  return Math.max(1, matches ? matches.length : 1);
}

/**
 * Rough Flesch-Kincaid grade level. Not perfect but stable and
 * transparent — enough to flag drift.
 */
export function readingGrade(text: string): number {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const sentences = (text.match(SENTENCE_RE) ?? []).length || 1;
  const syllables = words.reduce((n, w) => n + estimateSyllables(w), 0);
  const grade =
    0.39 * (words.length / sentences) +
    11.8 * (syllables / words.length) -
    15.59;
  return Math.round(grade * 10) / 10;
}
