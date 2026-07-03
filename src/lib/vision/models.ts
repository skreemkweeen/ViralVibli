/**
 * Multi-model prompt formatter.
 *
 * The Vision composer produces a canonical prompt from creative direction.
 * Each generator model has its own dialect — Midjourney uses `--ar 4:5
 * --v 6.1`, Stable Diffusion expects negative-prompt tokens, Flux favours
 * natural-language paragraphs, Ideogram treats double-quoted strings as
 * on-image text. This module reshapes the canonical prompt for a chosen
 * target without losing intent.
 *
 * Pure. Deterministic. The UI can preview any target model without an
 * API round-trip.
 */

export type TargetModelId =
  | "chatgpt"
  | "midjourney"
  | "flux"
  | "ideogram"
  | "recraft"
  | "stable-diffusion"
  | "imagen"
  | "runway";

export type TargetModel = {
  id: TargetModelId;
  label: string;
  syntax: "natural" | "flags" | "sd";
  supportsNegatives: boolean;
  notes: string;
};

/**
 * All models we can format for. Ordered by how common they are in
 * professional creative workflows so the picker reads left-to-right.
 */
export const TARGET_MODELS: TargetModel[] = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    syntax: "natural",
    supportsNegatives: false,
    notes: "Reads natural language. Extra description ends up in the image.",
  },
  {
    id: "midjourney",
    label: "Midjourney",
    syntax: "flags",
    supportsNegatives: false,
    notes: "Trailing --ar / --v / --style flags. Comma-joined descriptors.",
  },
  {
    id: "flux",
    label: "Flux",
    syntax: "natural",
    supportsNegatives: false,
    notes: "Prefers a single paragraph. Long-form prose over comma lists.",
  },
  {
    id: "ideogram",
    label: "Ideogram",
    syntax: "natural",
    supportsNegatives: false,
    notes: "Wrap on-image text in double quotes for legible typography.",
  },
  {
    id: "recraft",
    label: "Recraft",
    syntax: "natural",
    supportsNegatives: false,
    notes: "Prefers explicit vector/illustration cues.",
  },
  {
    id: "stable-diffusion",
    label: "Stable Diffusion",
    syntax: "sd",
    supportsNegatives: true,
    notes: "Weighted tokens with an explicit Negative prompt block.",
  },
  {
    id: "imagen",
    label: "Imagen",
    syntax: "natural",
    supportsNegatives: false,
    notes: "Prefers vivid, specific nouns and camera language.",
  },
  {
    id: "runway",
    label: "Runway",
    syntax: "natural",
    supportsNegatives: false,
    notes: "Cinematic phrasing. Motion cues welcome.",
  },
];

export const DEFAULT_TARGET_MODEL: TargetModelId = "chatgpt";

/** Fetch by id; returns null when the id is unknown. */
export function findModel(id: string): TargetModel | null {
  return TARGET_MODELS.find((m) => m.id === id) ?? null;
}

export type FormatOptions = {
  aspect?: string; // "4-5" | "16-9" | "1-1" | …
  quality?: string;
  seed?: string | number;
  negativePrompt?: string;
};

/**
 * Map internal aspect id ("4-5", "16-9") to Midjourney/SD-style "W:H".
 */
function aspectToRatio(aspect: string): string {
  if (!aspect) return "";
  if (aspect.includes(":")) return aspect;
  return aspect.replace("-", ":");
}

/**
 * Format the canonical prompt for the chosen model. Returns a new string
 * — the input is not mutated.
 *
 * Formatting rules:
 *  - Midjourney: preserve the descriptor, then append `--ar A:B --v 6.1
 *    --style raw` and any seed. Never inline negatives.
 *  - Stable Diffusion: normalize to comma-weighted tokens and append a
 *    `Negative prompt: …` line when negatives are supplied.
 *  - Flux: soften commas into "with"/"and" glue for a paragraph feel.
 *  - Ideogram: preserve the prompt verbatim (double-quoted text handling
 *    is already baked in by the composer).
 *  - ChatGPT / Recraft / Imagen / Runway: pass through, appending an
 *    aspect note in natural language when a ratio is provided.
 */
export function formatForModel(
  prompt: string,
  model: TargetModelId,
  opts: FormatOptions = {},
): string {
  const p = prompt.trim();
  if (!p) return "";
  const ratio = opts.aspect ? aspectToRatio(opts.aspect) : "";

  switch (model) {
    case "midjourney": {
      const flags: string[] = [];
      if (ratio) flags.push(`--ar ${ratio}`);
      flags.push("--v 6.1", "--style raw");
      if (opts.seed !== undefined && opts.seed !== "") {
        flags.push(`--seed ${opts.seed}`);
      }
      return `${p} ${flags.join(" ")}`;
    }
    case "stable-diffusion": {
      // Comma-normalise the descriptor and append negatives on their own line.
      const positive = p.replace(/[.]\s*/g, ", ").replace(/,\s*,/g, ", ");
      const neg = (opts.negativePrompt ?? "").trim();
      const suffix = neg ? `\nNegative prompt: ${neg}` : "";
      const size = ratio ? `\nSize: ${ratio}` : "";
      const seed = opts.seed ? `\nSeed: ${opts.seed}` : "";
      return `${positive}${suffix}${size}${seed}`;
    }
    case "flux": {
      // Soften commas so the prompt reads as a paragraph. Keep double-quoted
      // strings intact so on-image text markers survive.
      const softened = p
        .split(/(".*?")/)
        .map((chunk, i) => {
          if (i % 2 === 1) return chunk; // quoted chunk — leave alone
          return chunk
            .replace(/,\s+/g, ", ")
            .replace(/,\s+([^,]+)$/, " and $1"); // last "," becomes "and"
        })
        .join("");
      const aspectNote = ratio ? ` Composed for a ${ratio} frame.` : "";
      return `${softened}${aspectNote}`;
    }
    case "ideogram":
      return `${p}${ratio ? `. ${ratio} frame.` : ""}`;
    case "chatgpt":
    case "recraft":
    case "imagen":
    case "runway":
    default: {
      const aspectNote = ratio ? ` Aspect ratio ${ratio}.` : "";
      return `${p}${aspectNote}`;
    }
  }
}
