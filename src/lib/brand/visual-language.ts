/**
 * Visual language — every brand's design token surface. Colours,
 * typography, spacing, radius, shadows, gradients, plus creative
 * direction fields (photography, lighting, camera, composition).
 */

// ─── Color palette ───────────────────────────────────────────────────────

export type ColorRole =
  | "primary"
  | "secondary"
  | "accent"
  | "neutral"
  | "background"
  | "surface"
  | "success"
  | "danger";

export type ColorEntry = {
  id: string;
  role: ColorRole;
  label: string;
  /** Hex string, e.g. #c8f04e */
  value: string;
  note?: string;
};

// ─── Typography ──────────────────────────────────────────────────────────

export type TypographyRole = "display" | "heading" | "body" | "mono" | "editorial";

export type TypographyEntry = {
  id: string;
  role: TypographyRole;
  family: string;
  weight?: string;
  spacing?: string;
  note?: string;
};

// ─── Tokens ──────────────────────────────────────────────────────────────

export type SpacingScale = {
  base: number;
  scale: number[];
};

export type RadiusScale = {
  sm: number;
  md: number;
  lg: number;
  xl: number;
};

export type ShadowEntry = {
  id: string;
  label: string;
  value: string;
};

export type GradientEntry = {
  id: string;
  label: string;
  /** CSS gradient string */
  value: string;
};

// ─── Creative direction ─────────────────────────────────────────────────

export type PhotographyStyle =
  | "editorial"
  | "documentary"
  | "minimal"
  | "cinematic"
  | "commercial"
  | "candid"
  | "aspirational";

export type LightingStyle =
  | "golden-hour"
  | "soft-window"
  | "studio-softbox"
  | "hard-sun"
  | "rembrandt"
  | "neon"
  | "backlit-rim"
  | "overcast"
  | "candlelit"
  | "mixed";

export type CameraStyle =
  | "35mm"
  | "50mm"
  | "85mm"
  | "100mm-macro"
  | "medium-format"
  | "handheld"
  | "tripod";

export type CompositionRule =
  | "thirds"
  | "centered"
  | "negative-space"
  | "overhead"
  | "closeup"
  | "leading-lines"
  | "symmetry"
  | "frame-in-frame";

// ─── Texture / illustration / iconography / motion ──────────────────────

export type TextureEntry = {
  id: string;
  label: string;
  note?: string;
  /** Optional external reference URL */
  url?: string;
};

export type IllustrationStyle =
  | "line"
  | "flat"
  | "geometric"
  | "hand-drawn"
  | "grainy"
  | "3d"
  | "editorial-collage";

export type IconStyle =
  | "line"
  | "duotone"
  | "filled"
  | "hand-drawn"
  | "geometric"
  | "editorial";

export type AnimationLanguage =
  | "smooth"
  | "spring"
  | "cinematic"
  | "playful"
  | "hand-drawn"
  | "minimal";

// ─── Logo + patterns ────────────────────────────────────────────────────

export type LogoAsset = {
  id: string;
  label: string;
  kind: "primary" | "wordmark" | "monogram" | "icon";
  note?: string;
  url?: string;
};

export type BrandPattern = {
  id: string;
  label: string;
  /** CSS background or SVG data URI */
  value: string;
  note?: string;
};

// ─── Visual language root ───────────────────────────────────────────────

export type VisualLanguage = {
  colors: ColorEntry[];
  typography: TypographyEntry[];
  spacing: SpacingScale;
  radius: RadiusScale;
  shadows: ShadowEntry[];
  gradients: GradientEntry[];
  photography: PhotographyStyle;
  lighting: LightingStyle;
  camera: CameraStyle;
  composition: CompositionRule;
  textures: TextureEntry[];
  illustration: IllustrationStyle;
  iconography: IconStyle;
  animation: AnimationLanguage;
  logos: LogoAsset[];
  patterns: BrandPattern[];
};

export function defaultVisualLanguage(): VisualLanguage {
  return {
    colors: [
      { id: "color-primary", role: "primary", label: "Primary", value: "#c8f04e" },
      { id: "color-ink", role: "neutral", label: "Ink", value: "#0f100f" },
      { id: "color-surface", role: "surface", label: "Surface", value: "#f6f5f2" },
    ],
    typography: [
      { id: "type-display", role: "display", family: "Geist", weight: "600" },
      { id: "type-body", role: "body", family: "Inter", weight: "400" },
    ],
    spacing: { base: 4, scale: [1, 2, 3, 4, 6, 8, 12, 16, 24] },
    radius: { sm: 6, md: 12, lg: 20, xl: 32 },
    shadows: [
      { id: "shadow-quiet", label: "Quiet", value: "0 2px 6px rgba(0,0,0,0.06)" },
      { id: "shadow-lift", label: "Lift", value: "0 12px 40px -12px rgba(0,0,0,0.24)" },
    ],
    gradients: [
      {
        id: "grad-warm",
        label: "Warm sunset",
        value: "linear-gradient(135deg, #f6a55c 0%, #d24c56 100%)",
      },
    ],
    photography: "editorial",
    lighting: "soft-window",
    camera: "50mm",
    composition: "negative-space",
    textures: [],
    illustration: "line",
    iconography: "line",
    animation: "smooth",
    logos: [],
    patterns: [],
  };
}

// ─── Mutations ───────────────────────────────────────────────────────────

export function addColor(vl: VisualLanguage, entry: ColorEntry): VisualLanguage {
  const filtered = vl.colors.filter((c) => c.id !== entry.id);
  return { ...vl, colors: [...filtered, entry] };
}

export function removeColor(vl: VisualLanguage, id: string): VisualLanguage {
  return { ...vl, colors: vl.colors.filter((c) => c.id !== id) };
}

export function addTypography(
  vl: VisualLanguage,
  entry: TypographyEntry,
): VisualLanguage {
  const filtered = vl.typography.filter((t) => t.id !== entry.id);
  return { ...vl, typography: [...filtered, entry] };
}

export function removeTypography(vl: VisualLanguage, id: string): VisualLanguage {
  return { ...vl, typography: vl.typography.filter((t) => t.id !== id) };
}

export function updateVisual(
  vl: VisualLanguage,
  patch: Partial<VisualLanguage>,
): VisualLanguage {
  return { ...vl, ...patch };
}

// ─── Reads ──────────────────────────────────────────────────────────────

export function primaryColor(vl: VisualLanguage): string | undefined {
  return vl.colors.find((c) => c.role === "primary")?.value;
}

export function neutrals(vl: VisualLanguage): ColorEntry[] {
  return vl.colors.filter((c) => c.role === "neutral" || c.role === "surface" || c.role === "background");
}

export function accents(vl: VisualLanguage): ColorEntry[] {
  return vl.colors.filter((c) => c.role === "accent");
}

/**
 * Roughly measures how minimal a palette feels: fewer colours + higher
 * ratio of neutrals scores higher.
 */
export function paletteMinimalismScore(vl: VisualLanguage): number {
  const total = vl.colors.length || 1;
  const neutralCount = neutrals(vl).length;
  const primary = vl.colors.filter((c) => c.role === "primary").length;
  const accentCount = accents(vl).length;
  let score = 40 + Math.max(0, 30 - accentCount * 8);
  if (neutralCount / total > 0.5) score += 15;
  if (primary === 1) score += 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}
