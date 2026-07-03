/**
 * Creative Brief — the campaign-level context that lives above any
 * individual shot.
 *
 * A Brief captures the "why" of a shoot: objective, audience, deliverables,
 * brand personality, and constraints. It is:
 *   - persisted per project so switching projects switches the brief
 *   - assembled into a compact one-liner that seeds Prompt Composer and
 *     the AI Dock system prompt
 *   - assembled into a rich multi-line summary for the AI system prompt
 *
 * Pure. No React, no fetches.
 */

export type CreativeBrief = {
  /** What the campaign is trying to achieve. */
  objective: string;
  /** Who the creator is talking to. */
  audience: string;
  /** Primary platform this brief targets (instagram, tiktok, web, print…). */
  platform: string;
  /** What deliverables must ship (comma or newline separated). */
  deliverables: string;
  /** Comma-separated visual keywords the shoot should hit. */
  visualKeywords: string;
  /** How the brand should feel (voice + aesthetic in a sentence). */
  brandPersonality: string;
  /** Free-form art-direction notes. */
  artDirectionNotes: string;
  /** Reference URLs or descriptions (moodboard supplements). */
  references: string;
  /** What the shoot must NOT do (tone, colors, tropes to avoid). */
  constraints: string;
};

export const emptyCreativeBrief: CreativeBrief = {
  objective: "",
  audience: "",
  platform: "",
  deliverables: "",
  visualKeywords: "",
  brandPersonality: "",
  artDirectionNotes: "",
  references: "",
  constraints: "",
};

/** True if none of the brief fields carry meaningful content. */
export function isBriefEmpty(b: CreativeBrief): boolean {
  return Object.values(b).every((v) => !v || !v.trim());
}

/**
 * Assemble a compact one-liner that can be prepended to a prompt or a
 * palette subject. Trims to the strongest signals so it stays short.
 */
export function assembleBriefLine(b: CreativeBrief): string {
  const parts: string[] = [];
  if (b.objective.trim()) parts.push(b.objective.trim());
  if (b.audience.trim()) parts.push(`for ${b.audience.trim()}`);
  if (b.platform.trim()) parts.push(`on ${b.platform.trim()}`);
  if (b.visualKeywords.trim()) parts.push(`— ${b.visualKeywords.trim()}`);
  return parts.join(" ");
}

/**
 * Assemble a multi-line block suitable for the AI system prompt. Each
 * populated field renders as its own line so the model can address them
 * individually.
 */
export function assembleBriefFull(b: CreativeBrief): string {
  const lines: string[] = [];
  const label = (name: string, value: string) => {
    const v = value.trim();
    if (v) lines.push(`${name}: ${v}`);
  };
  label("Objective", b.objective);
  label("Audience", b.audience);
  label("Platform", b.platform);
  label("Deliverables", b.deliverables);
  label("Visual keywords", b.visualKeywords);
  label("Brand personality", b.brandPersonality);
  label("Art direction", b.artDirectionNotes);
  label("References", b.references);
  label("Constraints", b.constraints);
  return lines.join("\n");
}

/**
 * Merge partial brief updates while trimming string values so blank fields
 * clear cleanly. Returns a new object; input is not mutated.
 */
export function mergeBrief(
  brief: CreativeBrief,
  patch: Partial<CreativeBrief>,
): CreativeBrief {
  const next: CreativeBrief = { ...brief };
  (Object.keys(patch) as Array<keyof CreativeBrief>).forEach((k) => {
    const v = patch[k];
    if (typeof v === "string") next[k] = v;
  });
  return next;
}
