import { describe, expect, it } from "vitest";
import {
  PRESET_STYLES,
  applyStyleTo,
  deleteStyle,
  saveStyle,
  withPresets,
} from "./style-library";
import { emptyDirection } from "./prompt";
import type { Direction } from "./prompt";

describe("Style Library presets", () => {
  it("ships 12 curated brand presets", () => {
    expect(PRESET_STYLES).toHaveLength(12);
    for (const s of PRESET_STYLES) {
      expect(s.preset).toBe(true);
      expect(s.overrides.style).toBeTruthy();
    }
  });

  it("preset ids are unique", () => {
    const ids = PRESET_STYLES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("withPresets appends presets that aren't already in user list", () => {
    const merged = withPresets([]);
    expect(merged.length).toBe(PRESET_STYLES.length);
    expect(merged[merged.length - 1].preset).toBe(true);
  });

  it("withPresets skips presets that the user has overridden by id", () => {
    const merged = withPresets([
      { ...PRESET_STYLES[0], preset: false, createdAt: 1 },
    ]);
    // Only one Apple should show up (the user copy)
    const apples = merged.filter((s) => s.id === PRESET_STYLES[0].id);
    expect(apples).toHaveLength(1);
    expect(apples[0].preset).toBe(false);
  });
});

describe("Style Library CRUD", () => {
  it("saveStyle rejects blank names", () => {
    const res = saveStyle([], { name: "   ", overrides: {} });
    expect(res.id).toBeNull();
    expect(res.list).toEqual([]);
  });

  it("saveStyle rejects duplicate names (case-insensitive)", () => {
    const seed: Parameters<typeof saveStyle>[1] = {
      name: "Custom",
      overrides: { style: "editorial" },
    };
    const first = saveStyle([], seed);
    expect(first.id).not.toBeNull();
    const second = saveStyle(first.list, { name: "CUSTOM", overrides: {} });
    expect(second.id).toBeNull();
  });

  it("saveStyle prepends the new style to the list", () => {
    const seed = saveStyle([], { name: "A", overrides: {} });
    const next = saveStyle(seed.list, { name: "B", overrides: {} });
    expect(next.list[0].name).toBe("B");
  });

  it("deleteStyle removes a user style", () => {
    const seed = saveStyle([], { name: "Test", overrides: {} });
    const list = deleteStyle(seed.list, seed.id!);
    expect(list.find((s) => s.id === seed.id)).toBeUndefined();
  });

  it("deleteStyle refuses to remove a preset", () => {
    const list = deleteStyle([PRESET_STYLES[0]], PRESET_STYLES[0].id);
    expect(list).toHaveLength(1);
  });
});

describe("applyStyleTo", () => {
  it("overrides only the fields the style defines", () => {
    const base: Direction = { ...emptyDirection, subject: "ceramic mug" };
    const styled = applyStyleTo(base, PRESET_STYLES[2]); // Aesop
    expect(styled.subject).toBe("ceramic mug"); // untouched
    expect(styled.material).toBe("brass"); // Aesop's override
    expect(styled.lighting).toBe("window"); // Aesop's override
  });

  it("returns a new object without mutating input", () => {
    const base: Direction = { ...emptyDirection };
    const styled = applyStyleTo(base, PRESET_STYLES[0]);
    expect(styled).not.toBe(base);
    expect(base.style).toBe(emptyDirection.style);
  });
});
