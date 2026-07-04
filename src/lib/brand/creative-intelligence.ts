/**
 * Creative Intelligence layer — the single reusable adapter every
 * studio pulls from. Studios never talk to the raw brand store or the
 * raw engines — they get everything through this facade:
 *
 *   Brand Intelligence:     name, vocabulary, personality, tone
 *   Prompt Intelligence:    system-prompt block for AI
 *   Campaign Intelligence:  brand-aware defaults for campaigns
 *   AI Context Engine:      one system-prompt block that combines
 *                           brand + project + creator memory
 *
 * The types here match the Brand engine output so consumers can rely
 * on stable field names.
 */

import type { BrandDNA } from "./brand-dna";
import { assembleBrandContext, brandVocabulary } from "./brand-dna";
import type { VisualLanguage } from "./visual-language";
import { primaryColor } from "./visual-language";
import type { CreativeMemory } from "@/lib/vision/creative-memory";

// ─── Brand intelligence ─────────────────────────────────────────────────

export type BrandIntelligence = {
  brandId: string | null;
  brandName: string | null;
  brandLine: string | null;
  vocabulary: string[];
  personality: BrandDNA["personality"] | null;
  tone: BrandDNA["tone"];
  primaryColor: string | undefined;
  forbiddenWords: string[];
};

export function brandIntelligence(
  brand: BrandDNA | null,
  visual: VisualLanguage,
): BrandIntelligence {
  if (!brand) {
    return {
      brandId: null,
      brandName: null,
      brandLine: null,
      vocabulary: [],
      personality: null,
      tone: [],
      primaryColor: primaryColor(visual),
      forbiddenWords: [],
    };
  }
  return {
    brandId: brand.id,
    brandName: brand.name || null,
    brandLine: brand.name || brand.positioning || null,
    vocabulary: brandVocabulary(brand),
    personality: brand.personality,
    tone: brand.tone,
    primaryColor: primaryColor(visual),
    forbiddenWords: brand.forbiddenWords,
  };
}

// ─── Prompt intelligence ────────────────────────────────────────────────

/**
 * A ready-made system-prompt block for any AI feature. Compact so it
 * fits in narrow context windows, but preserves the key rules.
 */
export function promptIntelligence(brand: BrandDNA | null): string {
  if (!brand) return "";
  const lines: string[] = [];
  lines.push("BRAND CONTEXT");
  lines.push(assembleBrandContext(brand));
  if (brand.forbiddenWords.length) {
    lines.push(`Never use: ${brand.forbiddenWords.join(", ")}`);
  }
  if (brand.rules.length) {
    lines.push(`Rules: ${brand.rules.join(" · ")}`);
  }
  return lines.filter(Boolean).join("\n");
}

// ─── Campaign intelligence ──────────────────────────────────────────────

export type CampaignDefaults = {
  tone: string[];
  personalityBias: BrandDNA["personality"] | null;
  vocabulary: string[];
  ctaStyle: string | null;
  hookStyle: string | null;
  readingLevel: string | null;
};

export function campaignIntelligence(brand: BrandDNA | null): CampaignDefaults {
  if (!brand) {
    return {
      tone: [],
      personalityBias: null,
      vocabulary: [],
      ctaStyle: null,
      hookStyle: null,
      readingLevel: null,
    };
  }
  return {
    tone: brand.tone,
    personalityBias: brand.personality,
    vocabulary: brandVocabulary(brand),
    ctaStyle: brand.ctaStyle,
    hookStyle: brand.hookStyle,
    readingLevel: brand.readingLevel,
  };
}

// ─── AI context engine ──────────────────────────────────────────────────

export type AIContextInput = {
  brand: BrandDNA | null;
  visual: VisualLanguage;
  memory: CreativeMemory;
  projectSummary?: string;
  campaignSummary?: string;
};

export function assembleAIContext(input: AIContextInput): string {
  const parts: string[] = [];
  const brandBlock = promptIntelligence(input.brand);
  if (brandBlock) parts.push(brandBlock);
  if (input.projectSummary) parts.push(`PROJECT\n${input.projectSummary}`);
  if (input.campaignSummary) parts.push(`CAMPAIGN\n${input.campaignSummary}`);
  const memBlock = memoryDigest(input.memory);
  if (memBlock) parts.push(memBlock);
  const primary = primaryColor(input.visual);
  if (primary) parts.push(`PRIMARY COLOR\n${primary}`);
  return parts.join("\n\n");
}

// Small helper — compact top-3 per category so the block stays short.
export function memoryDigest(mem: CreativeMemory): string {
  const lines: string[] = [];
  const cats = Object.keys(mem) as (keyof CreativeMemory)[];
  for (const c of cats) {
    const top = mem[c].slice(0, 3);
    if (top.length === 0) continue;
    lines.push(`${c}: ${top.map((e) => e.label).join(", ")}`);
  }
  if (lines.length === 0) return "";
  return `CREATOR MEMORY\n${lines.join("\n")}`;
}

// ─── Trend intelligence stub ────────────────────────────────────────────

// Trend intelligence is a placeholder — we currently expose the shape
// so future modules can consume it, but the actual data comes from
// external providers in later phases.
export type TrendSignal = {
  id: string;
  label: string;
  strength: number;
  platform?: string;
};

export type TrendIntelligence = {
  signals: TrendSignal[];
};

export const emptyTrendIntelligence = (): TrendIntelligence => ({ signals: [] });
