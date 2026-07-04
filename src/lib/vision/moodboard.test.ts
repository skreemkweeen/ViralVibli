import { describe, expect, it } from "vitest";
import {
  addManualReference,
  isConceptPinned,
  pinConceptReference,
  removeReference,
  reorderReferences,
  updateNote,
  type MoodboardItem,
} from "./moodboard";

const now = 1_700_000_000_000;

describe("addManualReference", () => {
  it("adds a manual item to the front of the board", () => {
    const items = addManualReference(
      [],
      { id: "a", title: "Old world craft", note: "quiet + warm", hue: 45 },
      now,
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "a",
      kind: "manual",
      title: "Old world craft",
      note: "quiet + warm",
      hue: 45,
    });
  });

  it("trims empty title and note; drops empty title as no-op", () => {
    expect(addManualReference([], { id: "x", title: "   " }, now)).toEqual([]);
    const items = addManualReference(
      [],
      { id: "y", title: "  hero shot  ", note: "  " },
      now,
    );
    expect(items[0]).toMatchObject({ title: "hero shot", note: undefined });
  });

  it("normalises the hue into 0..359 with a stable default", () => {
    const defaulted = addManualReference([], { id: "d", title: "no hue" }, now);
    expect((defaulted[0] as MoodboardItem & { kind: "manual" }).hue).toBe(82);
    const wrapped = addManualReference(
      [],
      { id: "w", title: "wrap", hue: 400 },
      now,
    );
    expect((wrapped[0] as MoodboardItem & { kind: "manual" }).hue).toBe(40);
    const negative = addManualReference(
      [],
      { id: "n", title: "neg", hue: -20 },
      now,
    );
    expect((negative[0] as MoodboardItem & { kind: "manual" }).hue).toBe(340);
  });
});

describe("pinConceptReference", () => {
  it("prepends a concept reference and dedupes on conceptId", () => {
    const first = pinConceptReference(
      [],
      { id: "r1", conceptId: "c1", prompt: "P", seed: "s" },
      now,
    );
    expect(first).toHaveLength(1);
    const twice = pinConceptReference(
      first,
      { id: "r2", conceptId: "c1", prompt: "P", seed: "s" },
      now,
    );
    expect(twice).toHaveLength(1);
    expect(twice[0].id).toBe("r1");
  });
});

describe("isConceptPinned", () => {
  it("returns true only when a concept reference is present", () => {
    const items = pinConceptReference(
      [],
      { id: "r", conceptId: "c1", prompt: "P", seed: "s" },
      now,
    );
    expect(isConceptPinned(items, "c1")).toBe(true);
    expect(isConceptPinned(items, "c2")).toBe(false);
  });
});

describe("removeReference", () => {
  it("removes by id and returns a new array", () => {
    const items = addManualReference(
      addManualReference([], { id: "a", title: "one" }, now),
      { id: "b", title: "two" },
      now,
    );
    const next = removeReference(items, "a");
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe("b");
  });
});

describe("updateNote", () => {
  it("sets a trimmed note, and clears when the input trims to empty", () => {
    const items = addManualReference(
      [],
      { id: "a", title: "hero" },
      now,
    );
    const noted = updateNote(items, "a", "  window light + linen  ");
    expect(noted[0].note).toBe("window light + linen");
    const cleared = updateNote(noted, "a", "   ");
    expect(cleared[0].note).toBeUndefined();
  });
});

describe("reorderReferences", () => {
  const base: MoodboardItem[] = [
    { id: "a", kind: "manual", title: "A", hue: 82, createdAt: 1 },
    { id: "b", kind: "manual", title: "B", hue: 82, createdAt: 2 },
    { id: "c", kind: "manual", title: "C", hue: 82, createdAt: 3 },
  ];

  it("moves an item from one index to another", () => {
    const moved = reorderReferences(base, 0, 2);
    expect(moved.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("is a no-op when from equals to", () => {
    expect(reorderReferences(base, 1, 1)).toBe(base);
  });

  it("is a no-op when either index is out of range", () => {
    expect(reorderReferences(base, -1, 2)).toBe(base);
    expect(reorderReferences(base, 0, 99)).toBe(base);
  });
});
