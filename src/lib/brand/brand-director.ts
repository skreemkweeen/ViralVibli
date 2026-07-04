/**
 * Brand Director — 12 deterministic actions that rewrite a piece of
 * brand content (a tagline, mission line, positioning statement) to
 * push it along a specific axis. Every action explains what changed,
 * why, expected impact, and confidence.
 *
 * Pure. Rules-based. No AI round-trip.
 */

import type { BrandDNA } from "./brand-dna";
import { applyVoiceTransform } from "./voice";

export type BrandDirectorAction =
  | "improve-consistency"
  | "increase-luxury"
  | "increase-authority"
  | "increase-trust"
  | "increase-emotion"
  | "increase-memorability"
  | "increase-clarity"
  | "increase-premium"
  | "simplify"
  | "modernize"
  | "differentiate"
  | "strengthen-positioning";

export type BrandDirectorImpact =
  | "consistency"
  | "luxury"
  | "authority"
  | "trust"
  | "emotion"
  | "memorability"
  | "clarity"
  | "premium"
  | "positioning"
  | "differentiation";

export type BrandDirectorResult = {
  action: BrandDirectorAction;
  before: string;
  after: string;
  changed: string[];
  why: string;
  expected: BrandDirectorImpact[];
  confidence: number;
};

export type BrandDirectorSpec = {
  id: BrandDirectorAction;
  label: string;
  hint: string;
  category: "voice" | "positioning" | "essence";
};

export const BRAND_DIRECTOR_ACTIONS: BrandDirectorSpec[] = [
  { id: "improve-consistency", label: "Improve consistency", category: "voice", hint: "Align copy with brand vocabulary + rules" },
  { id: "increase-luxury", label: "Increase luxury", category: "voice", hint: "Restraint + precise vocabulary" },
  { id: "increase-authority", label: "Increase authority", category: "voice", hint: "Signal expertise without bragging" },
  { id: "increase-trust", label: "Increase trust", category: "voice", hint: "Add candid honesty markers" },
  { id: "increase-emotion", label: "Increase emotion", category: "voice", hint: "Name a specific feeling" },
  { id: "increase-memorability", label: "Increase memorability", category: "essence", hint: "Shorten + concretise" },
  { id: "increase-clarity", label: "Increase clarity", category: "voice", hint: "Cut filler, name the subject" },
  { id: "increase-premium", label: "Increase premium feel", category: "essence", hint: "Weight + specificity" },
  { id: "simplify", label: "Simplify", category: "voice", hint: "Fewer words, same meaning" },
  { id: "modernize", label: "Modernize", category: "essence", hint: "Contemporary vocabulary" },
  { id: "differentiate", label: "Differentiate", category: "positioning", hint: "Highlight what only you do" },
  { id: "strengthen-positioning", label: "Strengthen positioning", category: "positioning", hint: "Tighter noun phrase" },
];

const INDEX: Record<BrandDirectorAction, BrandDirectorSpec> = BRAND_DIRECTOR_ACTIONS.reduce(
  (acc, a) => {
    acc[a.id] = a;
    return acc;
  },
  {} as Record<BrandDirectorAction, BrandDirectorSpec>,
);

export function brandDirectorSpec(id: BrandDirectorAction): BrandDirectorSpec {
  return INDEX[id];
}

// ─── Handlers ────────────────────────────────────────────────────────────

function align(text: string, brand: BrandDNA): BrandDirectorResult {
  let after = text;
  const removed: string[] = [];
  for (const f of brand.forbiddenWords) {
    if (!f) continue;
    const re = new RegExp(`\\b${f}\\b`, "gi");
    if (re.test(after)) {
      after = after.replace(re, "").replace(/\s{2,}/g, " ").trim();
      removed.push(f);
    }
  }
  const missing = brand.vocabulary.filter(
    (v) => v && !after.toLowerCase().includes(v.toLowerCase()),
  );
  const added = missing.slice(0, 1);
  if (added[0]) after = `${after} — ${added[0]}`.trim();
  return {
    action: "improve-consistency",
    before: text,
    after,
    changed: [
      ...(removed.length ? [`Removed forbidden: ${removed.join(", ")}`] : []),
      ...(added.length ? [`Wove in brand word: ${added.join(", ")}`] : []),
    ],
    why: "Aligned copy with brand vocabulary and rules.",
    expected: ["consistency"],
    confidence: 72,
  };
}

function memorability(text: string): BrandDirectorResult {
  const trimmed = text.replace(/\s+/g, " ").trim();
  const sentences = trimmed.split(/[.!?]\s+/);
  const first = sentences[0] ?? trimmed;
  const after = first.length > 60 ? first.slice(0, 60).trim() + "…" : first + ".";
  return {
    action: "increase-memorability",
    before: text,
    after,
    changed: ["Compressed to a headline-length statement"],
    why: "Memorable lines are short and concrete.",
    expected: ["memorability", "clarity"],
    confidence: 68,
  };
}

function premium(text: string): BrandDirectorResult {
  const after = text
    .replace(/\bfast\b/gi, "considered")
    .replace(/\bnew\b/gi, "quiet")
    .replace(/\bbetter\b/gi, "elevated");
  return {
    action: "increase-premium",
    before: text,
    after,
    changed: ["Swapped punchy vocab for elevated vocabulary"],
    why: "Premium feel comes from restraint and precise words.",
    expected: ["premium", "luxury"],
    confidence: 66,
  };
}

function simplify(text: string): BrandDirectorResult {
  const after = text
    .replace(/\b(very|really|actually|basically|literally|just|quite)\b\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return {
    action: "simplify",
    before: text,
    after,
    changed: ["Cut filler adverbs"],
    why: "Simpler copy converts.",
    expected: ["clarity"],
    confidence: 80,
  };
}

function modernize(text: string): BrandDirectorResult {
  const after = text
    .replace(/\butilize\b/gi, "use")
    .replace(/\bin order to\b/gi, "to")
    .replace(/\bfacilitate\b/gi, "help")
    .replace(/\bcommence\b/gi, "start");
  return {
    action: "modernize",
    before: text,
    after,
    changed: ["Swapped archaic vocabulary for modern equivalents"],
    why: "Modern brands sound like modern people.",
    expected: ["clarity"],
    confidence: 72,
  };
}

function differentiate(text: string, brand: BrandDNA): BrandDirectorResult {
  const value = brand.values[0] ?? "";
  const usp = brand.usp || "";
  const after = usp
    ? `${text}. What only ${brand.name || "we"} do${brand.name ? "es" : ""}: ${usp}.`
    : value
      ? `${text}. Anchored in ${value}.`
      : `${text}. What only we do: —.`;
  return {
    action: "differentiate",
    before: text,
    after: after.replace(/\.\.$/, "."),
    changed: [usp ? `Anchored to USP: ${usp}` : "Anchored to a lead value"],
    why: "Differentiation reads clearest when the unique action is named.",
    expected: ["differentiation", "positioning"],
    confidence: 62,
  };
}

function strengthenPositioning(text: string, brand: BrandDNA): BrandDirectorResult {
  const audience = brand.audience || "your audience";
  const after = brand.positioning
    ? brand.positioning
    : `The considered choice for ${audience}: ${text}`;
  return {
    action: "strengthen-positioning",
    before: text,
    after,
    changed: brand.positioning
      ? ["Restated as a positioning line"]
      : ["Prepended a positioning framing"],
    why: "Positioning is a promise to a named audience.",
    expected: ["positioning"],
    confidence: 66,
  };
}

// ─── Dispatch ────────────────────────────────────────────────────────────

export function applyBrandDirector(
  text: string,
  action: BrandDirectorAction,
  brand: BrandDNA,
): BrandDirectorResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      action,
      before: text,
      after: text,
      changed: [],
      why: "Nothing to transform.",
      expected: [],
      confidence: 0,
    };
  }
  switch (action) {
    case "improve-consistency":
      return align(trimmed, brand);
    case "increase-memorability":
      return memorability(trimmed);
    case "increase-premium":
      return premium(trimmed);
    case "simplify":
      return simplify(trimmed);
    case "modernize":
      return modernize(trimmed);
    case "differentiate":
      return differentiate(trimmed, brand);
    case "strengthen-positioning":
      return strengthenPositioning(trimmed, brand);
    default: {
      // Voice-oriented actions dispatch to the voice engine.
      const map: Record<Exclude<BrandDirectorAction, "improve-consistency" | "increase-memorability" | "increase-premium" | "simplify" | "modernize" | "differentiate" | "strengthen-positioning">, "increase-authority" | "increase-emotion" | "increase-luxury" | "increase-friendliness"> = {
        "increase-luxury": "increase-luxury",
        "increase-authority": "increase-authority",
        "increase-trust": "increase-authority",
        "increase-emotion": "increase-emotion",
        "increase-clarity": "increase-friendliness",
      };
      const voiceAction = map[action as keyof typeof map];
      const res = applyVoiceTransform(trimmed, voiceAction);
      const impact: BrandDirectorImpact[] =
        action === "increase-luxury"
          ? ["luxury", "premium"]
          : action === "increase-authority"
            ? ["authority"]
            : action === "increase-trust"
              ? ["trust"]
              : action === "increase-emotion"
                ? ["emotion"]
                : ["clarity"];
      return {
        action,
        before: res.before,
        after: res.after,
        changed: [res.why],
        why: res.why,
        expected: impact,
        confidence: res.confidence,
      };
    }
  }
}
