/**
 * Creative Director scorecard — 7 dimensions rated 0-100 with a plain-
 * language explanation of how the score was reached and a specific
 * suggestion for how to move the needle. Not an AI call — deterministic
 * heuristics over the Direction + prompt so scores stay stable.
 */

import type { Direction } from "./prompt";
import type { ShotType } from "./shots";

export type DirectorAxisId =
  | "creative"
  | "commercial"
  | "luxury"
  | "virality"
  | "editorial"
  | "brand-consistency"
  | "product-focus";

export type DirectorAxisScore = {
  id: DirectorAxisId;
  label: string;
  score: number;
  why: string;
  improve?: string;
};

export type DirectorScorecard = {
  axes: DirectorAxisScore[];
  headline: DirectorAxisId; // the axis this prompt leans hardest into
  weakest: DirectorAxisId;  // the axis to lift next
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function contains(s: string, needles: string[]): number {
  const lower = s.toLowerCase();
  return needles.filter((n) => lower.includes(n)).length;
}

// Vocabulary buckets — the axis definitions.
const V = {
  luxury: [
    "editorial",
    "luxe",
    "refined",
    "considered",
    "minimal",
    "restraint",
    "polished",
    "premium",
    "hasselblad",
    "phaseone",
    "leica",
    "marble",
    "linen",
    "velvet",
    "quiet",
    "elegant",
  ],
  virality: [
    "bold",
    "high-key",
    "energetic",
    "playful",
    "saturated",
    "graphic",
    "punchy",
    "candid",
    "handheld",
    "9-16",
    "1-1",
  ],
  editorial: [
    "editorial",
    "magazine",
    "art-directed",
    "negative",
    "cinematic",
    "film",
    "moody",
    "documentary",
    "narrative",
    "grain",
  ],
  commercial: [
    "packaging",
    "product",
    "clean",
    "centered",
    "softbox",
    "high-key",
    "studio",
    "matte",
    "hero",
    "sharp",
  ],
  creative: [
    "surreal",
    "unexpected",
    "leading",
    "frame",
    "dutch",
    "symmetry",
    "candlelit",
    "neon",
    "mysterious",
  ],
  productFocus: [
    "product",
    "packaging",
    "detail",
    "macro",
    "closeup",
    "centered",
    "material",
    "texture",
    "sharp",
  ],
};

// ─── Per-axis scorers ─────────────────────────────────────────────────────

function scoreLuxury(d: Direction, text: string): DirectorAxisScore {
  const hits = contains(text, V.luxury);
  let score = 30 + hits * 7;
  if (d.style === "editorial" || d.style === "luxe" || d.style === "minimal")
    score += 20;
  if (d.material === "marble" || d.material === "velvet" || d.material === "linen")
    score += 10;
  score = clamp(score);
  return {
    id: "luxury",
    label: "Luxury",
    score,
    why: `${hits} luxury signal(s) in the prompt${d.style ? `; style is "${d.style}"` : ""}.`,
    improve: score < 70
      ? "Lean into restraint — pick Luxe style, marble/linen material, refined mood."
      : undefined,
  };
}

function scoreVirality(d: Direction, text: string): DirectorAxisScore {
  const hits = contains(text, V.virality);
  let score = 25 + hits * 7;
  if (d.aspect === "9-16") score += 15;
  if (d.mood === "bold" || d.mood === "energetic" || d.mood === "playful")
    score += 15;
  score = clamp(score);
  return {
    id: "virality",
    label: "Virality",
    score,
    why: `${hits} scroll-stopping signal(s)${d.aspect === "9-16" ? "; vertical aspect for feed" : ""}.`,
    improve: score < 65
      ? "Bump saturation via Bold color style, high-key lighting, 9:16 aspect."
      : undefined,
  };
}

function scoreEditorial(d: Direction, text: string): DirectorAxisScore {
  const hits = contains(text, V.editorial);
  let score = 30 + hits * 6;
  if (d.render === "editorial-print" || d.render === "cinematic-film") score += 15;
  if (d.style === "editorial" || d.style === "cinematic") score += 15;
  score = clamp(score);
  return {
    id: "editorial",
    label: "Editorial",
    score,
    why: `${hits} editorial cue(s)${d.style ? `; style "${d.style}"` : ""}.`,
    improve: score < 70
      ? "Switch render to Editorial print, add negative-space composition."
      : undefined,
  };
}

function scoreCommercial(d: Direction, text: string): DirectorAxisScore {
  const hits = contains(text, V.commercial);
  let score = 30 + hits * 7;
  if (d.composition === "centered") score += 10;
  if (d.lighting === "softbox" || d.lighting === "window") score += 10;
  if (d.quality === "ultra" || d.quality === "high") score += 10;
  score = clamp(score);
  return {
    id: "commercial",
    label: "Commercial",
    score,
    why: `${hits} commercial cue(s)${d.composition ? `; composition "${d.composition}"` : ""}.`,
    improve: score < 65
      ? "Center the subject on a clean softbox setup at f/5.6."
      : undefined,
  };
}

function scoreCreative(d: Direction, text: string): DirectorAxisScore {
  const hits = contains(text, V.creative);
  let score = 25 + hits * 10;
  if (d.style === "surreal") score += 20;
  if (d.mood === "mysterious" || d.mood === "playful") score += 10;
  score = clamp(score);
  return {
    id: "creative",
    label: "Creative",
    score,
    why: `${hits} creative twist(s)${d.style === "surreal" ? "; Surreal style engaged" : ""}.`,
    improve: score < 60
      ? "Introduce Dutch tilt / frame-in-frame / surreal style for a signature twist."
      : undefined,
  };
}

function scoreBrandConsistency(
  d: Direction,
  intendedType?: ShotType,
): DirectorAxisScore {
  // Consistency is highest when both style and mood are pinned.
  let score = 30;
  if (d.style) score += 25;
  if (d.mood) score += 15;
  if (d.colorGrade) score += 15;
  if (intendedType) score += 15;
  score = clamp(score);
  return {
    id: "brand-consistency",
    label: "Brand consistency",
    score,
    why: `Style / mood / grade${intendedType ? ` / shot type "${intendedType}"` : ""} are ${
      score >= 75 ? "pinned" : "loose"
    }.`,
    improve: score < 70
      ? "Save the current mix as a Style Library preset and re-apply per shot."
      : undefined,
  };
}

function scoreProductFocus(d: Direction, text: string): DirectorAxisScore {
  const hits = contains(text, V.productFocus);
  let score = 30 + hits * 6;
  if (d.subject.trim().length > 6) score += 15;
  if (d.material) score += 15;
  if (d.composition === "centered" || d.composition === "closeup") score += 10;
  score = clamp(score);
  return {
    id: "product-focus",
    label: "Product focus",
    score,
    why: `${hits} product cue(s); subject "${d.subject || "(unset)"}", material "${d.material ?? "(none)"}".`,
    improve: score < 65
      ? "Name the subject precisely and pick a Material to anchor the render."
      : undefined,
  };
}

// ─── Public entry ─────────────────────────────────────────────────────────

export function scorePrompt(
  direction: Direction,
  promptText: string,
  opts?: { intendedType?: ShotType },
): DirectorScorecard {
  const axes: DirectorAxisScore[] = [
    scoreCreative(direction, promptText),
    scoreCommercial(direction, promptText),
    scoreLuxury(direction, promptText),
    scoreVirality(direction, promptText),
    scoreEditorial(direction, promptText),
    scoreBrandConsistency(direction, opts?.intendedType),
    scoreProductFocus(direction, promptText),
  ];
  const sorted = [...axes].sort((a, b) => b.score - a.score);
  const headline = sorted[0]!.id;
  const weakest = sorted[sorted.length - 1]!.id;
  return { axes, headline, weakest };
}
