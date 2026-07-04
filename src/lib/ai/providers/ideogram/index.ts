import type { ImageProvider, ImageRequest, ImageResult } from "../../types";
import { ProviderError, aspectToSize } from "../../types";

// Ideogram v2 is exceptional for text legibility in product shots.
const ASPECT_MAP: Record<string, string> = {
  "1:1": "ASPECT_1_1",
  "4:5": "ASPECT_4_5",
  "5:4": "ASPECT_5_4",
  "16:9": "ASPECT_16_9",
  "9:16": "ASPECT_9_16",
  "3:2": "ASPECT_3_2",
  "2:3": "ASPECT_2_3",
};

export function makeIdeogramImageProvider(apiKey: string): ImageProvider {
  return {
    id: "ideogram",

    async generate(req: ImageRequest, signal?: AbortSignal): Promise<ImageResult> {
      const aspectRatio = ASPECT_MAP[req.aspect] ?? "ASPECT_4_5";
      const size = aspectToSize(req.aspect, 1024);

      let res: Response;
      try {
        res = await fetch("https://api.ideogram.ai/generate", {
          method: "POST",
          signal,
          headers: {
            "Api-Key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_request: {
              prompt: req.prompt,
              aspect_ratio: aspectRatio,
              model: "V_2",
              magic_prompt_option: "OFF",
              seed: req.seed,
              num_images: Math.min(req.count, 4),
            },
          }),
        });
      } catch (err) {
        throw new ProviderError(
          `Ideogram fetch failed: ${err instanceof Error ? err.message : err}`,
          "ideogram",
          true,
        );
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new ProviderError(
          `Ideogram API error ${res.status}: ${body}`,
          "ideogram",
          res.status >= 500,
        );
      }

      const data = (await res.json()) as {
        data: Array<{ url: string; seed: number }>;
      };

      const images = data.data.map((d) => ({
        url: d.url,
        seed: String(d.seed),
        width: size.width,
        height: size.height,
        provider: "ideogram",
      }));

      return { images, provider: "ideogram" };
    },
  };
}
