/**
 * Style Library — reusable visual signatures.
 *
 * A saved style is a lightweight snapshot of the Direction fields that
 * define a look (style, mood, lighting, composition, camera, colorGrade,
 * render). One-click apply lets the creator pin a style to any subject
 * without re-tuning the whole board.
 *
 * Twelve brand-inspired presets ship out of the box; the creator can add
 * their own on top. State is persisted globally (not per project) so a
 * style trained on one launch carries over to the next.
 *
 * Pure. No React.
 */

import type { Direction } from "./prompt";

/**
 * Fields a SavedStyle can override. Anything absent is left untouched
 * when applied, so a style focused on lighting won't clobber a chosen
 * camera unless the creator asked it to.
 */
export type StyleOverrides = Partial<
  Pick<
    Direction,
    | "style"
    | "mood"
    | "lighting"
    | "composition"
    | "colorGrade"
    | "camera"
    | "lens"
    | "aperture"
    | "material"
    | "texture"
    | "render"
    | "quality"
  >
>;

export type SavedStyle = {
  id: string;
  /** Display name (Apple, Nike, "Custom 2026-03-14"). */
  name: string;
  /** Optional descriptive tag shown as a chip. */
  vibe?: string;
  /** Direction fields this style overrides on apply. */
  overrides: StyleOverrides;
  /**
   * Freeform hint appended to the prompt (e.g. "quiet confidence,
   * generous negative space"). The prompt composer treats this as
   * a style suffix.
   */
  suffix?: string;
  /** Hex color used to render the tile swatch. */
  swatch?: string;
  /** True when the style is a curated preset (immutable). */
  preset?: boolean;
  createdAt: number;
};

// ─── Brand presets ──────────────────────────────────────────────────
// Twelve archetypes drawn from what creators reference most often. Each
// tunes ~4-6 Direction fields plus a short prompt suffix so the applied
// look reads immediately.

export const PRESET_STYLES: SavedStyle[] = [
  {
    id: "preset.apple",
    name: "Apple",
    vibe: "Minimal · Confident",
    swatch: "#f5f5f7",
    overrides: {
      style: "editorial",
      mood: "refined",
      lighting: "soft",
      composition: "centered",
      colorGrade: "neutral",
      render: "photographic",
      quality: "high",
    },
    suffix: "clinical white background, deliberate negative space, product hero",
    preset: true,
    createdAt: 0,
  },
  {
    id: "preset.nike",
    name: "Nike",
    vibe: "Dynamic · Bold",
    swatch: "#111111",
    overrides: {
      style: "kinetic",
      mood: "energetic",
      lighting: "high-contrast",
      composition: "diagonal",
      colorGrade: "warm",
      camera: "sony-a1",
      render: "photographic",
    },
    suffix: "athletic urgency, deep shadows, energetic frame",
    preset: true,
    createdAt: 0,
  },
  {
    id: "preset.aesop",
    name: "Aesop",
    vibe: "Editorial · Warm",
    swatch: "#c4a26a",
    overrides: {
      style: "editorial",
      mood: "refined",
      lighting: "window",
      composition: "negative",
      colorGrade: "warm",
      material: "brass",
      texture: "matte",
      render: "photographic",
    },
    suffix: "warm brass fittings, apothecary calm, quiet luxury",
    preset: true,
    createdAt: 0,
  },
  {
    id: "preset.luxury-editorial",
    name: "Luxury Editorial",
    vibe: "Magazine · Refined",
    swatch: "#efe6d6",
    overrides: {
      style: "editorial",
      mood: "refined",
      lighting: "soft",
      composition: "negative",
      colorGrade: "warm",
      render: "photographic",
      quality: "high",
    },
    suffix: "magazine-quality retouch, generous margins, restrained palette",
    preset: true,
    createdAt: 0,
  },
  {
    id: "preset.cyberpunk",
    name: "Cyberpunk",
    vibe: "Neon · Rain-slick",
    swatch: "#8b5cf6",
    overrides: {
      style: "cinematic",
      mood: "moody",
      lighting: "neon",
      composition: "diagonal",
      colorGrade: "cool",
      camera: "arri-alexa",
      render: "cinematic",
    },
    suffix: "neon rim light, rain-slick streets, deep chromatic aberration",
    preset: true,
    createdAt: 0,
  },
  {
    id: "preset.streetwear",
    name: "Streetwear",
    vibe: "Confident · Textural",
    swatch: "#f97316",
    overrides: {
      style: "documentary",
      mood: "confident",
      lighting: "direct-sun",
      composition: "centered",
      colorGrade: "warm",
      texture: "grainy",
      render: "photographic",
    },
    suffix: "documentary swagger, grainy film stock, magazine cover confidence",
    preset: true,
    createdAt: 0,
  },
  {
    id: "preset.minimal",
    name: "Minimal",
    vibe: "Airy · Quiet",
    swatch: "#e5e7eb",
    overrides: {
      style: "editorial",
      mood: "calm",
      lighting: "soft",
      composition: "negative",
      colorGrade: "neutral",
      render: "photographic",
      quality: "high",
    },
    suffix: "abundant negative space, single controlled highlight, breathable",
    preset: true,
    createdAt: 0,
  },
  {
    id: "preset.dark-luxury",
    name: "Dark Luxury",
    vibe: "Moody · Opulent",
    swatch: "#1c1917",
    overrides: {
      style: "editorial",
      mood: "moody",
      lighting: "chiaroscuro",
      composition: "negative",
      colorGrade: "warm",
      material: "brass",
      render: "cinematic",
      quality: "high",
    },
    suffix: "chiaroscuro shadow, opulent surfaces, quiet confidence",
    preset: true,
    createdAt: 0,
  },
  {
    id: "preset.japanese-minimalism",
    name: "Japanese Minimalism",
    vibe: "Wabi-sabi · Considered",
    swatch: "#d6d3d1",
    overrides: {
      style: "editorial",
      mood: "meditative",
      lighting: "natural",
      composition: "asymmetric",
      colorGrade: "neutral",
      material: "linen",
      texture: "matte",
      render: "photographic",
    },
    suffix: "wabi-sabi patina, asymmetric balance, sunlit tatami",
    preset: true,
    createdAt: 0,
  },
  {
    id: "preset.scandinavian",
    name: "Scandinavian",
    vibe: "Bright · Restrained",
    swatch: "#e0f2fe",
    overrides: {
      style: "editorial",
      mood: "calm",
      lighting: "diffuse-north",
      composition: "centered",
      colorGrade: "cool",
      material: "oak",
      render: "photographic",
    },
    suffix: "diffuse northern light, oak surfaces, restrained palette",
    preset: true,
    createdAt: 0,
  },
  {
    id: "preset.y2k",
    name: "Y2K",
    vibe: "Iridescent · Playful",
    swatch: "#22d3ee",
    overrides: {
      style: "graphic",
      mood: "playful",
      lighting: "colored-gels",
      composition: "layered",
      colorGrade: "vibrant",
      texture: "glossy",
      render: "photographic",
    },
    suffix: "iridescent surfaces, colored-gel highlights, chrome bloom",
    preset: true,
    createdAt: 0,
  },
  {
    id: "preset.vintage-magazine",
    name: "Vintage Magazine",
    vibe: "Kodak · Halated",
    swatch: "#fbbf24",
    overrides: {
      style: "documentary",
      mood: "nostalgic",
      lighting: "window",
      composition: "centered",
      colorGrade: "warm",
      texture: "grainy",
      render: "film",
    },
    suffix: "Kodak Portra 400, gentle halation on highlights, warm shift",
    preset: true,
    createdAt: 0,
  },
];

// ─── CRUD helpers ───────────────────────────────────────────────────

let styleCounter = 0;
export function nextStyleId(prefix: string = "style", now: number = Date.now()): string {
  styleCounter += 1;
  return `${prefix}-${now}-${styleCounter}`;
}

/**
 * Return a merged list: user styles followed by presets. Presets sit at the
 * end so a user's own libraries lead their gallery.
 */
export function withPresets(userStyles: SavedStyle[]): SavedStyle[] {
  const userIds = new Set(userStyles.map((s) => s.id));
  return [...userStyles, ...PRESET_STYLES.filter((p) => !userIds.has(p.id))];
}

/**
 * Save a new style. Trims + guards a blank name and rejects duplicates by
 * (name, overrides shape). Returns { list, id } on success, or the input
 * list with id=null when rejected.
 */
export function saveStyle(
  list: SavedStyle[],
  input: {
    name: string;
    vibe?: string;
    overrides: StyleOverrides;
    suffix?: string;
    swatch?: string;
  },
  now: number = Date.now(),
): { list: SavedStyle[]; id: string | null } {
  const name = input.name.trim();
  if (!name) return { list, id: null };
  // Reject if a user already saved a style with the same name.
  if (list.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
    return { list, id: null };
  }
  const style: SavedStyle = {
    id: nextStyleId("style", now),
    name,
    vibe: input.vibe,
    overrides: { ...input.overrides },
    suffix: input.suffix,
    swatch: input.swatch,
    createdAt: now,
  };
  return { list: [style, ...list], id: style.id };
}

/**
 * Delete a user style. Preset styles are protected and never removed.
 */
export function deleteStyle(list: SavedStyle[], id: string): SavedStyle[] {
  return list.filter((s) => s.id !== id || s.preset === true);
}

/**
 * Apply a style's overrides on top of a Direction. Only fields the style
 * defines are updated; anything unset stays intact. Returns a new Direction.
 */
export function applyStyleTo(
  direction: Direction,
  style: SavedStyle,
): Direction {
  const next: Direction = { ...direction };
  const keys = Object.keys(style.overrides) as Array<keyof StyleOverrides>;
  for (const k of keys) {
    const v = style.overrides[k];
    if (v === undefined) continue;
    // Narrow: k is a keyof StyleOverrides which is a subset of Direction
    (next as unknown as Record<string, unknown>)[k as string] = v;
  }
  return next;
}
