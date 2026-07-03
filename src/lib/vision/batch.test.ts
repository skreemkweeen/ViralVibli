import { describe, expect, it } from "vitest";
import { emptyDirection } from "./prompt";
import {
  batchAspectCoverage,
  batchCompositionCoverage,
  batchStyleCoverage,
  BATCH_SIZES,
  defaultBatchConfig,
  generateBatch,
} from "./batch";

describe("BATCH_SIZES", () => {
  it("exposes 5/10/25/50/100 as the canonical sizes", () => {
    expect(BATCH_SIZES).toEqual([5, 10, 25, 50, 100]);
  });
});

describe("defaultBatchConfig", () => {
  it("starts at size 10 with no filters", () => {
    const cfg = defaultBatchConfig();
    expect(cfg.size).toBe(10);
    expect(cfg.styles).toEqual([]);
    expect(cfg.platforms).toEqual([]);
    expect(cfg.compositions).toEqual([]);
  });
});

describe("generateBatch", () => {
  it("produces exactly `size` variants", () => {
    const variants = generateBatch(emptyDirection, {
      ...defaultBatchConfig(),
      size: 25,
    });
    expect(variants).toHaveLength(25);
  });

  it("is deterministic — same config → same variants", () => {
    const a = generateBatch(emptyDirection, defaultBatchConfig());
    const b = generateBatch(emptyDirection, defaultBatchConfig());
    expect(a.map((v) => v.prompt)).toEqual(b.map((v) => v.prompt));
  });

  it("changes seed → variants shift", () => {
    const a = generateBatch(emptyDirection, defaultBatchConfig());
    const b = generateBatch(emptyDirection, {
      ...defaultBatchConfig(),
      seed: 99,
    });
    expect(a.map((v) => v.prompt).join()).not.toBe(
      b.map((v) => v.prompt).join(),
    );
  });

  it("respects style filter", () => {
    const variants = generateBatch(emptyDirection, {
      ...defaultBatchConfig(),
      size: 10,
      styles: ["editorial", "minimal"],
    });
    const styles = new Set(variants.map((v) => v.direction.style));
    expect(styles.has("editorial")).toBe(true);
    expect(styles.has("minimal")).toBe(true);
    expect(styles.has("cinematic")).toBe(false);
  });

  it("respects composition filter", () => {
    const variants = generateBatch(emptyDirection, {
      ...defaultBatchConfig(),
      size: 10,
      compositions: ["centered", "overhead"],
    });
    const comps = new Set(variants.map((v) => v.direction.composition));
    expect(comps.has("centered")).toBe(true);
    expect(comps.has("overhead")).toBe(true);
  });

  it("biases direction toward the platform's aspect + lens when set", () => {
    const variants = generateBatch(emptyDirection, {
      ...defaultBatchConfig(),
      size: 5,
      platforms: ["tiktok"],
    });
    // TikTok spec is 9:16, 24mm — every variant should carry those
    for (const v of variants) {
      expect(v.direction.aspect).toBe("9-16");
      expect(v.direction.lens).toBe("24");
      expect(v.tags).toContain("tiktok");
    }
  });

  it("stamps unique ids per variant", () => {
    const variants = generateBatch(emptyDirection, defaultBatchConfig());
    const ids = new Set(variants.map((v) => v.id));
    expect(ids.size).toBe(variants.length);
  });

  it("style coverage grows with batch size", () => {
    const small = generateBatch(emptyDirection, {
      ...defaultBatchConfig(),
      size: 5,
    });
    const large = generateBatch(emptyDirection, {
      ...defaultBatchConfig(),
      size: 50,
    });
    expect(batchStyleCoverage(large).length).toBeGreaterThanOrEqual(
      batchStyleCoverage(small).length,
    );
  });

  it("coverage helpers return sorted uniques", () => {
    const variants = generateBatch(emptyDirection, {
      ...defaultBatchConfig(),
      size: 25,
    });
    expect(batchCompositionCoverage(variants)).toEqual(
      [...batchCompositionCoverage(variants)].sort(),
    );
    expect(batchAspectCoverage(variants).length).toBeGreaterThan(0);
  });
});
