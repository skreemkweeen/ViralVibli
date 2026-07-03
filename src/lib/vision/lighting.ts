/**
 * Lighting Designer — a professional-plausible lighting rig you can tune
 * per light and visualise as a polar SVG diagram.
 *
 * Six canonical roles cover almost every studio + natural setup:
 *
 *   Key       — the primary shaper of form
 *   Fill      — softens shadow side without altering the key direction
 *   Rim       — separates subject from background from behind
 *   Hair      — clean top light picking out the hair or top edge
 *   Practical — an in-scene light (lamp, window, screen) as motivated source
 *   Ambient   — the base fill for the environment; carries the overall temp
 *
 * Each light carries intensity 0..100, softness 0..100 (soft = higher →
 * broader falloff), temperature in Kelvin (2000..10000), an angle in
 * degrees around the subject (0° = camera-front, 90° = camera-right, etc.),
 * and a modifier tag (softbox, octabox, umbrella, grid, window, bounce,
 * flag, reflector).
 *
 * Six preset setups let a creator start from a well-formed rig with one
 * click: three-point / natural-window / rembrandt / split / high-key /
 * low-key.
 *
 * Pure. No React.
 */

export type LightRole =
  | "key"
  | "fill"
  | "rim"
  | "hair"
  | "practical"
  | "ambient";

export type LightModifier =
  | "softbox"
  | "octabox"
  | "umbrella"
  | "grid"
  | "window"
  | "bounce"
  | "flag"
  | "reflector"
  | "none";

export type Light = {
  role: LightRole;
  /** Whether this light is currently active in the rig. */
  enabled: boolean;
  /** 0..100 relative brightness. */
  intensity: number;
  /** 0..100 hardness (0) → softness (100). */
  softness: number;
  /** Colour temperature in Kelvin. 5500 ≈ daylight, 3200 ≈ tungsten. */
  temperature: number;
  /** Angle in degrees around the subject. 0 = camera side, 180 = behind. */
  angle: number;
  /** Height in metres above the subject centre — informs the polar diagram. */
  height: number;
  modifier: LightModifier;
};

export type LightingSetup = {
  lights: Record<LightRole, Light>;
  presetId?: LightingPresetId;
};

export const LIGHT_ROLES: LightRole[] = [
  "key",
  "fill",
  "rim",
  "hair",
  "practical",
  "ambient",
];

// ─── Baseline light ─────────────────────────────────────────────────

export function defaultLight(role: LightRole): Light {
  const base = {
    role,
    enabled: false,
    intensity: 60,
    softness: 60,
    temperature: 5500,
    angle: 0,
    height: 1.6,
    modifier: "softbox" as LightModifier,
  };
  switch (role) {
    case "key":
      return { ...base, enabled: true, intensity: 85, angle: 45, height: 1.8, modifier: "octabox" };
    case "fill":
      return { ...base, enabled: true, intensity: 45, angle: -45, height: 1.6, modifier: "bounce" };
    case "rim":
      return { ...base, intensity: 65, angle: 165, height: 1.7, modifier: "grid" };
    case "hair":
      return { ...base, intensity: 55, angle: 180, height: 2.4, modifier: "grid" };
    case "practical":
      return { ...base, intensity: 40, angle: 90, height: 1.2, temperature: 3200, modifier: "none" };
    case "ambient":
      return { ...base, enabled: true, intensity: 25, angle: 0, height: 2.0, modifier: "window", softness: 90 };
  }
}

export function emptyLightingSetup(): LightingSetup {
  return {
    lights: {
      key: defaultLight("key"),
      fill: defaultLight("fill"),
      rim: defaultLight("rim"),
      hair: defaultLight("hair"),
      practical: defaultLight("practical"),
      ambient: defaultLight("ambient"),
    },
  };
}

// ─── Presets ────────────────────────────────────────────────────────

export type LightingPresetId =
  | "three-point"
  | "natural-window"
  | "rembrandt"
  | "split"
  | "high-key"
  | "low-key";

export type LightingPreset = {
  id: LightingPresetId;
  label: string;
  vibe: string;
  apply: (setup: LightingSetup) => LightingSetup;
};

function withLight(
  setup: LightingSetup,
  role: LightRole,
  patch: Partial<Light>,
): LightingSetup {
  return {
    ...setup,
    lights: {
      ...setup.lights,
      [role]: { ...setup.lights[role], ...patch },
    },
  };
}

function disable(setup: LightingSetup, roles: LightRole[]): LightingSetup {
  const next = { ...setup, lights: { ...setup.lights } };
  for (const r of roles) {
    next.lights[r] = { ...next.lights[r], enabled: false };
  }
  return next;
}

export const LIGHTING_PRESETS: LightingPreset[] = [
  {
    id: "three-point",
    label: "Three-point",
    vibe: "Balanced editorial",
    apply: (base) => {
      let s = base;
      s = withLight(s, "key", { enabled: true, intensity: 85, angle: 45, softness: 60, modifier: "octabox" });
      s = withLight(s, "fill", { enabled: true, intensity: 45, angle: -45, softness: 80, modifier: "bounce" });
      s = withLight(s, "rim", { enabled: true, intensity: 65, angle: 165, softness: 30, modifier: "grid" });
      s = withLight(s, "hair", { enabled: false });
      s = withLight(s, "practical", { enabled: false });
      s = withLight(s, "ambient", { enabled: true, intensity: 25, softness: 90 });
      return { ...s, presetId: "three-point" };
    },
  },
  {
    id: "natural-window",
    label: "Natural window",
    vibe: "Warm editorial daylight",
    apply: (base) => {
      let s = disable(base, ["rim", "hair", "practical"]);
      s = withLight(s, "key", { enabled: true, intensity: 70, angle: 60, softness: 95, temperature: 5200, modifier: "window" });
      s = withLight(s, "fill", { enabled: true, intensity: 35, angle: -60, softness: 90, temperature: 5000, modifier: "bounce" });
      s = withLight(s, "ambient", { enabled: true, intensity: 30, softness: 100, temperature: 5000 });
      return { ...s, presetId: "natural-window" };
    },
  },
  {
    id: "rembrandt",
    label: "Rembrandt",
    vibe: "Chiaroscuro portrait",
    apply: (base) => {
      let s = disable(base, ["rim", "hair", "practical"]);
      s = withLight(s, "key", { enabled: true, intensity: 90, angle: 45, height: 2.2, softness: 40, modifier: "octabox", temperature: 4200 });
      s = withLight(s, "fill", { enabled: true, intensity: 20, angle: -45, softness: 60, modifier: "bounce" });
      s = withLight(s, "ambient", { enabled: true, intensity: 12, softness: 100 });
      return { ...s, presetId: "rembrandt" };
    },
  },
  {
    id: "split",
    label: "Split",
    vibe: "Cinematic contrast",
    apply: (base) => {
      let s = disable(base, ["fill", "hair", "practical"]);
      s = withLight(s, "key", { enabled: true, intensity: 95, angle: 90, softness: 30, modifier: "grid", temperature: 4500 });
      s = withLight(s, "rim", { enabled: true, intensity: 70, angle: -90, softness: 20, modifier: "grid" });
      s = withLight(s, "ambient", { enabled: true, intensity: 8, softness: 100 });
      return { ...s, presetId: "split" };
    },
  },
  {
    id: "high-key",
    label: "High key",
    vibe: "Bright airy commercial",
    apply: (base) => {
      let s = disable(base, ["rim", "hair", "practical"]);
      s = withLight(s, "key", { enabled: true, intensity: 100, angle: 30, softness: 100, modifier: "softbox" });
      s = withLight(s, "fill", { enabled: true, intensity: 80, angle: -30, softness: 100, modifier: "softbox" });
      s = withLight(s, "ambient", { enabled: true, intensity: 65, softness: 100 });
      return { ...s, presetId: "high-key" };
    },
  },
  {
    id: "low-key",
    label: "Low key",
    vibe: "Moody luxury",
    apply: (base) => {
      let s = disable(base, ["fill", "hair", "practical"]);
      s = withLight(s, "key", { enabled: true, intensity: 80, angle: 60, softness: 50, modifier: "octabox", temperature: 3800 });
      s = withLight(s, "rim", { enabled: true, intensity: 55, angle: 170, softness: 20, modifier: "grid" });
      s = withLight(s, "ambient", { enabled: true, intensity: 5, softness: 100 });
      return { ...s, presetId: "low-key" };
    },
  },
];

export function findPreset(id: LightingPresetId): LightingPreset | null {
  return LIGHTING_PRESETS.find((p) => p.id === id) ?? null;
}

// ─── Diagram geometry ───────────────────────────────────────────────

export type LightDiagramNode = {
  role: LightRole;
  x: number;
  y: number;
  active: boolean;
  colorHex: string; // colour temperature → screen hue
  intensity: number;
  softness: number;
  temperature: number;
  modifier: LightModifier;
};

/**
 * Compute the (x, y) placement of every light on a unit-radius circle
 * around the subject at origin. Angle 0 = up (behind camera). Positive
 * angles rotate clockwise so 90° is camera-right.
 */
export function computeLightingDiagram(
  setup: LightingSetup,
  radius: number = 1,
): LightDiagramNode[] {
  const nodes: LightDiagramNode[] = [];
  for (const role of LIGHT_ROLES) {
    const l = setup.lights[role];
    const rad = (l.angle * Math.PI) / 180;
    // Angle 0 → subject front (camera side); use -sin/-cos so 0 is at bottom
    // of the SVG (camera is below subject in a top-down orientation).
    const x = Math.sin(rad) * radius;
    const y = -Math.cos(rad) * radius;
    nodes.push({
      role,
      x,
      y,
      active: l.enabled,
      colorHex: kelvinToHex(l.temperature),
      intensity: l.intensity,
      softness: l.softness,
      temperature: l.temperature,
      modifier: l.modifier,
    });
  }
  return nodes;
}

/**
 * Convert colour temperature (Kelvin) to a display-safe hex swatch. Uses a
 * simplified but perceptually monotonic blend between warm tungsten (#e7a464)
 * and cool daylight (#dbeaff) so the swatch reads "warm" or "cool" at a
 * glance without pulling in a proper black-body table.
 */
export function kelvinToHex(k: number): string {
  const clamped = Math.max(2000, Math.min(10000, k));
  // t=0 at 2000K (warm), t=1 at 10000K (cool)
  const t = (clamped - 2000) / 8000;
  const warm = { r: 0xe7, g: 0xa4, b: 0x64 };
  const cool = { r: 0xdb, g: 0xea, b: 0xff };
  const r = Math.round(warm.r + (cool.r - warm.r) * t);
  const g = Math.round(warm.g + (cool.g - warm.g) * t);
  const b = Math.round(warm.b + (cool.b - warm.b) * t);
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}
function to2(n: number): string {
  return Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
}

// ─── Immutable update helpers ───────────────────────────────────────

export function updateLight(
  setup: LightingSetup,
  role: LightRole,
  patch: Partial<Light>,
): LightingSetup {
  return {
    ...setup,
    lights: {
      ...setup.lights,
      [role]: { ...setup.lights[role], ...patch },
    },
    presetId: undefined, // any manual edit disowns the preset badge
  };
}

/** Return true if at least one light in the setup is enabled. */
export function isSetupActive(setup: LightingSetup): boolean {
  return LIGHT_ROLES.some((r) => setup.lights[r].enabled);
}
