import type {
  TextProvider,
  ImageProvider,
  EnhanceInput,
  EnhanceResult,
  ImageRequest,
  ImageResult,
} from "../../types";
import { ProviderError, aspectToSize } from "../../types";

// ─── Text enhancement via GPT ─────────────────────────────────────────────────

const SYSTEM = `You are an expert photography art director. Elevate the given prompt.
Return ONLY the improved prompt — no preamble, no explanation.
Preserve the subject exactly. Add rich specifics for composition, lighting, camera, materials, rendering, and mood.
120-180 words, one cohesive paragraph.`;

export function makeOpenAITextProvider(apiKey: string): TextProvider {
  return {
    id: "openai-text",

    async enhance(input: EnhanceInput, signal?: AbortSignal): Promise<EnhanceResult> {
      let res: Response;
      try {
        res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            max_tokens: 400,
            messages: [
              { role: "system", content: SYSTEM },
              {
                role: "user",
                content: `Subject: "${input.subject}"\nBrief: "${input.prompt}"`,
              },
            ],
          }),
        });
      } catch (err) {
        throw new ProviderError(
          `OpenAI fetch failed: ${err instanceof Error ? err.message : err}`,
          "openai-text",
          true,
        );
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new ProviderError(
          `OpenAI API error ${res.status}: ${body}`,
          "openai-text",
          res.status >= 500,
        );
      }

      const data = (await res.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const text = data.choices[0]?.message?.content ?? input.prompt;
      return { prompt: text.trim(), provider: "openai-text" };
    },
  };
}

// ─── Image generation via DALL-E 3 ───────────────────────────────────────────

const DALLE_SIZES: Record<string, string> = {
  "1:1": "1024x1024",
  "16:9": "1792x1024",
  "9:16": "1024x1792",
};

export function makeOpenAIImageProvider(apiKey: string): ImageProvider {
  return {
    id: "openai-image",

    async generate(req: ImageRequest, signal?: AbortSignal): Promise<ImageResult> {
      const size =
        DALLE_SIZES[req.aspect] ??
        (() => {
          const s = aspectToSize(req.aspect, 1024);
          return `${s.width}x${s.height}`;
        })();

      const count = Math.min(req.count, 1); // DALL-E 3 supports n=1 per call

      let res: Response;
      try {
        res = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: req.prompt,
            n: count,
            size,
            quality: req.quality === "ultra" ? "hd" : "standard",
            response_format: "url",
          }),
        });
      } catch (err) {
        throw new ProviderError(
          `OpenAI image fetch failed: ${err instanceof Error ? err.message : err}`,
          "openai-image",
          true,
        );
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new ProviderError(
          `OpenAI image API error ${res.status}: ${body}`,
          "openai-image",
          res.status >= 500,
        );
      }

      const data = (await res.json()) as { data: Array<{ url: string }> };
      const sz = aspectToSize(req.aspect, 1024);
      const images = data.data.map((d, i) => ({
        url: d.url,
        seed: req.seed ? String(req.seed + i) : String(Date.now() + i),
        width: sz.width,
        height: sz.height,
        provider: "openai-image",
      }));
      return { images, provider: "openai-image" };
    },
  };
}
