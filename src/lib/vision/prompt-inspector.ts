/**
 * Prompt Inspector — deterministic diagnostic pass over an assembled
 * prompt. Grades 9 dimensions and returns per-dimension score + fix
 * suggestion. Not a black box: every score is a function of the
 * Direction + prompt text so a reader can trust why they see what they
 * see.
 */

import type { Direction } from "./prompt";
import type { TargetModelId } from "./models";
import { shotSpec, type ShotType } from "./shots";

export type DimensionId =
  | "completeness"
  | "specificity"
  | "composition"
  | "lighting"
  | "camera"
  | "mood"
  | "style-consistency"
  | "platform-optimization"
  | "estimated-quality";

export type DimensionScore = {
  id: DimensionId;
  label: string;
  score: number; // 0–100
  reason: string;
  fix?: string;
};

export type InspectionReport = {
  overall: number; // 0–100
  dimensions: DimensionScore[];
};

// ─── Utility scorers ──────────────────────────────────────────────────────

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function has(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

// ─── Per-dimension inspectors ─────────────────────────────────────────────

function inspectCompleteness(d: Direction, promptText: string): DimensionScore {
  // Every filled field is worth points; missing subject or environment is
  // punished more heavily than missing optional descriptors.
  const fields: [keyof Direction, number][] = [
    ["subject", 20],
    ["environment", 10],
    ["style", 8],
    ["mood", 8],
    ["lighting", 8],
    ["composition", 8],
    ["colorGrade", 6],
    ["camera", 5],
    ["lens", 5],
    ["aperture", 5],
    ["material", 4],
    ["texture", 4],
    ["timeOfDay", 4],
    ["weather", 3],
    ["render", 2],
  ];
  let earned = 0;
  const missing: string[] = [];
  for (const [k, w] of fields) {
    const v = d[k];
    if (has(typeof v === "string" ? v : v == null ? "" : String(v))) {
      earned += w;
    } else if (w >= 8) {
      missing.push(k);
    }
  }
  const score = clamp((earned / 100) * 100);
  const reason =
    score >= 85
      ? "Every high-weight field is filled — the prompt is well-formed."
      : score >= 60
        ? "The core direction is there; a few descriptors are still empty."
        : "The direction is thin. Fill the primary fields.";
  const fix = missing.length
    ? `Set: ${missing.join(", ")}`
    : promptText.length < 60
      ? "The composed prompt is very short — add subject specifics."
      : undefined;
  return { id: "completeness", label: "Completeness", score, reason, fix };
}

function inspectSpecificity(d: Direction, promptText: string): DimensionScore {
  // Reward concrete nouns and long-tail modifiers; penalise very generic
  // subject phrases and empty environments.
  const subject = d.subject.trim();
  const environment = d.environment.trim();
  let score = 40;
  if (subject.split(/\s+/).length >= 3) score += 20;
  if (environment.length > 12) score += 15;
  if (has(d.material)) score += 10;
  if (has(d.texture)) score += 5;
  if (promptText.length > 220) score += 10;
  score = clamp(score);
  const reason =
    score >= 80
      ? "The prompt names concrete materials, textures, and setting."
      : score >= 55
        ? "Some concrete detail — could be tightened with material or texture."
        : "The prompt is generic. Name the material, surface, and setting.";
  const fix = !has(d.material)
    ? "Pick a Material (ceramic, leather, marble, …)."
    : !has(d.environment)
      ? "Write an Environment sentence."
      : undefined;
  return { id: "specificity", label: "Specificity", score, reason, fix };
}

function inspectComposition(d: Direction): DimensionScore {
  const composed = has(d.composition);
  const aspectSet = has(d.aspect);
  const score = clamp((composed ? 60 : 0) + (aspectSet ? 40 : 0));
  return {
    id: "composition",
    label: "Composition",
    score,
    reason: composed
      ? aspectSet
        ? "Composition and aspect are both set."
        : "Composition is set but aspect is missing."
      : "No composition selected — the AI will guess the framing.",
    fix: !composed ? "Pick a composition (thirds, centered, overhead, …)." : undefined,
  };
}

function inspectLighting(d: Direction): DimensionScore {
  const light = has(d.lighting);
  const time = has(d.timeOfDay);
  const weather = has(d.weather);
  const score = clamp((light ? 60 : 0) + (time ? 25 : 0) + (weather ? 15 : 0));
  return {
    id: "lighting",
    label: "Lighting",
    score,
    reason: light
      ? "Lighting quality is directed — the render will match."
      : "No lighting set — outputs will be inconsistent.",
    fix: !light ? "Pick a lighting style (window, softbox, Rembrandt, …)." : undefined,
  };
}

function inspectCamera(d: Direction): DimensionScore {
  const cam = has(d.camera);
  const lens = has(d.lens);
  const ap = has(d.aperture);
  const score = clamp((cam ? 30 : 0) + (lens ? 40 : 0) + (ap ? 30 : 0));
  return {
    id: "camera",
    label: "Camera",
    score,
    reason:
      cam && lens && ap
        ? "Full camera + lens + aperture — the optics are locked."
        : lens
          ? "Lens is set; camera or aperture still open."
          : "No optics directed — depth-of-field and perspective will drift.",
    fix: !lens
      ? "Pick a lens (35mm, 50mm, 85mm, 100mm macro)."
      : !ap
        ? "Pick an aperture (f/2.8 or f/5.6 are safe defaults)."
        : undefined,
  };
}

function inspectMood(d: Direction): DimensionScore {
  const mood = has(d.mood);
  const grade = has(d.colorGrade);
  const score = clamp((mood ? 60 : 0) + (grade ? 40 : 0));
  return {
    id: "mood",
    label: "Mood",
    score,
    reason: mood
      ? grade
        ? "Mood and color grade are aligned."
        : "Mood is set — a color grade would seal it."
      : "No mood — the render will feel emotionally neutral.",
    fix: !mood ? "Pick a mood (serene, bold, intimate, …)." : undefined,
  };
}

function inspectStyleConsistency(
  d: Direction,
  intendedType?: ShotType,
): DimensionScore {
  if (!intendedType) {
    const score = has(d.style) ? 80 : 40;
    return {
      id: "style-consistency",
      label: "Style consistency",
      score,
      reason: has(d.style)
        ? "Style is directed."
        : "No style seed — outputs may vary in vibe.",
      fix: !has(d.style)
        ? "Apply a Style Library preset or pick a Style chip."
        : undefined,
    };
  }
  const spec = shotSpec(intendedType);
  const matchAspect = d.aspect === spec.aspect;
  const matchComp = d.composition === spec.composition;
  const matchLens = d.lens === spec.lens;
  const hits = [matchAspect, matchComp, matchLens].filter(Boolean).length;
  const score = clamp((hits / 3) * 100);
  return {
    id: "style-consistency",
    label: "Style consistency",
    score,
    reason: `Matches ${hits}/3 of the ${spec.label} shot spec (aspect / comp / lens).`,
    fix:
      hits < 3
        ? `Align with ${spec.label}: aspect ${spec.aspect}, comp ${spec.composition}, lens ${spec.lens}mm.`
        : undefined,
  };
}

function inspectPlatform(
  d: Direction,
  intendedType?: ShotType,
): DimensionScore {
  if (!intendedType) {
    return {
      id: "platform-optimization",
      label: "Platform optimization",
      score: 60,
      reason: "No target platform selected. Applies universally.",
      fix: "Assign a platform (Instagram, TikTok, Pinterest, …) for scoring.",
    };
  }
  const spec = shotSpec(intendedType);
  const matches = d.aspect === spec.aspect;
  return {
    id: "platform-optimization",
    label: "Platform optimization",
    score: matches ? 100 : 45,
    reason: matches
      ? `${spec.label} expects ${spec.aspect} — already aligned.`
      : `${spec.label} expects ${spec.aspect}, currently ${d.aspect}.`,
    fix: matches ? undefined : `Switch aspect to ${spec.aspect}.`,
  };
}

function inspectEstimatedQuality(
  d: Direction,
  promptText: string,
  target?: TargetModelId,
): DimensionScore {
  // Blend of length, quality field, and target-model bias.
  let score = 40;
  if (promptText.length > 200) score += 20;
  if (d.quality === "ultra") score += 20;
  if (d.quality === "high") score += 10;
  if (has(d.render)) score += 10;
  if (target === "midjourney" || target === "flux") score += 10;
  return {
    id: "estimated-quality",
    label: "Estimated quality",
    score: clamp(score),
    reason:
      score >= 85
        ? "Long, well-directed prompt paired with a high-quality render target."
        : score >= 65
          ? "Solid — could bump quality to Ultra or lengthen the prompt."
          : "Thin brief and low quality target — expect a rough render.",
    fix:
      d.quality !== "ultra"
        ? "Consider raising Quality to Ultra for the final take."
        : undefined,
  };
}

// ─── Public entry ─────────────────────────────────────────────────────────

export function inspectPrompt(
  direction: Direction,
  promptText: string,
  opts?: { intendedType?: ShotType; targetModel?: TargetModelId },
): InspectionReport {
  const dims: DimensionScore[] = [
    inspectCompleteness(direction, promptText),
    inspectSpecificity(direction, promptText),
    inspectComposition(direction),
    inspectLighting(direction),
    inspectCamera(direction),
    inspectMood(direction),
    inspectStyleConsistency(direction, opts?.intendedType),
    inspectPlatform(direction, opts?.intendedType),
    inspectEstimatedQuality(direction, promptText, opts?.targetModel),
  ];
  const overall = clamp(
    dims.reduce((sum, d) => sum + d.score, 0) / dims.length,
  );
  return { overall, dimensions: dims };
}
