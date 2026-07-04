import { describe, expect, it } from "vitest";
import {
  analyzeReference,
  analyzeWall,
  proposeFromWall,
  type ReferenceItem,
} from "./reference-wall";

function ref(patch: Partial<ReferenceItem>): ReferenceItem {
  return {
    id: patch.id ?? "r",
    kind: patch.kind ?? "note",
    title: patch.title ?? "ref",
    swatches: patch.swatches,
    tags: patch.tags,
    note: patch.note,
    createdAt: 1,
    ...patch,
  };
}

describe("analyzeReference", () => {
  it("reads dominant colors from swatches", () => {
    const r = ref({ kind: "palette", swatches: ["#111111", "#eeeeee", "#c8f04e"] });
    const a = analyzeReference(r);
    expect(a.dominantColors).toEqual(["#111111", "#eeeeee", "#c8f04e"]);
  });

  it("marks dark palettes as dark luminance", () => {
    const a = analyzeReference(
      ref({ kind: "palette", swatches: ["#0a0a0a", "#1a1a1a", "#111111"] }),
    );
    expect(a.luminance).toBe("dark");
  });

  it("marks light palettes as light luminance", () => {
    const a = analyzeReference(
      ref({ kind: "palette", swatches: ["#f8f8f8", "#f0efee", "#ececec"] }),
    );
    expect(a.luminance).toBe("light");
  });

  it("labels warm-biased palettes as warm", () => {
    const a = analyzeReference(
      ref({ kind: "palette", swatches: ["#a24618", "#c8823a", "#e8c990"] }),
    );
    expect(a.temperature).toBe("warm");
  });

  it("labels cool-biased palettes as cool", () => {
    const a = analyzeReference(
      ref({ kind: "palette", swatches: ["#123a5a", "#2a5c85", "#6b91b8"] }),
    );
    expect(a.temperature).toBe("cool");
  });

  it("labels tag-inferred temperature when no swatches", () => {
    const a = analyzeReference(ref({ kind: "note", tags: ["cool", "steel"] }));
    expect(a.temperature).toBe("cool");
  });

  it("labels saturation vivid for punchy palettes", () => {
    const a = analyzeReference(
      ref({ kind: "palette", swatches: ["#ff0033", "#00e5ff", "#7cff00"] }),
    );
    expect(a.saturation).toBe("vivid");
  });

  it("labels saturation muted for grey palettes", () => {
    const a = analyzeReference(
      ref({ kind: "palette", swatches: ["#7a7a7a", "#8b8b8b", "#909090"] }),
    );
    expect(a.saturation).toBe("muted");
  });

  it("picks up lighting hint from tags", () => {
    const a = analyzeReference(
      ref({ kind: "image", tags: ["softbox", "moody"] }),
    );
    expect(a.lightingHint).toBe("softbox");
  });

  it("picks up composition hint from tags", () => {
    const a = analyzeReference(
      ref({ kind: "image", tags: ["overhead", "flat lay"] }),
    );
    expect(a.compositionHint).toBe("overhead");
  });

  it("brand similarity is 0 when no vocabulary provided", () => {
    const a = analyzeReference(ref({ note: "editorial luxury" }));
    expect(a.brandSimilarity).toBe(0);
  });

  it("brand similarity rises with matched vocab", () => {
    const a = analyzeReference(
      ref({ note: "editorial luxury restraint", tags: ["minimal"] }),
      { brandVocabulary: ["editorial", "luxury", "minimal", "loud"] },
    );
    expect(a.brandSimilarity).toBeGreaterThan(0);
    expect(a.brandSimilarity).toBeLessThanOrEqual(100);
  });
});

describe("analyzeWall", () => {
  it("returns one analysis per reference", () => {
    const refs = [ref({ id: "a" }), ref({ id: "b" }), ref({ id: "c" })];
    const out = analyzeWall(refs);
    expect(out).toHaveLength(3);
    expect(out.map((a) => a.id)).toEqual(["a", "b", "c"]);
  });
});

describe("proposeFromWall", () => {
  it("returns empty patch when the wall is empty", () => {
    const p = proposeFromWall([]);
    expect(p.patch).toEqual({});
    expect(p.reasoning).toEqual([]);
  });

  it("majority-votes a mood tag across references", () => {
    const refs = [
      ref({ id: "1", tags: ["serene", "window"] }),
      ref({ id: "2", tags: ["serene"] }),
      ref({ id: "3", tags: ["bold"] }),
    ];
    const analyses = analyzeWall(refs);
    const proposal = proposeFromWall(analyses);
    expect(proposal.patch.mood).toBe("serene");
    expect(
      proposal.reasoning.some((r) => r.field === "mood" && r.value === "serene"),
    ).toBe(true);
  });

  it("proposes a lighting id derived from tag majority", () => {
    const refs = [
      ref({ id: "1", tags: ["window"] }),
      ref({ id: "2", tags: ["window"] }),
      ref({ id: "3", tags: ["softbox"] }),
    ];
    const proposal = proposeFromWall(analyzeWall(refs));
    expect(proposal.patch.lighting).toBe("window");
  });

  it("derives a warm color grade from a warm, non-vivid wall", () => {
    const refs = [
      ref({ id: "1", kind: "palette", swatches: ["#a08066", "#a68e70", "#93755a"] }),
      ref({ id: "2", kind: "palette", swatches: ["#b28a70", "#a58060", "#8a6a4e"] }),
    ];
    const proposal = proposeFromWall(analyzeWall(refs));
    expect(proposal.patch.colorGrade).toBe("warm-film");
  });
});
