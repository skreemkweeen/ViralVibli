/**
 * AI Creative Director — deterministic prompt transformations.
 *
 * Each action reshapes a prompt while preserving its intent. Actions are
 * pure functions returning a new prompt plus the set of descriptors they
 * added so the UI can show a diff. No AI round-trip required for these
 * baseline moves — a future pass can layer an AI-escalation path when
 * the deterministic move isn't enough.
 *
 * The transformations use two techniques:
 *   1. Deduplicated descriptor injection — append cinematic / editorial /
 *      luxury descriptors only if their tokens aren't already present.
 *   2. Composition rules — hoist known descriptors to the front when the
 *      action is about layout ("improve composition").
 *
 * Deterministic. Same input → same output.
 */

export type DirectorAction =
  | "cinematic"
  | "luxury"
  | "viral"
  | "editorial"
  | "premium"
  | "emotional"
  | "improve-composition"
  | "conversion";

export type DirectorResult = {
  prompt: string;
  changed: string[]; // human-readable list of descriptors added
  action: DirectorAction;
};

type ActionSpec = {
  id: DirectorAction;
  label: string;
  description: string;
  /** Descriptors this action layers in. Deduplicated at apply time. */
  add: string[];
  /** Descriptors to remove first, if present, so the layered ones read. */
  remove?: string[];
  /**
   * When true, the added descriptors are hoisted to the front of the
   * prompt (used for composition-level moves).
   */
  hoist?: boolean;
};

/**
 * Ordered so the UI can render buttons in the same sequence every session.
 */
export const ACTIONS: ActionSpec[] = [
  {
    id: "cinematic",
    label: "Make more cinematic",
    description: "35mm anamorphic wide, moody light, deep shadow",
    add: [
      "35mm anamorphic",
      "cinematic wide screen",
      "deep shadows",
      "atmospheric haze",
    ],
    remove: ["flat lighting", "even exposure"],
  },
  {
    id: "luxury",
    label: "Increase luxury feel",
    description: "Refined materials, brass accents, magazine surfaces",
    add: [
      "opulent surfaces",
      "brass accents",
      "editorial fashion polish",
      "quiet confidence",
    ],
    remove: ["cheap", "plastic", "loud color"],
  },
  {
    id: "viral",
    label: "Make more viral",
    description: "Strong hook, high-contrast focal point, thumb-stopper",
    add: [
      "strong focal hook",
      "high-contrast subject",
      "unexpected color pop",
      "instant readability",
    ],
  },
  {
    id: "editorial",
    label: "Make more editorial",
    description: "Negative space, unhurried composition, Kinfolk pace",
    add: [
      "generous negative space",
      "unhurried composition",
      "editorial magazine layout",
      "considered typography margins",
    ],
  },
  {
    id: "premium",
    label: "Make more premium",
    description: "Refined surfaces, deliberate lighting, magazine polish",
    add: [
      "refined surfaces",
      "deliberate lighting",
      "magazine-quality retouch",
      "restrained palette",
    ],
    remove: ["saturated", "amateur"],
  },
  {
    id: "emotional",
    label: "Make more emotional",
    description: "Intimate close-up, soft warm tones, quiet dignity",
    add: [
      "intimate close-up",
      "soft warm tones",
      "quiet dignity",
      "human tenderness",
    ],
  },
  {
    id: "improve-composition",
    label: "Improve composition",
    description: "Rule of thirds, leading lines, layered depth",
    add: [
      "rule of thirds",
      "leading lines",
      "layered depth",
      "clear subject anchor",
    ],
    hoist: true,
  },
  {
    id: "conversion",
    label: "Increase conversion",
    description: "Clear product hero, benefit-forward staging, sharp CTA space",
    add: [
      "clear product hero",
      "benefit-forward staging",
      "space for a CTA",
      "high-legibility contrast",
    ],
  },
];

/** Fetch an action spec by id. */
export function findAction(id: DirectorAction): ActionSpec | null {
  return ACTIONS.find((a) => a.id === id) ?? null;
}

// ─── Apply ───────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

/**
 * Return only the descriptors from `candidates` that don't already appear
 * (case-insensitively, ignoring punctuation) in the prompt.
 */
function novelDescriptors(prompt: string, candidates: string[]): string[] {
  const hay = normalize(prompt);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const c of candidates) {
    const n = normalize(c);
    if (!n || seen.has(n)) continue;
    if (!hay.includes(n)) {
      out.push(c);
      seen.add(n);
    }
  }
  return out;
}

/**
 * Remove the `remove` descriptors from the prompt case-insensitively.
 * Falls back to the original prompt when none of them appear.
 */
function stripDescriptors(prompt: string, toRemove: string[]): string {
  let out = prompt;
  for (const term of toRemove) {
    const re = new RegExp(
      `,?\\s*${term.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*,?`,
      "gi",
    );
    out = out.replace(re, ", ").replace(/,\s*,/g, ",");
  }
  return out.replace(/^\s*,\s*|,\s*$/g, "").trim();
}

/**
 * Apply a director action to a prompt. Returns the new prompt + the list of
 * descriptors that were actually added (deduplicated against the input).
 */
export function applyDirectorAction(
  prompt: string,
  action: DirectorAction,
): DirectorResult {
  const spec = findAction(action);
  if (!spec) {
    return { prompt, changed: [], action };
  }
  let working = prompt.trim();
  if (spec.remove && spec.remove.length > 0) {
    working = stripDescriptors(working, spec.remove);
  }
  const additions = novelDescriptors(working, spec.add);
  if (additions.length === 0) {
    return { prompt: working, changed: [], action };
  }
  const joined = additions.join(", ");
  const combined = spec.hoist
    ? working
      ? `${joined}. ${working}`
      : joined
    : working
      ? `${working}. ${joined}`
      : joined;
  return { prompt: combined, changed: additions, action };
}
