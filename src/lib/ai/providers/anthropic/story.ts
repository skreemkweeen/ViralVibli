import type { StoryProvider, StoryRequest, StoryResult, StorySlide } from "../../types";
import { ProviderError } from "../../types";

const SLIDE_TOOL = {
  name: "output_story",
  description: "Output the complete story slide sequence as structured JSON",
  input_schema: {
    type: "object" as const,
    properties: {
      slides: {
        type: "array",
        items: {
          type: "object",
          properties: {
            slide: { type: "integer", description: "1-based slide number" },
            copy: {
              type: "string",
              description:
                "Exact text for this slide — punchy, platform-native, under 150 characters",
            },
            visualSuggestion: {
              type: "string",
              description: "Specific visual direction: what to film, photograph, or show",
            },
            stickerRecommendation: {
              type: "string",
              description:
                "Interactive sticker that maximises engagement (poll, question, quiz, countdown, emoji slider). Optional.",
            },
            cta: {
              type: "string",
              description: "Call-to-action text. Only on the last 1–2 slides.",
            },
            speakerNotes: {
              type: "string",
              description: "Creator tip: camera angle, delivery style, timing, energy note",
            },
          },
          required: ["slide", "copy", "visualSuggestion"],
        },
      },
    },
    required: ["slides"],
  },
};

const PLATFORM_TIPS: Record<string, string> = {
  instagram:
    "Vertical 9:16. First 3 seconds critical. Bold text overlays. Polls and question stickers boost reach. 15–30 s per slide.",
  tiktok:
    "Native, unpolished feel preferred. Hook in first 1–2 s. Text centre-screen. Trending sounds. 15–60 s optimal.",
  lemon8:
    "Editorial blog-feel. High-quality visuals. Multi-photo works. Discovery-focused with detail-rich captions.",
  "youtube-shorts":
    "Vertical 9:16. Strong thumbnail frame. First line is the hook. End screen with subscribe CTA.",
  pinterest:
    "Tall 2:3 ratio. Aspirational, search-optimised. High-quality image. Keyword-rich copy.",
};

function buildSystemPrompt(req: StoryRequest): string {
  const platform = req.platform.toLowerCase();
  const platformTip = PLATFORM_TIPS[platform] ?? "";

  return [
    "You are a world-class social media story strategist and copywriter.",
    "Create psychology-backed story sequences that stop the scroll, build genuine connection, and drive action.",
    "",
    "Rules:",
    "- Every first slide must earn the viewer's next tap.",
    "- Copy should feel like a real person talking, not a brand announcement.",
    "- Visual suggestions should be specific and achievable with a phone camera.",
    "- Sticker recommendations should serve the story arc, not feel bolted on.",
    "- CTAs appear only on the final 1–2 slides and grow naturally from the narrative.",
    ...(platformTip ? ["", `Platform (${platform}): ${platformTip}`] : []),
    "",
    "Output exactly the number of slides requested. No summaries, no preamble — only the tool call.",
  ].join("\n");
}

function buildUserPrompt(req: StoryRequest): string {
  const lines = [
    `Generate exactly ${req.count} story slides for ${req.platform}.`,
    "",
    `Brief: ${req.brief}`,
  ];

  if (req.audience) lines.push(`Audience: ${req.audience}`);
  if (req.goal) lines.push(`Goal: ${req.goal}`);
  if (req.voice) lines.push(`Brand voice: ${req.voice}`);
  if (req.tone) lines.push(`Tone: ${req.tone}`);
  if (req.hookStrength) lines.push(`Hook strength: ${req.hookStrength}`);
  if (req.visualDirection) lines.push(`Visual direction: ${req.visualDirection}`);
  if (req.ctaStyle) lines.push(`CTA style: ${req.ctaStyle}`);

  return lines.join("\n");
}

export function makeAnthropicStoryProvider(apiKey: string): StoryProvider {
  return {
    id: "anthropic-story",

    async generate(req: StoryRequest, signal?: AbortSignal): Promise<StoryResult> {
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
            max_tokens: 4000,
            system: buildSystemPrompt(req),
            tools: [SLIDE_TOOL],
            tool_choice: { type: "any" },
            messages: [{ role: "user", content: buildUserPrompt(req) }],
          }),
        });
      } catch (err) {
        throw new ProviderError(
          `Anthropic story fetch failed: ${err instanceof Error ? err.message : String(err)}`,
          "anthropic-story",
          true,
        );
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new ProviderError(
          `Anthropic story API error ${res.status}: ${body}`,
          "anthropic-story",
          res.status >= 500,
        );
      }

      const data = (await res.json()) as {
        content?: Array<{ type: string; input?: { slides?: unknown[] } }>;
      };

      const toolUse = data.content?.find((c) => c.type === "tool_use");
      const rawSlides = toolUse?.input?.slides;

      if (!Array.isArray(rawSlides) || rawSlides.length === 0) {
        throw new ProviderError("No slides returned from provider", "anthropic-story", false);
      }

      const slides: StorySlide[] = (rawSlides as Record<string, unknown>[]).map((s, i) => ({
        slide: typeof s.slide === "number" ? s.slide : i + 1,
        copy: typeof s.copy === "string" ? s.copy : "",
        visualSuggestion: typeof s.visualSuggestion === "string" ? s.visualSuggestion : "",
        stickerRecommendation:
          typeof s.stickerRecommendation === "string" ? s.stickerRecommendation : undefined,
        cta: typeof s.cta === "string" ? s.cta : undefined,
        speakerNotes: typeof s.speakerNotes === "string" ? s.speakerNotes : undefined,
      }));

      return { slides, provider: "anthropic-story" };
    },
  };
}
