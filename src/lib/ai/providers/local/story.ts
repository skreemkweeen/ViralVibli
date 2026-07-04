import type { StoryProvider, StoryRequest, StoryResult, StorySlide } from "../../types";

const FRAMEWORK_TEMPLATES: Record<
  string,
  (topic: string, count: number) => Array<Omit<StorySlide, "slide">>
> = {
  aida: (topic, count) => {
    const beats = [
      {
        copy: `Stop. This is the only thing you need to know about ${topic || "this"}.`,
        visualSuggestion: "Bold text on clean dark background — nothing else in frame",
        stickerRecommendation: "Poll: Have you tried this yet?",
        speakerNotes: "Pause for a beat before this slide. Delivery: dead serious.",
      },
      {
        copy: `Here's what most people get completely wrong about ${topic || "it"}.`,
        visualSuggestion: "Talking-head, direct eye contact, close crop",
        stickerRecommendation: "Question sticker: What's your experience?",
        speakerNotes: "Raise one eyebrow. Let the curiosity hang.",
      },
      {
        copy: "The shift is smaller than you think — and the results are bigger than you'd expect.",
        visualSuggestion: "Before-and-after split or slow reveal",
        speakerNotes: "Slow down here. Let the visual land.",
      },
      {
        copy: "Here's exactly how it works, step by step.",
        visualSuggestion: "Flat-lay or hands demonstrating product/process",
        speakerNotes: "Keep energy high. Each step is its own mini-hook.",
      },
      {
        copy: "Your turn. Save this for later — you'll want it.",
        visualSuggestion: "Product close-up or aspirational lifestyle shot",
        cta: "Link in bio",
        stickerRecommendation: "Countdown or emoji slider",
        speakerNotes: "Smile. End on confidence.",
      },
    ];
    return beats.slice(0, Math.max(count, 3));
  },

  pas: (topic, count) => {
    const beats = [
      {
        copy: `The hardest part about ${topic || "this"} isn't what you think it is.`,
        visualSuggestion: "Moody, slightly unflattering lighting — raw and honest",
        stickerRecommendation: "Poll: Is this you?",
        speakerNotes: "Start tired. Start real.",
      },
      {
        copy: "And the longer you ignore it, the worse it gets.",
        visualSuggestion: "Close-up of the problem — don't hide it",
        speakerNotes: "Lean in. This is the agitation beat.",
      },
      {
        copy: "I found something that actually changes the game.",
        visualSuggestion: "Reveal moment — product enters frame or AHA expression",
        speakerNotes: "Energy shift here. Go from heavy to light.",
      },
      {
        copy: "The difference after just [X] days? Unreal.",
        visualSuggestion: "Results — real, specific, visual",
        stickerRecommendation: "Question sticker: Want the details?",
        speakerNotes: "Be specific. Numbers hit harder than adjectives.",
      },
      {
        copy: "This is what I wish I'd found sooner. Try it.",
        visualSuggestion: "Happy, bright, lifestyle shot post-transformation",
        cta: "Shop now — link in bio",
        speakerNotes: "Warm energy. You're a friend sharing a secret.",
      },
    ];
    return beats.slice(0, Math.max(count, 3));
  },

  default: (topic, count) =>
    Array.from({ length: count }, (_, i) => ({
      copy: i === 0
        ? `Here's what you need to know about ${topic || "this"}.`
        : i === count - 1
        ? "Save this for when you need it."
        : `Part ${i + 1}: The details that actually matter.`,
      visualSuggestion:
        i === 0
          ? "Bold hook text on clean background"
          : i === count - 1
          ? "Aspirational lifestyle shot"
          : "Demonstrating the key point — direct camera",
      speakerNotes: i === 0 ? "Strong opening energy." : i === count - 1 ? "Warm close." : undefined,
      cta: i === count - 1 ? "Link in bio" : undefined,
    })),
};

function pickTemplate(
  framework: string,
  topic: string,
  count: number,
): Array<Omit<StorySlide, "slide">> {
  const fn = FRAMEWORK_TEMPLATES[framework] ?? FRAMEWORK_TEMPLATES.default!;
  const base = fn(topic, count);
  // If template is shorter than requested count, pad with default
  if (base.length < count) {
    const pad = FRAMEWORK_TEMPLATES.default!(topic, count - base.length);
    return [...base, ...pad].slice(0, count);
  }
  return base.slice(0, count);
}

export const localStoryProvider: StoryProvider = {
  id: "local-story",

  async generate(req: StoryRequest): Promise<StoryResult> {
    // Simulate latency
    await new Promise((r) => setTimeout(r, 900));

    const rawTopic = req.subject || req.brief;
    const topic = rawTopic.length > 60 ? rawTopic.slice(0, 57) + "…" : rawTopic;
    const frames = pickTemplate(req.framework, topic, req.count);

    const slides: StorySlide[] = frames.map((f, i) => ({ slide: i + 1, ...f }));

    return { slides, provider: "local-story" };
  },
};
