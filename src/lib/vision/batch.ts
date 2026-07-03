/**
 * Batch generator — expand one base direction into N distinct prompt
 * variants. Variation is deterministic (seeded) so the same config always
 * produces the same variants, which makes A/B testing meaningful.
 *
 * Filters narrow the vocabulary before the variant sweep runs. Platform
 * filters bias each variant toward a target shot type by applying that
 * type's spec on top of the base direction.
 */

import { compositions as compositionData, styles as styleData } from "./data";
import { assemblePrompt, type Direction } from "./prompt";
import { shotSpec, type ShotType } from "./shots";

export const BATCH_SIZES = [5, 10, 25, 50, 100] as const;
export type BatchSize = (typeof BATCH_SIZES)[number];

export type BatchConfig = {
  size: BatchSize;
  /** style ids to sweep over. Empty = all */
  styles: string[];
  /** composition ids to sweep over. Empty = all */
  compositions: string[];
  /** platform / shot-type biases. Empty = none */
  platforms: ShotType[];
  /** deterministic seed */
  seed: number;
};

export type BatchVariant = {
  id: string;
  index: number;
  direction: Direction;
  prompt: string;
  tags: string[];
};

// ─── Defaults ─────────────────────────────────────────────────────────────

export function defaultBatchConfig(): BatchConfig {
  return {
    size: 10,
    styles: [],
    compositions: [],
    platforms: [],
    seed: 42,
  };
}

// ─── Sweep ────────────────────────────────────────────────────────────────

export function generateBatch(
  base: Direction,
  config: BatchConfig,
): BatchVariant[] {
  const styles =
    config.styles.length > 0
      ? config.styles
      : styleData.map((s) => s.id);
  const compositions =
    config.compositions.length > 0
      ? config.compositions
      : compositionData.map((c) => c.id);
  const platforms = config.platforms;

  const out: BatchVariant[] = [];
  for (let i = 0; i < config.size; i++) {
    const style = styles[(config.seed + i) % styles.length]!;
    const composition = compositions[(config.seed + i * 3) % compositions.length]!;

    // Weave platform biases across the batch when configured. Empty →
    // stays on the base direction unchanged.
    const platform = platforms.length
      ? platforms[(config.seed + i * 5) % platforms.length]!
      : undefined;

    let direction: Direction = {
      ...base,
      style,
      composition,
    };
    const tags = [style, composition];

    if (platform) {
      const spec = shotSpec(platform);
      direction = {
        ...direction,
        aspect: spec.aspect,
        lens: spec.lens,
        aperture: spec.aperture,
      };
      tags.push(platform);
    }

    out.push({
      id: `batch-${config.seed}-${i}`,
      index: i,
      direction,
      prompt: assemblePrompt(direction),
      tags,
    });
  }
  return out;
}

// ─── Read helpers ─────────────────────────────────────────────────────────

export function batchStyleCoverage(variants: BatchVariant[]): string[] {
  return Array.from(new Set(variants.map((v) => v.direction.style ?? "-"))).sort();
}

export function batchCompositionCoverage(variants: BatchVariant[]): string[] {
  return Array.from(
    new Set(variants.map((v) => v.direction.composition ?? "-")),
  ).sort();
}

export function batchAspectCoverage(variants: BatchVariant[]): string[] {
  return Array.from(new Set(variants.map((v) => v.direction.aspect))).sort();
}
