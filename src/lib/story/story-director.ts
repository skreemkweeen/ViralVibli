/**
 * Story Director — 17 deterministic director actions operating on a
 * single slide's copy. Every action returns:
 *   - `before` / `after` strings
 *   - `changed` bullet list of what shifted
 *   - `why` — the reasoning in one line
 *   - `expected` — the predicted impact (hook / retention / trust / …)
 *   - `confidence` — 0-100 how sure the engine is the change lands
 *
 * Actions are text-rewrite functions rather than AI calls so the studio
 * is responsive and deterministic. Every rule is grounded in a specific
 * signal you can point at.
 */

// ─── Action catalogue ────────────────────────────────────────────────────

export type DirectorActionId =
  | "improve-hook"
  | "increase-curiosity"
  | "increase-luxury"
  | "increase-emotion"
  | "increase-trust"
  | "increase-authority"
  | "increase-virality"
  | "increase-retention"
  | "make-conversational"
  | "make-minimal"
  | "founder-voice"
  | "corporate-voice"
  | "gen-z-voice"
  | "luxury-brand-voice"
  | "editorial-rewrite"
  | "condense"
  | "expand";

export type DirectorImpact =
  | "hook"
  | "retention"
  | "trust"
  | "authority"
  | "emotion"
  | "virality"
  | "luxury"
  | "clarity"
  | "conversion";

export type DirectorResult = {
  action: DirectorActionId;
  before: string;
  after: string;
  changed: string[];
  why: string;
  expected: DirectorImpact[];
  /** 0-100 */
  confidence: number;
};

export type DirectorSpec = {
  id: DirectorActionId;
  label: string;
  category: "hook" | "voice" | "structure" | "energy";
  hint: string;
};

export const DIRECTOR_ACTIONS: DirectorSpec[] = [
  { id: "improve-hook", label: "Improve hook", category: "hook", hint: "Front-load a stronger opening line" },
  { id: "increase-curiosity", label: "Increase curiosity", category: "hook", hint: "Open a loop the viewer needs closed" },
  { id: "increase-luxury", label: "Increase luxury", category: "voice", hint: "Slower, quieter, more considered" },
  { id: "increase-emotion", label: "Increase emotion", category: "voice", hint: "Add a felt word or vulnerability" },
  { id: "increase-trust", label: "Increase trust", category: "voice", hint: "Add specificity + honesty markers" },
  { id: "increase-authority", label: "Increase authority", category: "voice", hint: "Signal expertise without bragging" },
  { id: "increase-virality", label: "Increase virality", category: "energy", hint: "Punchier language and pattern break" },
  { id: "increase-retention", label: "Increase retention", category: "hook", hint: "Add a keep-watching promise" },
  { id: "make-conversational", label: "Make conversational", category: "voice", hint: "Shorter, contractions, direct address" },
  { id: "make-minimal", label: "Make minimal", category: "structure", hint: "Cut adjectives, keep the truth" },
  { id: "founder-voice", label: "Founder voice", category: "voice", hint: "Honest, personal, product-anchored" },
  { id: "corporate-voice", label: "Corporate voice", category: "voice", hint: "Precise, measured, brand-safe" },
  { id: "gen-z-voice", label: "Gen Z voice", category: "voice", hint: "Casual cadence, current references" },
  { id: "luxury-brand-voice", label: "Luxury brand voice", category: "voice", hint: "Restraint, weight, precision" },
  { id: "editorial-rewrite", label: "Editorial rewrite", category: "voice", hint: "Magazine tone, considered" },
  { id: "condense", label: "Condense", category: "structure", hint: "Half the words, same meaning" },
  { id: "expand", label: "Expand", category: "structure", hint: "Add texture and specificity" },
];

const ACTIONS_INDEX: Record<DirectorActionId, DirectorSpec> = DIRECTOR_ACTIONS.reduce(
  (acc, a) => {
    acc[a.id] = a;
    return acc;
  },
  {} as Record<DirectorActionId, DirectorSpec>,
);

export function directorSpec(id: DirectorActionId): DirectorSpec {
  return ACTIONS_INDEX[id];
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function sentences(s: string): string[] {
  return s
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function firstSentence(s: string): string {
  return sentences(s)[0] ?? s;
}

function restAfterFirst(s: string): string {
  const parts = sentences(s);
  return parts.slice(1).join(" ").trim();
}

function contract(s: string): string {
  return s
    .replace(/\byou are\b/gi, "you're")
    .replace(/\bwe are\b/gi, "we're")
    .replace(/\bit is\b/gi, "it's")
    .replace(/\bcannot\b/gi, "can't")
    .replace(/\bdo not\b/gi, "don't")
    .replace(/\bdid not\b/gi, "didn't")
    .replace(/\bare not\b/gi, "aren't")
    .replace(/\bis not\b/gi, "isn't");
}

function stripAdjectives(s: string): string {
  const filler = [
    "very",
    "really",
    "actually",
    "basically",
    "literally",
    "simply",
    "just",
    "totally",
    "quite",
    "fairly",
  ];
  let out = s;
  for (const w of filler) out = out.replace(new RegExp(`\\b${w}\\b\\s*`, "gi"), "");
  return out.replace(/\s{2,}/g, " ").trim();
}

function ensurePunct(s: string): string {
  if (!s) return s;
  return /[.!?]$/.test(s.trim()) ? s : `${s.trim()}.`;
}

function words(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

// ─── Per-action transformers ─────────────────────────────────────────────

function improveHook(text: string): DirectorResult {
  const first = firstSentence(text);
  const rest = restAfterFirst(text);
  const hooked = /^(you|why|how|what|nobody|stop|wait|imagine)/i.test(first)
    ? first
    : `You'll want to see this. ${first}`;
  return {
    action: "improve-hook",
    before: text,
    after: [hooked, rest].filter(Boolean).join(" "),
    changed: [
      hooked === first ? "Kept an already strong opener" : "Prepended a pattern-interrupt opener",
    ],
    why: "The first line has to earn the second. Interrupt the scroll.",
    expected: ["hook", "retention"],
    confidence: hooked === first ? 55 : 78,
  };
}

function increaseCuriosity(text: string): DirectorResult {
  const first = firstSentence(text);
  const rest = restAfterFirst(text);
  const opener = `Most people miss this: ${first[0]!.toLowerCase()}${first.slice(1)}`;
  return {
    action: "increase-curiosity",
    before: text,
    after: `${opener} ${rest}`.trim(),
    changed: ["Opened a curiosity loop with 'most people miss this'"],
    why: "Curiosity gaps drag viewers through to the next slide.",
    expected: ["hook", "retention"],
    confidence: 74,
  };
}

function increaseLuxury(text: string): DirectorResult {
  // Slower rhythm, quieter vocabulary.
  const after = text
    .replace(/\bbig\b/gi, "considered")
    .replace(/\bcool\b/gi, "quiet")
    .replace(/\bawesome\b/gi, "elegant")
    .replace(/\bamazing\b/gi, "refined")
    .replace(/\bcheap\b/gi, "accessible");
  return {
    action: "increase-luxury",
    before: text,
    after,
    changed: ["Swapped punchy adjectives for quieter, more considered ones"],
    why: "Luxury reads as restraint. Fewer superlatives, more precise words.",
    expected: ["luxury", "trust"],
    confidence: 68,
  };
}

function increaseEmotion(text: string): DirectorResult {
  const first = firstSentence(text);
  const rest = restAfterFirst(text);
  const after = `${first} And honestly, it hit harder than expected. ${rest}`.trim();
  return {
    action: "increase-emotion",
    before: text,
    after,
    changed: ["Inserted a felt beat mid-copy"],
    why: "Named feelings drop the wall between creator and viewer.",
    expected: ["emotion", "trust"],
    confidence: 72,
  };
}

function increaseTrust(text: string): DirectorResult {
  const first = firstSentence(text);
  const rest = restAfterFirst(text);
  const after = `Honestly? ${first[0]!.toLowerCase()}${first.slice(1)} ${rest}`.trim();
  return {
    action: "increase-trust",
    before: text,
    after,
    changed: ["Prepended an honesty marker"],
    why: "Direct, honest openers signal you're not selling — you're speaking.",
    expected: ["trust", "conversion"],
    confidence: 66,
  };
}

function increaseAuthority(text: string): DirectorResult {
  const after = `After a decade doing this, here's what I know: ${text}`;
  return {
    action: "increase-authority",
    before: text,
    after,
    changed: ["Added a credibility anchor at the front"],
    why: "One line of specific experience unlocks readerly trust.",
    expected: ["authority", "trust"],
    confidence: 70,
  };
}

function increaseVirality(text: string): DirectorResult {
  const first = firstSentence(text);
  const rest = restAfterFirst(text);
  const after = `${first.toUpperCase()} ${rest}`.trim();
  return {
    action: "increase-virality",
    before: text,
    after,
    changed: ["Front-loaded a punchy caps opener"],
    why: "Pattern-break formatting lifts thumb-stop rate.",
    expected: ["virality", "hook"],
    confidence: 62,
  };
}

function increaseRetention(text: string): DirectorResult {
  const after = `${text} Keep going — the last slide is the reason.`;
  return {
    action: "increase-retention",
    before: text,
    after,
    changed: ["Appended a keep-watching promise"],
    why: "A promise pointing forward is a proven retention lever.",
    expected: ["retention"],
    confidence: 74,
  };
}

function makeConversational(text: string): DirectorResult {
  const contracted = contract(text);
  return {
    action: "make-conversational",
    before: text,
    after: contracted,
    changed: ["Contracted formal phrasings"],
    why: "Contractions feel like a friend talking, not a brand.",
    expected: ["emotion", "retention"],
    confidence: 78,
  };
}

function makeMinimal(text: string): DirectorResult {
  const stripped = stripAdjectives(text);
  return {
    action: "make-minimal",
    before: text,
    after: stripped,
    changed: ["Removed filler adverbs and hedges"],
    why: "Every unnecessary word dilutes the true one.",
    expected: ["clarity", "luxury"],
    confidence: 80,
  };
}

function founderVoice(text: string): DirectorResult {
  const after = `Real talk from the founder — ${text[0]!.toLowerCase()}${text.slice(1)}`;
  return {
    action: "founder-voice",
    before: text,
    after,
    changed: ["Framed the copy as a founder note"],
    why: "Founder-first voice earns permission other framing can't.",
    expected: ["trust", "conversion"],
    confidence: 68,
  };
}

function corporateVoice(text: string): DirectorResult {
  const after = text
    .replace(/\byou're\b/gi, "you are")
    .replace(/\bwe're\b/gi, "we are")
    .replace(/\bit's\b/gi, "it is")
    .replace(/\bcan't\b/gi, "cannot")
    .replace(/\bdon't\b/gi, "do not");
  return {
    action: "corporate-voice",
    before: text,
    after,
    changed: ["Removed contractions for a formal register"],
    why: "Brand-safe register for a regulated or B2B audience.",
    expected: ["trust", "authority"],
    confidence: 64,
  };
}

function genZVoice(text: string): DirectorResult {
  const after = contract(text) + " no bc this is huge fr.";
  return {
    action: "gen-z-voice",
    before: text,
    after,
    changed: ["Contracted + added a native casual tag"],
    why: "Cadence matters more than slang — but a native tag lands the register.",
    expected: ["virality", "emotion"],
    confidence: 60,
  };
}

function luxuryBrandVoice(text: string): DirectorResult {
  const after = stripAdjectives(
    text
      .replace(/\bgreat\b/gi, "quiet")
      .replace(/\bbest\b/gi, "considered")
      .replace(/\bcool\b/gi, "refined"),
  );
  return {
    action: "luxury-brand-voice",
    before: text,
    after,
    changed: ["Restraint + precise vocabulary; killed filler"],
    why: "Luxury brands whisper. Every word carries weight.",
    expected: ["luxury", "trust"],
    confidence: 74,
  };
}

function editorialRewrite(text: string): DirectorResult {
  const first = firstSentence(text);
  const rest = restAfterFirst(text);
  const after = `${first} What follows is a considered look at why. ${rest}`.trim();
  return {
    action: "editorial-rewrite",
    before: text,
    after,
    changed: ["Inserted a magazine-style bridging line"],
    why: "Editorial cadence signals authority and slower attention.",
    expected: ["authority", "luxury"],
    confidence: 66,
  };
}

function condense(text: string): DirectorResult {
  // Rough: keep first sentence + one supporting sentence.
  const sents = sentences(text);
  const kept = sents.slice(0, 2).join(" ");
  return {
    action: "condense",
    before: text,
    after: ensurePunct(kept),
    changed: [`Trimmed from ${words(text)} to ${words(kept)} words`],
    why: "Shorter copy per slide almost always outperforms longer copy.",
    expected: ["retention", "clarity"],
    confidence: 82,
  };
}

function expand(text: string): DirectorResult {
  const after = `${text} Here's the specific thing that changed everything: it wasn't the tool — it was the way it slotted into the day.`;
  return {
    action: "expand",
    before: text,
    after,
    changed: ["Added texture with a specific example"],
    why: "Specificity converts. Abstract copy doesn't.",
    expected: ["emotion", "trust"],
    confidence: 60,
  };
}

// ─── Dispatch ────────────────────────────────────────────────────────────

const HANDLERS: Record<DirectorActionId, (text: string) => DirectorResult> = {
  "improve-hook": improveHook,
  "increase-curiosity": increaseCuriosity,
  "increase-luxury": increaseLuxury,
  "increase-emotion": increaseEmotion,
  "increase-trust": increaseTrust,
  "increase-authority": increaseAuthority,
  "increase-virality": increaseVirality,
  "increase-retention": increaseRetention,
  "make-conversational": makeConversational,
  "make-minimal": makeMinimal,
  "founder-voice": founderVoice,
  "corporate-voice": corporateVoice,
  "gen-z-voice": genZVoice,
  "luxury-brand-voice": luxuryBrandVoice,
  "editorial-rewrite": editorialRewrite,
  condense,
  expand,
};

export function applyDirectorAction(text: string, action: DirectorActionId): DirectorResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      action,
      before: text,
      after: text,
      changed: [],
      why: "Nothing to work with — write a first draft first.",
      expected: [],
      confidence: 0,
    };
  }
  return HANDLERS[action](trimmed);
}
