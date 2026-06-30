/**
 * Prompt enhancement. Elaborates a composed brief with richer descriptive
 * language a stock photographer or model would respond to. Mock today, behind
 * the same async contract as the AI client, so a real model drops in later.
 */
const flourishes = [
  "Emphasize tactile detail and believable material response to light.",
  "Keep the composition uncluttered, with intentional negative space.",
  "Render true-to-life color with a gentle, filmic falloff in the shadows.",
  "Add subtle depth with a soft foreground and a quiet, unbusy background.",
  "Favor a single confident focal point over competing elements.",
];

export async function enhancePrompt(prompt: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 650));
  const base = prompt.replace(/\.$/, "");
  const picks = flourishes.slice(0, 3).join(" ");
  return `${base}. ${picks}`;
}
