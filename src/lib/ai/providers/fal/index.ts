import type { ImageProvider, ImageRequest, ImageResult } from "../../types";
import { ProviderError, aspectToSize } from "../../types";

// FAL supports flux-pro, flux-dev, and many community models.
// Default: flux/dev — fast, high-quality, accepts seed.
const MODEL = "fal-ai/flux/dev";

export function makeFalImageProvider(apiKey: string): ImageProvider {
  return {
    id: "fal",

    async generate(req: ImageRequest, signal?: AbortSignal): Promise<ImageResult> {
      const size = aspectToSize(req.aspect, 1024);

      let res: Response;
      try {
        res = await fetch(`https://fal.run/${MODEL}`, {
          method: "POST",
          signal,
          headers: {
            Authorization: `Key ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: req.prompt,
            image_size: { width: size.width, height: size.height },
            num_images: req.count,
            seed: req.seed,
            num_inference_steps: req.quality === "ultra" ? 50 : req.quality === "high" ? 35 : 20,
            enable_safety_checker: true,
          }),
        });
      } catch (err) {
        throw new ProviderError(
          `FAL fetch failed: ${err instanceof Error ? err.message : err}`,
          "fal",
          true,
        );
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new ProviderError(
          `FAL API error ${res.status}: ${body}`,
          "fal",
          res.status >= 500,
        );
      }

      const data = (await res.json()) as {
        images: Array<{ url: string; width: number; height: number }>;
        seed?: number;
      };

      const images = data.images.map((img, i) => ({
        url: img.url,
        seed: data.seed ? String(data.seed + i) : String(Date.now() + i),
        width: img.width,
        height: img.height,
        provider: "fal",
      }));

      return { images, provider: "fal" };
    },
  };
}
