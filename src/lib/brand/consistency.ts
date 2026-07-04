/**
 * Brand consistency engine — 10-dimension deterministic score over any
 * asset (a prompt, a story slide, a caption). Every dimension returns
 * a 0-100 score with reason, confidence, suggested fix, and an AI
 * recommendation the Brand Director can act on.
 *
 * Pure. No AI. Reads from a BrandDNA + VisualLanguage.
 */

import type { BrandDNA } from "./brand-dna";
import { brandVocabulary } from "./brand-dna";
import type { VisualLanguage } from "./visual-language";
import { paletteMinimalismScore, primaryColor } from "./visual-language";
import { analyseVoice, readingGrade } from "./voice";

export type ConsistencyDimensionId =
  | "voice"
  | "visual"
  | "typography"
  | "color"
  | "messaging"
  | "luxury"
  | "professionalism"
  | "audience-fit"
  | "platform-fit"
  | "overall";

export type ConsistencyScore = {
  id: ConsistencyDimensionId;
  label: string;
  score: number;
  reason: string;
  confidence: number;
  fix?: string;
  recommendation?: string;
};

export type ConsistencyReport = {
  overall: number;
  dimensions: ConsistencyScore[];
};

// ─── Options ─────────────────────────────────────────────────────────────

export type AssetInput = {
  /** The text content of the asset (prompt / caption / slide body). */
  text?: string;
  /** Colours actually used in the asset (hex strings). */
  colors?: string[];
  /** Type families actually used. */
  typography?: string[];
  /** Platform this asset targets — used for platform-fit scoring. */
  platform?: string;
};

// ─── Utility ─────────────────────────────────────────────────────────────

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function includesAny(text: string, needles: string[]): number {
  const lower = text.toLowerCase();
  return needles.filter((n) => n && lower.includes(n.toLowerCase())).length;
}

// ─── Per-dimension analysers ────────────────────────────────────────────

function scoreVoice(asset: AssetInput, brand: BrandDNA): ConsistencyScore {
  const text = asset.text ?? "";
  if (!text.trim()) {
    return {
      id: "voice",
      label: "Voice",
      score: 55,
      reason: "No copy to analyse.",
      confidence: 40,
    };
  }
  const check = analyseVoice(text, brand);
  return {
    id: "voice",
    label: "Voice",
    score: check.score,
    reason: check.reason,
    confidence: 74,
    fix: check.forbiddenHits.length
      ? `Remove: ${check.forbiddenHits.join(", ")}`
      : undefined,
    recommendation: check.vocabHits.length
      ? undefined
      : "Weave in preferred brand words.",
  };
}

function scoreVisual(asset: AssetInput, brand: BrandDNA, vl: VisualLanguage): ConsistencyScore {
  const target = new Set(vl.colors.map((c) => c.value.toLowerCase()));
  const used = asset.colors ?? [];
  const hits = used.filter((c) => target.has(c.toLowerCase())).length;
  const missing = used.length - hits;
  const base = used.length === 0 ? 60 : 40 + Math.min(50, hits * 15) - Math.min(30, missing * 6);
  return {
    id: "visual",
    label: "Visual",
    score: clamp(base),
    reason:
      used.length === 0
        ? "No colours declared on the asset."
        : `${hits} of ${used.length} colour(s) match the brand palette.`,
    confidence: used.length ? 80 : 55,
    fix:
      missing > 0
        ? `Swap in brand palette colours (${brand.name || "primary"} — ${primaryColor(vl) ?? "?"})`
        : undefined,
  };
}

function scoreTypography(asset: AssetInput, vl: VisualLanguage): ConsistencyScore {
  const brandFamilies = new Set(vl.typography.map((t) => t.family.toLowerCase()));
  const used = asset.typography ?? [];
  const hits = used.filter((t) => brandFamilies.has(t.toLowerCase())).length;
  const base = used.length === 0 ? 65 : 35 + Math.min(60, hits * 25);
  return {
    id: "typography",
    label: "Typography",
    score: clamp(base),
    reason:
      used.length === 0
        ? "No typography declared."
        : `${hits} of ${used.length} typeface(s) match the brand type system.`,
    confidence: used.length ? 75 : 50,
    fix:
      used.length && hits === 0
        ? `Use ${Array.from(brandFamilies).join(" or ")}.`
        : undefined,
  };
}

function scoreColor(asset: AssetInput, vl: VisualLanguage): ConsistencyScore {
  const minimal = paletteMinimalismScore(vl);
  const used = asset.colors ?? [];
  const base = used.length === 0 ? minimal : minimal - Math.max(0, used.length - 4) * 6;
  return {
    id: "color",
    label: "Color",
    score: clamp(base),
    reason: `Palette minimalism ${minimal}${used.length ? ` · ${used.length} colour(s) on asset` : ""}.`,
    confidence: 66,
    recommendation:
      minimal < 60 ? "Consider trimming accent colours to protect brand recall." : undefined,
  };
}

function scoreMessaging(asset: AssetInput, brand: BrandDNA): ConsistencyScore {
  const text = asset.text ?? "";
  const vocab = brandVocabulary(brand);
  const hits = includesAny(text, vocab);
  const base = 45 + Math.min(50, hits * 10);
  return {
    id: "messaging",
    label: "Messaging",
    score: clamp(base),
    reason: `${hits} brand vocabulary word(s) present.`,
    confidence: 70,
    recommendation:
      hits === 0 ? "Add at least one brand vocabulary word for recall." : undefined,
  };
}

function scoreLuxury(brand: BrandDNA, asset: AssetInput): ConsistencyScore {
  const text = asset.text ?? "";
  const luxSignals = [
    "considered",
    "quiet",
    "refined",
    "editorial",
    "restraint",
    "polished",
  ];
  const hits = includesAny(text, luxSignals);
  const target = brand.personality.luxury;
  const asset_lux = Math.min(100, 30 + hits * 12);
  const gap = Math.abs(asset_lux - target);
  return {
    id: "luxury",
    label: "Luxury feel",
    score: clamp(100 - gap),
    reason: `Asset luxury signal ${asset_lux}, brand target ${target}.`,
    confidence: 62,
    fix: gap > 30 ? "Adjust vocabulary to match the brand's luxury target." : undefined,
  };
}

function scoreProfessionalism(brand: BrandDNA, asset: AssetInput): ConsistencyScore {
  const text = asset.text ?? "";
  const excl = (text.match(/[!]/g) ?? []).length;
  const emojis = (text.match(/[\p{Emoji_Presentation}\u{1F600}-\u{1F64F}]/gu) ?? []).length;
  const informal = excl + emojis;
  const asset_pro = Math.max(0, 100 - informal * 8);
  const target = brand.personality.professionalism;
  const gap = Math.abs(asset_pro - target);
  return {
    id: "professionalism",
    label: "Professionalism",
    score: clamp(100 - gap),
    reason: `Asset ${asset_pro} vs brand target ${target}${informal ? ` · ${informal} informal marker(s)` : ""}.`,
    confidence: 64,
    fix: informal > 3 ? "Reduce exclamation marks and emojis." : undefined,
  };
}

function scoreAudienceFit(brand: BrandDNA, asset: AssetInput): ConsistencyScore {
  const text = asset.text ?? "";
  const grade = readingGrade(text);
  const targetMap: Record<string, number> = {
    "7th": 7,
    "9th": 9,
    "12th": 12,
    college: 13,
    expert: 16,
  };
  const target = targetMap[brand.readingLevel] ?? 9;
  const gap = Math.abs(grade - target);
  return {
    id: "audience-fit",
    label: "Audience fit",
    score: clamp(100 - gap * 6),
    reason: `Reading grade ${grade || 0} vs brand target ${target}.`,
    confidence: 60,
    recommendation: gap > 3 ? "Simplify or elevate copy to match reading level." : undefined,
  };
}

const PLATFORM_LIMITS: Record<string, number> = {
  instagram: 220,
  tiktok: 150,
  pinterest: 500,
  lemon8: 500,
  threads: 500,
  facebook: 500,
  web: 800,
};

function scorePlatformFit(asset: AssetInput): ConsistencyScore {
  const text = asset.text ?? "";
  const platform = (asset.platform ?? "web").toLowerCase();
  const limit = PLATFORM_LIMITS[platform] ?? 500;
  const over = Math.max(0, text.length - limit);
  const base = 90 - Math.min(60, over / 8);
  return {
    id: "platform-fit",
    label: "Platform fit",
    score: clamp(base),
    reason: `${text.length} chars vs ${platform} soft cap ${limit}.`,
    confidence: 68,
    fix: over > 0 ? `Trim ${Math.ceil(over)} char(s).` : undefined,
  };
}

// ─── Public entry ───────────────────────────────────────────────────────

export function analyseConsistency(
  brand: BrandDNA,
  vl: VisualLanguage,
  asset: AssetInput,
): ConsistencyReport {
  const dims: ConsistencyScore[] = [
    scoreVoice(asset, brand),
    scoreVisual(asset, brand, vl),
    scoreTypography(asset, vl),
    scoreColor(asset, vl),
    scoreMessaging(asset, brand),
    scoreLuxury(brand, asset),
    scoreProfessionalism(brand, asset),
    scoreAudienceFit(brand, asset),
    scorePlatformFit(asset),
  ];
  const overall = clamp(dims.reduce((n, d) => n + d.score, 0) / dims.length);
  dims.push({
    id: "overall",
    label: "Overall",
    score: overall,
    reason: "Mean of 9 dimensions.",
    confidence: 70,
  });
  return { overall, dimensions: dims };
}
