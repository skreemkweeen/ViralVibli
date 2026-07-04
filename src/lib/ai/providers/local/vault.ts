import type { VaultTransformProvider, VaultTransformRequest, VaultTransformResult } from "../../types";

export const localVaultProvider: VaultTransformProvider = {
  id: "local-vault",

  async transform(req: VaultTransformRequest): Promise<VaultTransformResult> {
    await new Promise((r) => setTimeout(r, 700));

    const c = req.content.trim();

    switch (req.operation) {
      case "improve":
        return {
          content: `${c}\n\n[Improved: Add specific sensory details, precise descriptors, and clear outcome expectations to strengthen this prompt.]`,
          provider: "local-vault",
        };

      case "expand":
        return {
          content: `${c}\n\nAdditional context: Include detailed specifications for style, mood, lighting, composition, and any technical parameters. Specify the desired output format, quality level, and any constraints or exclusions that would refine the result.`,
          provider: "local-vault",
        };

      case "condense": {
        const sentences = c.split(/[.!?]+/).filter(Boolean);
        const condensed = sentences.slice(0, Math.ceil(sentences.length / 2)).join(". ").trim();
        return {
          content: condensed || c,
          provider: "local-vault",
        };
      }

      case "rewrite":
        return {
          content: c
            .replace(/\bplease\b/gi, "")
            .replace(/\bcan you\b/gi, "")
            .replace(/\bI want\b/gi, "Create")
            .replace(/\bI need\b/gi, "Generate")
            .replace(/\bmake\b/gi, "Create")
            .trim(),
          provider: "local-vault",
        };

      case "make-casual":
        return {
          content: c
            .replace(/\bGenerate\b/g, "Give me")
            .replace(/\bCreate\b/g, "Make me")
            .replace(/\bprovide\b/gi, "give me")
            .replace(/\butilize\b/gi, "use")
            .replace(/\bphotographic\b/gi, "photo")
            + "\n\nKeep it natural and conversational.",
          provider: "local-vault",
        };

      case "make-professional":
        return {
          content: c
            .replace(/\bstuff\b/gi, "elements")
            .replace(/\bawesome\b/gi, "exceptional")
            .replace(/\bcool\b/gi, "sophisticated")
            .replace(/\bnice\b/gi, "refined")
            + "\n\nMaintain a professional, precise tone throughout.",
          provider: "local-vault",
        };

      case "make-creative":
        return {
          content: `${c}\n\nVisual metaphor: Consider unexpected juxtapositions, surreal elements, or unconventional perspectives. Push beyond the obvious interpretation.`,
          provider: "local-vault",
        };

      case "variations": {
        const count = Math.min(req.count ?? 3, 5);
        const variations = Array.from({ length: count }, (_, i) => {
          const angles = [
            `${c} — minimal, clean execution`,
            `${c} — dramatic, high-contrast treatment`,
            `${c} — warm, lifestyle-focused approach`,
            `${c} — bold, editorial style`,
            `${c} — subtle, refined interpretation`,
          ];
          return angles[i] ?? `${c} — variation ${i + 1}`;
        });
        return {
          content: variations[0]!,
          variations,
          provider: "local-vault",
        };
      }

      default:
        return { content: c, provider: "local-vault" };
    }
  },
};
