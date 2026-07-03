import { describe, expect, it } from "vitest";
import {
  DEFAULT_TARGET_MODEL,
  TARGET_MODELS,
  findModel,
  formatForModel,
} from "./models";

describe("Target model registry", () => {
  it("ships all 8 named target models", () => {
    const ids = TARGET_MODELS.map((m) => m.id);
    expect(ids).toEqual([
      "chatgpt",
      "midjourney",
      "flux",
      "ideogram",
      "recraft",
      "stable-diffusion",
      "imagen",
      "runway",
    ]);
  });

  it("findModel returns the model or null", () => {
    expect(findModel("midjourney")?.label).toBe("Midjourney");
    expect(findModel("nope")).toBeNull();
  });

  it("default target is ChatGPT", () => {
    expect(DEFAULT_TARGET_MODEL).toBe("chatgpt");
  });

  it("stable-diffusion is the only model that supports negatives", () => {
    const withNeg = TARGET_MODELS.filter((m) => m.supportsNegatives).map(
      (m) => m.id,
    );
    expect(withNeg).toEqual(["stable-diffusion"]);
  });
});

describe("formatForModel", () => {
  const base = "Editorial hero shot of a matte ceramic mug, warm brass";

  it("returns empty string for an empty prompt", () => {
    expect(formatForModel("", "midjourney")).toBe("");
  });

  it("Midjourney appends aspect + version + style flags", () => {
    const out = formatForModel(base, "midjourney", { aspect: "4-5" });
    expect(out).toContain(base);
    expect(out).toMatch(/--ar 4:5/);
    expect(out).toMatch(/--v 6\.1/);
    expect(out).toMatch(/--style raw/);
  });

  it("Midjourney appends a seed flag when a seed is provided", () => {
    const out = formatForModel(base, "midjourney", {
      aspect: "1-1",
      seed: 4242,
    });
    expect(out).toMatch(/--seed 4242/);
  });

  it("Stable Diffusion emits a Negative prompt line when negatives exist", () => {
    const out = formatForModel(base, "stable-diffusion", {
      negativePrompt: "blur, noise",
      aspect: "16-9",
    });
    expect(out).toContain("Negative prompt: blur, noise");
    expect(out).toContain("Size: 16:9");
  });

  it("Stable Diffusion omits the Negative line when negatives are blank", () => {
    const out = formatForModel(base, "stable-diffusion", {});
    expect(out).not.toContain("Negative prompt");
  });

  it("Flux softens the last comma to 'and' for paragraph feel", () => {
    const out = formatForModel(
      "warm brass, oat, matte ceramic",
      "flux",
    );
    expect(out).toContain("warm brass, oat and matte ceramic");
  });

  it("Flux appends a natural-language aspect note", () => {
    const out = formatForModel(base, "flux", { aspect: "16-9" });
    expect(out).toContain("Composed for a 16:9 frame");
  });

  it("Ideogram appends a frame note but preserves quoted text", () => {
    const out = formatForModel(
      `Poster reading "New Ritual"`,
      "ideogram",
      { aspect: "1-1" },
    );
    expect(out).toMatch(/"New Ritual"/);
    expect(out).toMatch(/1:1 frame/);
  });

  it("Runway (pass-through) appends a natural aspect note", () => {
    const out = formatForModel(base, "runway", { aspect: "9-16" });
    expect(out).toContain("Aspect ratio 9:16");
  });

  it("ChatGPT is a pass-through with an aspect note", () => {
    const out = formatForModel(base, "chatgpt", { aspect: "4-5" });
    expect(out.startsWith(base)).toBe(true);
    expect(out).toContain("Aspect ratio 4:5");
  });

  it("does not double-escape ratios that already contain a colon", () => {
    const out = formatForModel(base, "midjourney", { aspect: "9:16" });
    expect(out).toContain("--ar 9:16");
  });
});
