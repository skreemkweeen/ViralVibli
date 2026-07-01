/**
 * Command palette natural-language routing.
 *
 * Given a free-text query, decide whether the creator is asking the platform
 * to do something concrete in a specific studio, and if so, return an intent
 * — a target studio + a suggested subject / brief to seed it with.
 *
 * Pure function; no globals, no fetches, no randomness. Every routing rule
 * is grounded in a specific verb + noun signal so results are predictable
 * and testable.
 */

export type StudioId = "vision" | "story" | "vault" | "assistant" | "projects";

export type PaletteIntent = {
  /** Where the palette should navigate on Enter. */
  studio: StudioId;
  /** Absolute route matching src/app/(app)/<studio>/page.tsx. */
  href: string;
  /** Short label the palette renders for this route. */
  label: string;
  /** One-liner explaining what the studio will do. */
  hint: string;
  /**
   * The remainder of the query after we strip the intent verb + object.
   * Studios use this to prefill their subject field.
   */
  subject: string;
  /**
   * 0..1 confidence — the palette can order multiple intents by this and
   * suppress low-confidence matches so noisy queries don't produce misleading
   * routes.
   */
  confidence: number;
};

const VERBS = [
  "generate",
  "create",
  "write",
  "draft",
  "plan",
  "make",
  "build",
  "design",
  "compose",
  "sketch",
];

type Rule = {
  studio: StudioId;
  /** Object keywords ("caption", "story", "carousel", …). */
  objects: string[];
  /** Optional bonus keywords that push confidence higher. */
  boosts?: string[];
  label: string;
  hint: string;
  href: string;
};

/**
 * Rules are ordered by specificity — the most specific object wins when
 * multiple would match. Each object is matched as a whole word.
 */
const RULES: Rule[] = [
  {
    studio: "story",
    objects: ["story", "stories", "sequence", "carousel"],
    boosts: ["reveal", "teaser", "launch"],
    label: "Draft in Story Studio",
    hint: "Story sequence — slide-by-slide with hooks and CTAs",
    href: "/story",
  },
  {
    studio: "story",
    objects: ["campaign", "launch"],
    boosts: ["week", "sequence", "story"],
    label: "Plan a launch campaign in Story Studio",
    hint: "Multi-slide launch story with framework",
    href: "/story",
  },
  {
    studio: "story",
    objects: ["caption", "hook", "hooks", "post"],
    boosts: ["reel", "instagram", "tiktok"],
    label: "Draft in Story Studio",
    hint: "Hook + caption sequence in your voice",
    href: "/story",
  },
  {
    studio: "vision",
    objects: [
      "image",
      "images",
      "photo",
      "photos",
      "shot",
      "shots",
      "render",
      "renders",
      "picture",
    ],
    boosts: ["hero", "product", "lifestyle", "macro", "editorial"],
    label: "Compose in Vision Studio",
    hint: "Art-directed image brief with camera + light",
    href: "/vision",
  },
  {
    studio: "vision",
    objects: ["moodboard", "reference", "references"],
    label: "Open the Vision moodboard",
    hint: "Pin references and inspiration",
    href: "/vision",
  },
  {
    studio: "vault",
    objects: ["prompt", "prompts"],
    boosts: ["save", "library", "vault"],
    label: "Save in Prompt Vault",
    hint: "Prompt library with variables and versions",
    href: "/vault",
  },
  {
    studio: "projects",
    objects: ["project", "projects", "workspace"],
    label: "Open Projects",
    hint: "Group stories, prompts, assets into one flow",
    href: "/projects",
  },
];

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "for",
  "of",
  "in",
  "on",
  "at",
  "to",
  "with",
  "and",
  "some",
  "few",
  "several",
  "my",
  "our",
  "this",
  "that",
  "these",
  "those",
  "please",
]);

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function wordMatch(tokens: string[], words: string[]): boolean {
  return words.some((w) => tokens.includes(w));
}

/**
 * Build the subject / brief string that seeds the target studio. Strips the
 * matched verb + object + trivial stopwords + leading articles so a query
 * like "generate a launch caption for my ceramic mug launch" becomes
 * "ceramic mug launch".
 */
function buildSubject(query: string, matchedObjects: string[]): string {
  const lower = query.toLowerCase();
  const drop = new Set<string>([...VERBS, ...matchedObjects]);
  const tokens = tokenize(query);
  const kept: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (drop.has(t)) continue;
    if (STOPWORDS.has(t)) continue;
    kept.push(t);
  }
  // Rejoin using the original casing/spacing from the source so proper nouns
  // survive intact. Do a simple whitespace split and cherry-pick tokens.
  const originalTokens = query.split(/\s+/).filter(Boolean);
  const output: string[] = [];
  for (const tok of originalTokens) {
    const norm = tok.toLowerCase().replace(/[^a-z0-9'-]/g, "");
    if (drop.has(norm)) continue;
    if (STOPWORDS.has(norm)) continue;
    if (!norm) continue;
    output.push(tok.replace(/^[.,!?;:]+|[.,!?;:]+$/g, ""));
  }
  const subject = output.join(" ").trim();
  return subject.length > 0 ? subject : lower.trim();
}

/**
 * Score + rank palette intents. Returns 0 or more intents ordered by
 * descending confidence. Empty when the query has no confident route.
 */
export function routeIntents(query: string): PaletteIntent[] {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 3) return [];

  const tokens = tokenize(trimmed);
  if (tokens.length === 0) return [];

  const hasVerb = wordMatch(tokens, VERBS);

  const out: PaletteIntent[] = [];
  for (const rule of RULES) {
    const objectMatches = rule.objects.filter((o) => tokens.includes(o));
    if (objectMatches.length === 0) continue;

    // Base confidence from object hit; verb + boosts add to it.
    let confidence = 0.55;
    if (hasVerb) confidence += 0.2;
    if (rule.boosts) {
      const boostHits = rule.boosts.filter((b) => tokens.includes(b)).length;
      confidence += Math.min(boostHits, 3) * 0.08;
    }
    // Multi-object matches (e.g. "story sequence") also push the confidence.
    if (objectMatches.length > 1) confidence += 0.05;
    // Cap at 1.0.
    confidence = Math.min(confidence, 1);

    const subject = buildSubject(trimmed, objectMatches);
    out.push({
      studio: rule.studio,
      href: rule.href,
      label: rule.label,
      hint: rule.hint,
      subject,
      confidence,
    });
  }

  // Dedupe by (studio, label) — a query like "generate a launch caption"
  // hits two Story rules; keep the highest-confidence one.
  const bestByKey = new Map<string, PaletteIntent>();
  for (const intent of out) {
    const key = `${intent.studio}::${intent.label}`;
    const existing = bestByKey.get(key);
    if (!existing || intent.confidence > existing.confidence) {
      bestByKey.set(key, intent);
    }
  }

  // Also dedupe by studio when multiple label variants exist — keep top one.
  // On tie, prefer the later rule (rules are ordered so more granular objects
  // like "caption" appear after "launch"; on equal confidence the more granular
  // subject noun is usually what the creator meant).
  const bestByStudio = new Map<StudioId, PaletteIntent>();
  for (const intent of bestByKey.values()) {
    const existing = bestByStudio.get(intent.studio);
    if (!existing || intent.confidence >= existing.confidence) {
      bestByStudio.set(intent.studio, intent);
    }
  }

  const ranked = [...bestByStudio.values()]
    .filter((i) => i.confidence >= 0.5)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  return ranked;
}
