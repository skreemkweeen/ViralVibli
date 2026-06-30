/**
 * AI client seam. The UI calls `streamAssistantReply()` and does not know which
 * model answers. Today it returns a brand-aware mock stream so the workspace is
 * fully interactive with no API key. To go live, implement this against the
 * Claude API (or a server action / route handler that holds the key) and keep
 * the same async-iterator contract; the UI needs no changes.
 */

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type BrandContext = {
  brand: string;
  voice: string;
};

const ease = (ms: number) => new Promise((r) => setTimeout(r, ms));

function draft(prompt: string, brand: BrandContext): string {
  const p = prompt.toLowerCase();
  if (p.includes("caption")) {
    return `Here is a caption for ${brand.brand}, in a ${brand.voice} voice:\n\n"Some things are worth slowing down for. Meet the piece your space has been missing, made by hand and built to last."\n\nWant three more in different lengths, or a hook-first version for Reels?`;
  }
  if (p.includes("plan") || p.includes("calendar") || p.includes("week")) {
    return `A simple week for ${brand.brand}:\n\n1. Monday: behind-the-scenes story, soft sell.\n2. Wednesday: carousel teaching one thing your audience gets wrong.\n3. Friday: a single hero shot with a short, confident caption.\n\nI can turn any of these into a full draft. Which one first?`;
  }
  if (p.includes("idea") || p.includes("hook")) {
    return `Three hooks for ${brand.brand}:\n\n1. "I stopped doing this, and everything changed."\n2. "The part nobody tells you about starting."\n3. "Save this before your next launch."\n\nWant me to build a post around one of them?`;
  }
  return `Got it. For ${brand.brand}, I would keep it in your ${brand.voice} voice and lead with one clear idea. Tell me the platform and the goal, and I will draft the first version, then we refine together.`;
}

/**
 * Yields the reply in small chunks to simulate token streaming.
 */
export async function* streamAssistantReply(
  prompt: string,
  brand: BrandContext,
): AsyncGenerator<string> {
  await ease(220);
  const full = draft(prompt, brand);
  const tokens = full.match(/\S+\s*/g) ?? [full];
  for (const t of tokens) {
    yield t;
    await ease(18 + Math.random() * 30);
  }
}

export const starterPrompts = [
  "Write a launch caption for my new product",
  "Plan my posting week",
  "Give me three hooks for a Reel",
  "Turn this idea into a carousel",
];
