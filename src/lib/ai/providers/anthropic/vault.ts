import type { VaultTransformProvider, VaultTransformRequest, VaultTransformResult } from "../../types";
import { ProviderError } from "../../types";

const TRANSFORM_TOOL = {
  name: "output_transform",
  description: "Output the transformed prompt",
  input_schema: {
    type: "object" as const,
    properties: {
      content: {
        type: "string",
        description: "The transformed prompt content",
      },
      variations: {
        type: "array",
        items: { type: "string" },
        description: "Array of variations (only for variations operation)",
      },
    },
    required: ["content"],
  },
};

const OP_INSTRUCTIONS: Record<string, string> = {
  improve:
    "Improve the prompt's effectiveness, specificity, and clarity. Add sensory details, concrete descriptors, and clear outcome expectations. Keep the core intent intact.",
  expand:
    "Expand the prompt with additional context, parameters, style guidance, and technical specifications. Make it more comprehensive without losing focus.",
  condense:
    "Condense the prompt to its essential core. Remove redundancy while preserving the key intent and most important parameters.",
  rewrite:
    "Completely rewrite the prompt with a fresh perspective. Same intent, entirely different phrasing and approach.",
  "make-casual":
    "Rewrite the prompt with a casual, conversational tone. Natural language, approachable, like texting a creative friend.",
  "make-professional":
    "Rewrite the prompt with a professional, precise tone. Formal language, technical terminology where appropriate.",
  "make-creative":
    "Reimagine the prompt with more creative, unexpected, or unconventional framing. Push beyond obvious interpretations.",
  variations:
    "Generate multiple distinct variations of this prompt, each exploring a different angle, tone, or approach. Return them in the variations array.",
};

function buildSystemPrompt(): string {
  return `You are an expert prompt engineer who understands the nuances of writing effective prompts for AI models including image generators, language models, and video AI. You transform prompts to be more effective while preserving the creator's original intent.`;
}

function buildUserPrompt(req: VaultTransformRequest): string {
  const instruction = OP_INSTRUCTIONS[req.operation] ?? "Improve this prompt.";
  const countNote = req.operation === "variations" ? ` Generate exactly ${req.count ?? 3} variations.` : "";
  const platformNote = req.platform ? ` Optimize for ${req.platform}.` : "";

  return `Operation: ${instruction}${countNote}${platformNote}

Original prompt:
${req.content}

Apply the transformation and return the result using the output_transform tool.`;
}

export function makeAnthropicVaultProvider(apiKey: string): VaultTransformProvider {
  return {
    id: "anthropic-vault",

    async transform(req: VaultTransformRequest, signal?: AbortSignal): Promise<VaultTransformResult> {
      let res: Response;
      try {
        res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          signal,
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2000,
            system: buildSystemPrompt(),
            messages: [{ role: "user", content: buildUserPrompt(req) }],
            tools: [TRANSFORM_TOOL],
            tool_choice: { type: "tool", name: "output_transform" },
          }),
        });
      } catch (err) {
        throw new ProviderError(
          `Anthropic vault fetch failed: ${err instanceof Error ? err.message : String(err)}`,
          "anthropic-vault",
          true,
        );
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new ProviderError(
          `Anthropic vault API error ${res.status}: ${body}`,
          "anthropic-vault",
          res.status >= 500,
        );
      }

      const data = (await res.json()) as {
        content?: Array<{ type: string; input?: { content?: string; variations?: string[] } }>;
      };

      const toolUse = data.content?.find((c) => c.type === "tool_use");
      if (!toolUse?.input) {
        throw new ProviderError("No tool_use block in response", "anthropic-vault", false);
      }

      return {
        content: toolUse.input.content ?? "",
        variations: toolUse.input.variations,
        provider: "anthropic-vault",
      };
    },
  };
}
