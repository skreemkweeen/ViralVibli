/**
 * Reference Wall — typed references (image / URL / palette / gradient /
 * typography / texture / material / motion / note) with a deterministic
 * analyzer that reads each reference into a small signal bundle: dominant
 * colors, lighting hint, composition hint, camera style, visual density,
 * mood, and brand similarity.
 *
 * The wall never fetches — it works on what the creator has already
 * described in the reference itself (hex swatches, tags, URLs). Every
 * signal maps to a suggested Direction patch so the wall can influence
 * the composed prompt in a controlled, reviewable way.
 */

import type { Direction } from "./prompt";

// ─── Types ────────────────────────────────────────────────────────────────

export type ReferenceKind =
  | "image"
  | "url"
  | "palette"
  | "gradient"
  | "typography"
  | "texture"
  | "material"
  | "motion"
  | "note";

export type ReferenceItem = {
  id: string;
  kind: ReferenceKind;
  title: string;
  url?: string;
  /** Freeform description / brand hint / note body */
  note?: string;
  /** Hex swatches for palette / gradient / image references */
  swatches?: string[];
  /** Tags that describe the vibe (e.g. "warm", "minimal", "editorial") */
  tags?: string[];
  createdAt: number;
};

export type ReferenceAnalysis = {
  id: string;
  dominantColors: string[];
  luminance: "dark" | "mid" | "light";
  temperature: "warm" | "neutral" | "cool";
  saturation: "muted" | "balanced" | "vivid";
  visualDensity: "sparse" | "balanced" | "busy";
  lightingHint?: string;
  compositionHint?: string;
  cameraStyle?: string;
  mood?: string;
  aestheticTags: string[];
  /** 0-100 similarity to the caller's provided brand vocabulary */
  brandSimilarity: number;
};

// ─── Colour math ──────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace(/^#/, "").trim();
  if (clean.length !== 6) return null;
  const n = parseInt(clean, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((c) => c / 255);
  const lin = (v: number) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!);
}

function saturation(rgb: [number, number, number]): number {
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

function warmth(rgb: [number, number, number]): number {
  // Rough — positive = warm, negative = cool. R vs B channel bias.
  const [r, , b] = rgb;
  return (r - b) / 255;
}

// ─── Analyzer ─────────────────────────────────────────────────────────────

export type AnalyzeOpts = {
  brandVocabulary?: string[]; // words that describe the brand
};

export function analyzeReference(
  ref: ReferenceItem,
  opts: AnalyzeOpts = {},
): ReferenceAnalysis {
  const swatches = (ref.swatches ?? []).slice(0, 6);
  const rgbs = swatches
    .map((s) => hexToRgb(s))
    .filter((v): v is [number, number, number] => !!v);

  // Luminance
  let luminance: ReferenceAnalysis["luminance"] = "mid";
  if (rgbs.length) {
    const avg = rgbs.reduce((n, c) => n + relativeLuminance(c), 0) / rgbs.length;
    luminance = avg < 0.2 ? "dark" : avg > 0.6 ? "light" : "mid";
  } else if (ref.tags?.some((t) => /dark|moody|black|shadow/i.test(t))) {
    luminance = "dark";
  } else if (ref.tags?.some((t) => /light|bright|airy|white/i.test(t))) {
    luminance = "light";
  }

  // Temperature
  let temperature: ReferenceAnalysis["temperature"] = "neutral";
  if (rgbs.length) {
    const w = rgbs.reduce((n, c) => n + warmth(c), 0) / rgbs.length;
    temperature = w > 0.08 ? "warm" : w < -0.08 ? "cool" : "neutral";
  } else if (ref.tags?.some((t) => /warm|golden|amber|honey/i.test(t))) {
    temperature = "warm";
  } else if (ref.tags?.some((t) => /cool|steel|blue|glacial/i.test(t))) {
    temperature = "cool";
  }

  // Saturation
  let sat: ReferenceAnalysis["saturation"] = "balanced";
  if (rgbs.length) {
    const avg = rgbs.reduce((n, c) => n + saturation(c), 0) / rgbs.length;
    sat = avg < 0.2 ? "muted" : avg > 0.6 ? "vivid" : "balanced";
  } else if (ref.tags?.some((t) => /muted|desaturated|neutral/i.test(t))) {
    sat = "muted";
  } else if (ref.tags?.some((t) => /bold|saturated|vibrant/i.test(t))) {
    sat = "vivid";
  }

  // Density — how many swatches / tags / notes carry weight
  const density =
    (swatches.length >= 5 ? 1 : 0) +
    ((ref.tags?.length ?? 0) >= 4 ? 1 : 0) +
    (ref.note && ref.note.length > 60 ? 1 : 0);
  const visualDensity: ReferenceAnalysis["visualDensity"] =
    density >= 2 ? "busy" : density === 1 ? "balanced" : "sparse";

  // Hint mapping from tags
  const tagText = (ref.tags ?? []).map((t) => t.toLowerCase());
  const lightingHint = tagText.find((t) =>
    /(window|softbox|golden|rembrandt|neon|overcast|candle|hard-sun|rim)/i.test(t),
  );
  const compositionHint = tagText.find((t) =>
    /(overhead|centered|thirds|negative|closeup|dutch|symmetry|frame|leading)/i.test(t),
  );
  const cameraStyle = tagText.find((t) =>
    /(macro|editorial|documentary|film|analog|cinematic|studio)/i.test(t),
  );
  const mood = tagText.find((t) =>
    /(serene|bold|intimate|energetic|nostalgic|mysterious|playful|refined)/i.test(t),
  );

  // Brand similarity — proportion of brand vocab that appears in title +
  // note + tags, normalised to 0-100.
  const vocab = (opts.brandVocabulary ?? []).map((v) => v.toLowerCase());
  const searchText = [
    ref.title ?? "",
    ref.note ?? "",
    ...(ref.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  const hits = vocab.filter((v) => v && searchText.includes(v)).length;
  const brandSimilarity = vocab.length
    ? Math.min(100, Math.round((hits / vocab.length) * 100))
    : 0;

  return {
    id: ref.id,
    dominantColors: swatches,
    luminance,
    temperature,
    saturation: sat,
    visualDensity,
    lightingHint,
    compositionHint,
    cameraStyle,
    mood,
    aestheticTags: tagText,
    brandSimilarity,
  };
}

export function analyzeWall(
  refs: ReferenceItem[],
  opts: AnalyzeOpts = {},
): ReferenceAnalysis[] {
  return refs.map((r) => analyzeReference(r, opts));
}

// ─── Aggregate → Direction proposal ───────────────────────────────────────

export type DirectionProposal = {
  patch: Partial<Direction>;
  reasoning: Array<{ field: keyof Direction; value: string; source: string }>;
};

/**
 * Read the aggregate analysis into a proposed Direction patch. The
 * proposal is a *suggestion* — callers apply it via a separate accept
 * flow so the creator stays in control.
 */
export function proposeFromWall(
  analyses: ReferenceAnalysis[],
): DirectionProposal {
  const patch: Partial<Direction> = {};
  const reasoning: DirectionProposal["reasoning"] = [];
  if (analyses.length === 0) return { patch, reasoning };

  // Majority-vote helpers
  function majority<T extends string>(
    values: (T | undefined)[],
  ): T | undefined {
    const counts = new Map<T, number>();
    for (const v of values) {
      if (!v) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    let best: T | undefined;
    let bestN = 0;
    for (const [k, n] of counts) {
      if (n > bestN) {
        best = k;
        bestN = n;
      }
    }
    return best;
  }

  // Mood
  const mood = majority(analyses.map((a) => a.mood));
  if (mood) {
    patch.mood = mood;
    reasoning.push({ field: "mood", value: mood, source: "reference tags" });
  }

  // Lighting
  const light = majority(analyses.map((a) => a.lightingHint));
  if (light) {
    patch.lighting = normaliseLighting(light);
    reasoning.push({
      field: "lighting",
      value: patch.lighting!,
      source: "reference lighting tags",
    });
  }

  // Composition
  const comp = majority(analyses.map((a) => a.compositionHint));
  if (comp) {
    patch.composition = normaliseComposition(comp);
    reasoning.push({
      field: "composition",
      value: patch.composition!,
      source: "reference composition tags",
    });
  }

  // Camera style → style field
  const cam = majority(analyses.map((a) => a.cameraStyle));
  if (cam) {
    patch.style = normaliseStyle(cam);
    reasoning.push({
      field: "style",
      value: patch.style!,
      source: "reference camera style",
    });
  }

  // Temperature + saturation → colorGrade
  const temp = majority(analyses.map((a) => a.temperature));
  const sat = majority(analyses.map((a) => a.saturation));
  const grade = deriveGrade(temp, sat);
  if (grade) {
    patch.colorGrade = grade;
    reasoning.push({
      field: "colorGrade",
      value: grade,
      source: `avg swatch temperature ${temp ?? "neutral"} / saturation ${sat ?? "balanced"}`,
    });
  }

  return { patch, reasoning };
}

// ─── Vocabulary normalisers ───────────────────────────────────────────────
//
// Reference tags are freeform. Normalise to the ids the store expects.

function normaliseLighting(hint: string): string {
  const t = hint.toLowerCase();
  if (t.includes("softbox")) return "softbox";
  if (t.includes("golden")) return "golden";
  if (t.includes("window")) return "window";
  if (t.includes("rembrandt")) return "rembrandt";
  if (t.includes("neon")) return "neon";
  if (t.includes("overcast")) return "overcast";
  if (t.includes("candle")) return "candle";
  if (t.includes("hard-sun") || t.includes("hard sun")) return "hard-sun";
  if (t.includes("rim")) return "rim";
  return t;
}

function normaliseComposition(hint: string): string {
  const t = hint.toLowerCase();
  if (t.includes("overhead")) return "overhead";
  if (t.includes("centered")) return "centered";
  if (t.includes("negative")) return "negative";
  if (t.includes("closeup") || t.includes("close-up")) return "closeup";
  if (t.includes("thirds")) return "thirds";
  if (t.includes("dutch")) return "dutch";
  if (t.includes("symmetry")) return "symmetry";
  if (t.includes("leading")) return "leading";
  if (t.includes("frame")) return "frame";
  return t;
}

function normaliseStyle(hint: string): string {
  const t = hint.toLowerCase();
  if (t.includes("editorial")) return "editorial";
  if (t.includes("cinematic")) return "cinematic";
  if (t.includes("documentary")) return "documentary";
  if (t.includes("macro")) return "surreal"; // no direct macro style — keep neutral
  if (t.includes("film") || t.includes("analog")) return "vintage";
  if (t.includes("studio")) return "minimal";
  return t;
}

function deriveGrade(
  temp: ReferenceAnalysis["temperature"] | undefined,
  sat: ReferenceAnalysis["saturation"] | undefined,
): string | undefined {
  if (temp === "warm" && sat !== "vivid") return "warm-film";
  if (temp === "cool") return "cool-editorial";
  if (sat === "muted") return "pastel";
  if (sat === "vivid") return "rich";
  return undefined;
}
