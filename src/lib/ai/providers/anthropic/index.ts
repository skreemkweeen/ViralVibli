import type { TextProvider, EnhanceInput, EnhanceResult } from "../../types";
import { ProviderError } from "../../types";

const SYSTEM = `You are an expert art director and photography creative consultant.
Your task: elevate a photography brief without changing its subject or intent.
Return ONLY the improved prompt text — no preamble, no explanation, no quotes.
Rules:
- Keep the subject (product / person / scene) exactly as stated.
- Do not invent new subjects or swap out the subject.
- Add rich, specific language around: ${[
  "composition and framing",
  "lighting quality and direction",
  "camera, lens, and aperture choices",
  "material and surface characteristics",
  "rendering approach and color science",
  "cinematic or editorial atmosphere",
].join("; ")}.
- Write in a single coherent paragraph suitable for an AI image-generation model.
- Target 120–180 words. Professional, confident, never purple.`;

function goalInstructions(goals: string[]): string {
  const map: Record<string, string> = {
    composition: "Pay special attention to composition and negative space.",
    lighting: "Focus on elevating the lighting quality and directionality.",
    camera: "Be precise about camera body, focal length, and aperture.",
    materials: "Describe material surfaces and their response to light in detail.",
    rendering:
      "Specify rendering approach: photorealistic, cinematic, or analog film.",
    cinematic: "Add cinematic atmosphere: color grade, lens character, and mood.",
  };
  return goals.map((g) => map[g]).filter(Boolean).join(" ");
}

export function makeAnthropicTextProvider(apiKey: string): TextProvider {
  return {
    id: "anthropic",

    async enhance(input: EnhanceInput, signal?: AbortSignal): Promise<EnhanceResult> {
      const userMessage = [
        `Subject (must be preserved verbatim): "${input.subject || "the subject"}"`,
        `Current brief: "${input.prompt}"`,
        goalInstructions(input.goals),
      ]
        .filter(Boolean)
        .join("\n");

      let res: Response;
      try {
        res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          signal,
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 400,
            system: SYSTEM,
            messages: [{ role: "user", content: userMessage }],
          }),
        });
      } catch (err) {
        throw new ProviderError(
          `Anthropic fetch failed: ${err instanceof Error ? err.message : err}`,
          "anthropic",
          true,
        );
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new ProviderError(
          `Anthropic API error ${res.status}: ${body}`,
          "anthropic",
          res.status >= 500,
        );
      }

      const data = (await res.json()) as {
        content: Array<{ type: string; text: string }>;
      };
      const text = data.content.find((c) => c.type === "text")?.text ?? input.prompt;
      return { prompt: text.trim(), provider: "anthropic" };
    },
  };
}
