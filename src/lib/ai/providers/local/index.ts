import type {
  TextProvider,
  ImageProvider,
  EnhanceInput,
  EnhanceResult,
  ImageRequest,
  ImageResult,
} from "../../types";
import { aspectToSize } from "../../types";

// ─── Text (enhancement) ───────────────────────────────────────────────────────

const goalFragments: Record<string, string[]> = {
  composition: [
    "balanced composition with intentional negative space",
    "rule-of-thirds framing with a clear focal point",
    "layered depth — foreground detail fading into a quiet background",
  ],
  lighting: [
    "soft directional light with gentle shadow falloff",
    "warm specular highlights kissing the primary surface",
    "luminous mid-tones and controlled highlight retention",
  ],
  camera: [
    "medium-format perspective at f/2.8 — creamy background separation",
    "tight editorial crop, lens at its sharpest working aperture",
    "handheld intimacy with deliberate tonal compression",
  ],
  materials: [
    "tactile surface detail — every grain and fiber visible",
    "believable material response: matte absorbs, gloss reflects",
    "micro-texture brought forward by raking sidelight",
  ],
  rendering: [
    "photorealistic rendering with filmic tone mapping",
    "true-to-life color science, gentle analog color separation",
    "high-frequency texture at full resolution, no compression artifacts",
  ],
  cinematic: [
    "anamorphic lens character — subtle oval bokeh and horizontal flare",
    "2.39 : 1 cinematic framing with letterbox breathing room",
    "graded for a premium theatrical look, not social-native",
  ],
};

function pickFragments(goals: string[]): string {
  return goals
    .flatMap((g) => {
      const list = goalFragments[g] ?? [];
      return list[Math.floor(Math.random() * list.length)] ?? "";
    })
    .filter(Boolean)
    .join(". ");
}

export const localTextProvider: TextProvider = {
  id: "local-text",

  async enhance(input: EnhanceInput): Promise<EnhanceResult> {
    await new Promise((r) => setTimeout(r, 420));
    const base = input.prompt.replace(/\.$/, "");
    const fragments = pickFragments(input.goals);
    const enhanced = fragments ? `${base}. ${fragments}.` : `${base}.`;
    return { prompt: enhanced, provider: "local-text" };
  },
};

// ─── Image (generation) ───────────────────────────────────────────────────────

let seedCounter = 0;

export const localImageProvider: ImageProvider = {
  id: "local-image",

  async generate(req: ImageRequest): Promise<ImageResult> {
    await new Promise((r) => setTimeout(r, 600));
    const size = aspectToSize(req.aspect);
    const images = Array.from({ length: req.count }, (_, i) => {
      const seed = req.seed
        ? String(req.seed + i)
        : String(Date.now() + ++seedCounter);
      return { seed, width: size.width, height: size.height, provider: "local-image" };
    });
    return { images, provider: "local-image" };
  },
};
