import { describe, expect, it } from "vitest";
import {
  addColor,
  addTypography,
  defaultVisualLanguage,
  paletteMinimalismScore,
  primaryColor,
  removeColor,
  removeTypography,
  updateVisual,
} from "./visual-language";

describe("defaultVisualLanguage", () => {
  it("seeds a primary + ink + surface color", () => {
    const vl = defaultVisualLanguage();
    expect(vl.colors).toHaveLength(3);
    expect(primaryColor(vl)).toBe("#c8f04e");
  });
});

describe("addColor / removeColor", () => {
  it("replaces by id", () => {
    let vl = defaultVisualLanguage();
    vl = addColor(vl, {
      id: "color-primary",
      role: "primary",
      label: "Warm accent",
      value: "#f6a55c",
    });
    expect(vl.colors.filter((c) => c.id === "color-primary")).toHaveLength(1);
    expect(primaryColor(vl)).toBe("#f6a55c");
    vl = removeColor(vl, "color-primary");
    expect(primaryColor(vl)).toBeUndefined();
  });
});

describe("typography", () => {
  it("adds + removes typefaces", () => {
    let vl = defaultVisualLanguage();
    vl = addTypography(vl, { id: "type-editorial", role: "editorial", family: "Iowan Old Style" });
    expect(vl.typography.some((t) => t.family === "Iowan Old Style")).toBe(true);
    vl = removeTypography(vl, "type-editorial");
    expect(vl.typography.some((t) => t.family === "Iowan Old Style")).toBe(false);
  });
});

describe("updateVisual", () => {
  it("patches nested fields", () => {
    const vl = updateVisual(defaultVisualLanguage(), {
      photography: "documentary",
      camera: "85mm",
    });
    expect(vl.photography).toBe("documentary");
    expect(vl.camera).toBe("85mm");
  });
});

describe("paletteMinimalismScore", () => {
  it("returns a 0-100 number", () => {
    const s = paletteMinimalismScore(defaultVisualLanguage());
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
  it("drops when many accents are added", () => {
    let vl = defaultVisualLanguage();
    const start = paletteMinimalismScore(vl);
    for (let i = 0; i < 6; i++) {
      vl = addColor(vl, {
        id: `accent-${i}`,
        role: "accent",
        label: `Accent ${i}`,
        value: `#00${(i * 10).toString(16).padStart(2, "0")}00`,
      });
    }
    expect(paletteMinimalismScore(vl)).toBeLessThanOrEqual(start);
  });
});
