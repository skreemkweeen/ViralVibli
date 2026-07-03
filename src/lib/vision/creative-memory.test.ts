import { describe, expect, it } from "vitest";
import {
  addPreference,
  bumpPreference,
  CATEGORY_META,
  categorySize,
  emptyMemory,
  findPreference,
  removePreference,
  topPreferences,
  totalPreferences,
  updatePreference,
} from "./creative-memory";

describe("emptyMemory", () => {
  it("has every documented category", () => {
    const m = emptyMemory();
    for (const k of Object.keys(CATEGORY_META)) {
      expect(m[k as keyof typeof CATEGORY_META]).toEqual([]);
    }
  });
});

describe("addPreference", () => {
  it("appends and sorts by weight desc", () => {
    let m = emptyMemory();
    m = addPreference(m, "lenses", { id: "50", label: "50mm", weight: 60 });
    m = addPreference(m, "lenses", { id: "85", label: "85mm", weight: 80 });
    m = addPreference(m, "lenses", { id: "24", label: "24mm", weight: 40 });
    expect(m.lenses.map((e) => e.id)).toEqual(["85", "50", "24"]);
  });

  it("bumps an existing entry rather than duplicating", () => {
    let m = emptyMemory();
    m = addPreference(m, "cameras", { id: "hb", label: "Hasselblad", weight: 60 });
    m = addPreference(m, "cameras", { id: "hb", label: "Hasselblad", weight: 60 });
    expect(m.cameras).toHaveLength(1);
    expect(m.cameras[0]!.weight).toBe(65);
  });
});

describe("removePreference", () => {
  it("drops the entry by id", () => {
    let m = emptyMemory();
    m = addPreference(m, "lenses", { id: "50", label: "50mm", weight: 60 });
    m = removePreference(m, "lenses", "50");
    expect(m.lenses).toHaveLength(0);
  });
});

describe("updatePreference", () => {
  it("edits label / weight / note and clamps weight to [0, 100]", () => {
    let m = emptyMemory();
    m = addPreference(m, "lenses", { id: "50", label: "50mm", weight: 60 });
    m = updatePreference(m, "lenses", "50", {
      label: "50mm f/1.4",
      weight: 250,
      note: "Sigma Art",
    });
    const e = findPreference(m, "lenses", "50");
    expect(e?.label).toBe("50mm f/1.4");
    expect(e?.weight).toBe(100);
    expect(e?.note).toBe("Sigma Art");
  });

  it("resorts after an edit", () => {
    let m = emptyMemory();
    m = addPreference(m, "lenses", { id: "50", label: "50mm", weight: 60 });
    m = addPreference(m, "lenses", { id: "85", label: "85mm", weight: 80 });
    m = updatePreference(m, "lenses", "50", { weight: 95 });
    expect(m.lenses.map((e) => e.id)).toEqual(["50", "85"]);
  });
});

describe("bumpPreference", () => {
  it("adds delta and clamps", () => {
    let m = emptyMemory();
    m = addPreference(m, "cameras", { id: "hb", label: "Hasselblad", weight: 90 });
    m = bumpPreference(m, "cameras", "hb", 20);
    expect(findPreference(m, "cameras", "hb")?.weight).toBe(100);
  });

  it("no-op on unknown id", () => {
    let m = emptyMemory();
    m = addPreference(m, "cameras", { id: "hb", label: "Hasselblad", weight: 60 });
    const same = bumpPreference(m, "cameras", "nope");
    expect(same.cameras).toEqual(m.cameras);
  });
});

describe("read helpers", () => {
  it("topPreferences respects k", () => {
    let m = emptyMemory();
    for (let i = 0; i < 8; i++)
      m = addPreference(m, "aesthetics", {
        id: `a${i}`,
        label: `aesthetic ${i}`,
        weight: i * 10,
      });
    expect(topPreferences(m, "aesthetics", 3)).toHaveLength(3);
  });

  it("categorySize + totalPreferences", () => {
    let m = emptyMemory();
    m = addPreference(m, "cameras", { id: "a", label: "a", weight: 50 });
    m = addPreference(m, "lenses", { id: "b", label: "b", weight: 50 });
    m = addPreference(m, "lenses", { id: "c", label: "c", weight: 50 });
    expect(categorySize(m, "cameras")).toBe(1);
    expect(categorySize(m, "lenses")).toBe(2);
    expect(totalPreferences(m)).toBe(3);
  });
});
