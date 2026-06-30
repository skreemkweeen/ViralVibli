import type { StoryDirection } from "./types";
import { SLIDE_COUNT_MAP } from "./types";
import { getFramework } from "./frameworks";
import {
  audiences,
  goals,
  platforms,
  voices,
  tones,
  ctaStyles,
  visualDirections,
  hookStrengths,
  campaignObjectives,
  optionLabel,
} from "./data";

/**
 * Assembles the structured story brief sent to the AI provider.
 * Mirrors the role of assemblePrompt in vision/prompt.ts.
 */
export function assembleStoryBrief(d: StoryDirection): string {
  const parts: string[] = [];

  // Subject
  const subject = d.subject.trim();
  if (subject) {
    parts.push(subject);
  }

  // Platform + audience
  const platformLabel = optionLabel(platforms, d.platform) ?? d.platform;
  const audienceLabel = optionLabel(audiences, d.audience);
  parts.push(
    audienceLabel
      ? `Creating for ${audienceLabel} on ${platformLabel}`
      : `Creating for ${platformLabel}`,
  );

  // Goal
  const goalLabel = optionLabel(goals, d.goal);
  if (goalLabel) parts.push(`Goal: ${goalLabel}`);

  // Framework
  const fw = getFramework(d.framework);
  if (fw) {
    parts.push(`Framework: ${fw.name} — ${fw.tagline}`);
  }

  // Voice + tone
  const voiceLabel = optionLabel(voices, d.voice);
  const toneLabel = optionLabel(tones, d.tone);
  const style = [
    voiceLabel && `${voiceLabel} voice`,
    toneLabel && `${toneLabel} tone`,
  ]
    .filter(Boolean)
    .join(", ");
  if (style) parts.push(style);

  // Hook strength
  const hookLabel = optionLabel(hookStrengths, d.hookStrength);
  if (hookLabel) parts.push(`Hook strength: ${hookLabel}`);

  // Visual + CTA
  const visualLabel = optionLabel(visualDirections, d.visualDirection);
  const ctaLabel = optionLabel(ctaStyles, d.ctaStyle);
  if (visualLabel) parts.push(`Visual direction: ${visualLabel}`);
  if (ctaLabel) parts.push(`CTA style: ${ctaLabel}`);

  // Campaign objective
  const objectiveLabel = optionLabel(campaignObjectives, d.campaignObjective);
  if (objectiveLabel) parts.push(`Campaign objective: ${objectiveLabel}`);

  return parts.join(". ");
}

/** The number of slides this direction should generate. */
export function slideCount(d: StoryDirection): number {
  return SLIDE_COUNT_MAP[d.length] ?? 7;
}
