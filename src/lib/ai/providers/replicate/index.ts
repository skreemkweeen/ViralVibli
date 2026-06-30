import type { ImageProvider, ImageRequest, ImageResult } from "../../types";
import { ProviderError, aspectToSize } from "../../types";

// SDXL via Replicate. Swap the model version for any other SDXL/SD3/Flux model.
const MODEL = "stability-ai/sdxl:7762fd07cf82c948538e41f4d1dda8fbdbe9aa46d055084022571571";

export function makeReplicateImageProvider(apiKey: string): ImageProvider {
  return {
    id: "replicate",

    async generate(req: ImageRequest, signal?: AbortSignal): Promise<ImageResult> {
      const size = aspectToSize(req.aspect, 1024);

      // 1. Create the prediction
      let res: Response;
      try {
        res = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          signal,
          headers: {
            Authorization: `Token ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            version: MODEL.split(":")[1],
            input: {
              prompt: req.prompt,
              width: size.width,
              height: size.height,
              num_outputs: req.count,
              seed: req.seed,
              num_inference_steps: req.quality === "ultra" ? 50 : req.quality === "high" ? 30 : 20,
              refine: "expert_ensemble_refiner",
            },
          }),
        });
      } catch (err) {
        throw new ProviderError(
          `Replicate fetch failed: ${err instanceof Error ? err.message : err}`,
          "replicate",
          true,
        );
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new ProviderError(
          `Replicate API error ${res.status}: ${body}`,
          "replicate",
          res.status >= 500,
        );
      }

      const prediction = (await res.json()) as {
        id: string;
        urls: { get: string };
      };

      // 2. Poll until done
      const pollUrl = prediction.urls.get;
      const deadline = Date.now() + 120_000;

      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 1500));
        if (signal?.aborted) throw new ProviderError("Cancelled", "replicate", false);

        const poll = await fetch(pollUrl, {
          signal,
          headers: { Authorization: `Token ${apiKey}` },
        });

        if (!poll.ok) continue;

        const state = (await poll.json()) as {
          status: string;
          output?: string[];
          error?: string;
        };

        if (state.status === "succeeded") {
          const urls = state.output ?? [];
          const images = urls.map((url, i) => ({
            url,
            seed: req.seed ? String(req.seed + i) : String(Date.now() + i),
            width: size.width,
            height: size.height,
            provider: "replicate",
          }));
          return { images, provider: "replicate" };
        }

        if (state.status === "failed") {
          throw new ProviderError(
            `Replicate prediction failed: ${state.error ?? "unknown"}`,
            "replicate",
            false,
          );
        }
      }

      throw new ProviderError("Replicate timed out after 120s", "replicate", true);
    },
  };
}
