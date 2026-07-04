/**
 * Brand DNA — the structured identity every studio consumes.
 *
 * A Brand is the root creative object. It gets serialised, versioned,
 * and persisted per workspace. Every other studio reads from it via
 * the Creative Intelligence layer.
 *
 * Pure — no React, no fetches. UI + store handle those.
 */

// ─── Vocabularies ────────────────────────────────────────────────────────

export const BRAND_ARCHETYPES = [
  "innocent",
  "sage",
  "explorer",
  "outlaw",
  "magician",
  "hero",
  "lover",
  "jester",
  "everyman",
  "caregiver",
  "ruler",
  "creator",
] as const;
export type BrandArchetype = (typeof BRAND_ARCHETYPES)[number];

export const BRAND_TONES = [
  "warm",
  "cool",
  "authoritative",
  "playful",
  "editorial",
  "quiet",
  "punchy",
  "candid",
  "aspirational",
  "reassuring",
] as const;
export type BrandTone = (typeof BRAND_TONES)[number];

export const READING_LEVELS = ["7th", "9th", "12th", "college", "expert"] as const;
export type ReadingLevel = (typeof READING_LEVELS)[number];

export const HOOK_STYLES = [
  "pattern-break",
  "curiosity",
  "authority",
  "empathy",
  "provocation",
  "quiet",
] as const;
export type HookStyle = (typeof HOOK_STYLES)[number];

export const CTA_STYLES = ["soft", "direct", "urgent", "editorial", "none"] as const;
export type CTAStyle = (typeof CTA_STYLES)[number];

export const COMMUNICATION_STYLES = [
  "founder",
  "corporate",
  "gen-z",
  "editorial",
  "luxury",
  "friendly",
  "technical",
] as const;
export type CommunicationStyle = (typeof COMMUNICATION_STYLES)[number];

// ─── Personality axes ────────────────────────────────────────────────────

/**
 * Every axis is 0-100. Together they describe how the brand should
 * feel emotionally without needing prose.
 */
export type BrandPersonality = {
  luxury: number;
  minimalism: number;
  professionalism: number;
  friendliness: number;
  playfulness: number;
  confidence: number;
  emotion: number;
  authority: number;
};

export const defaultPersonality = (): BrandPersonality => ({
  luxury: 60,
  minimalism: 65,
  professionalism: 70,
  friendliness: 60,
  playfulness: 40,
  confidence: 65,
  emotion: 55,
  authority: 60,
});

// ─── Brand entity ────────────────────────────────────────────────────────

export type BrandDNA = {
  id: string;
  name: string;
  tagline?: string;

  // Purpose
  mission: string;
  vision: string;
  values: string[];

  // Audience + market
  audience: string;
  positioning: string;
  usp: string;

  // Character
  archetype: BrandArchetype;
  tone: BrandTone[];
  personality: BrandPersonality;

  // Language
  voice: string;
  vocabulary: string[];
  forbiddenWords: string[];
  rules: string[];

  // Narrative
  story: string;
  promise: string;

  // Communication
  communicationStyle: CommunicationStyle;
  readingLevel: ReadingLevel;
  hookStyle: HookStyle;
  ctaStyle: CTAStyle;

  createdAt: number;
  updatedAt: number;
};

// ─── Factories ────────────────────────────────────────────────────────────

export function emptyBrand(id: string, now: number = Date.now()): BrandDNA {
  return {
    id,
    name: "",
    mission: "",
    vision: "",
    values: [],
    audience: "",
    positioning: "",
    usp: "",
    archetype: "creator",
    tone: ["warm"],
    personality: defaultPersonality(),
    voice: "",
    vocabulary: [],
    forbiddenWords: [],
    rules: [],
    story: "",
    promise: "",
    communicationStyle: "editorial",
    readingLevel: "9th",
    hookStyle: "curiosity",
    ctaStyle: "soft",
    createdAt: now,
    updatedAt: now,
  };
}

// ─── Mutations ───────────────────────────────────────────────────────────

export function updateBrand(brand: BrandDNA, patch: Partial<BrandDNA>): BrandDNA {
  return { ...brand, ...patch, updatedAt: Date.now() };
}

export function setPersonalityAxis(
  brand: BrandDNA,
  axis: keyof BrandPersonality,
  value: number,
): BrandDNA {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return updateBrand(brand, {
    personality: { ...brand.personality, [axis]: clamped },
  });
}

export function addValueTag(
  brand: BrandDNA,
  field: "values" | "vocabulary" | "forbiddenWords" | "rules",
  value: string,
): BrandDNA {
  const trimmed = value.trim();
  if (!trimmed) return brand;
  if (brand[field].includes(trimmed)) return brand;
  return updateBrand(brand, { [field]: [...brand[field], trimmed] });
}

export function removeValueTag(
  brand: BrandDNA,
  field: "values" | "vocabulary" | "forbiddenWords" | "rules",
  value: string,
): BrandDNA {
  return updateBrand(brand, {
    [field]: brand[field].filter((v) => v !== value),
  });
}

// ─── Read helpers ────────────────────────────────────────────────────────

/**
 * Compact one-line brand summary suitable for inclusion in AI system
 * prompts. Prefers named fields, falls back gracefully.
 */
export function assembleBrandLine(brand: BrandDNA): string {
  const parts: string[] = [];
  if (brand.name) parts.push(brand.name);
  if (brand.audience) parts.push(`for ${brand.audience}`);
  if (brand.positioning) parts.push(brand.positioning);
  if (brand.tone.length) parts.push(`tone: ${brand.tone.join(", ")}`);
  return parts.join(" · ");
}

/**
 * Multi-line brand summary for richer AI context (AI Dock system prompt,
 * assistant briefings). Only includes non-empty fields so the block
 * scales cleanly with brand completeness.
 */
export function assembleBrandContext(brand: BrandDNA): string {
  const lines: string[] = [];
  if (brand.name) lines.push(`Brand: ${brand.name}`);
  if (brand.tagline) lines.push(`Tagline: ${brand.tagline}`);
  if (brand.mission) lines.push(`Mission: ${brand.mission}`);
  if (brand.audience) lines.push(`Audience: ${brand.audience}`);
  if (brand.positioning) lines.push(`Positioning: ${brand.positioning}`);
  if (brand.usp) lines.push(`USP: ${brand.usp}`);
  if (brand.voice) lines.push(`Voice: ${brand.voice}`);
  if (brand.tone.length) lines.push(`Tone: ${brand.tone.join(", ")}`);
  if (brand.values.length) lines.push(`Values: ${brand.values.join(", ")}`);
  if (brand.vocabulary.length)
    lines.push(`Preferred words: ${brand.vocabulary.join(", ")}`);
  if (brand.forbiddenWords.length)
    lines.push(`Never use: ${brand.forbiddenWords.join(", ")}`);
  if (brand.rules.length) lines.push(`Rules: ${brand.rules.join(" · ")}`);
  if (brand.promise) lines.push(`Promise: ${brand.promise}`);
  return lines.join("\n");
}

/**
 * How complete the brand feels (0-100). Used by the Brand Inspector +
 * dashboards + AI to decide whether to prompt the creator for more.
 */
export function brandCompleteness(brand: BrandDNA): number {
  const fields: Array<[unknown, number]> = [
    [brand.name, 8],
    [brand.mission, 8],
    [brand.vision, 6],
    [brand.audience, 10],
    [brand.positioning, 10],
    [brand.usp, 8],
    [brand.voice, 8],
    [brand.tone.length > 0, 6],
    [brand.values.length > 0, 6],
    [brand.vocabulary.length > 0, 6],
    [brand.forbiddenWords.length > 0, 4],
    [brand.rules.length > 0, 4],
    [brand.story, 6],
    [brand.promise, 4],
    [brand.archetype, 3],
    [brand.communicationStyle, 3],
  ];
  let total = 0;
  let earned = 0;
  for (const [value, weight] of fields) {
    total += weight;
    if (value && (typeof value !== "string" || value.trim().length > 0)) {
      earned += weight;
    }
  }
  return total > 0 ? Math.round((earned / total) * 100) : 0;
}

/**
 * Brand vocabulary (union of preferred words + tone) as a lowercase
 * array — used by consistency scoring + brand-similarity checks in
 * Vision Studio's Reference Wall + Story Studio's Inspector.
 */
export function brandVocabulary(brand: BrandDNA): string[] {
  const set = new Set<string>();
  for (const v of brand.vocabulary) if (v.trim()) set.add(v.toLowerCase().trim());
  for (const t of brand.tone) set.add(t.toLowerCase());
  if (brand.archetype) set.add(brand.archetype.toLowerCase());
  return Array.from(set);
}
