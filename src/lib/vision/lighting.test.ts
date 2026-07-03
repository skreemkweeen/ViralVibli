import { describe, expect, it } from "vitest";
import {
  LIGHTING_PRESETS,
  LIGHT_ROLES,
  computeLightingDiagram,
  defaultLight,
  emptyLightingSetup,
  findPreset,
  isSetupActive,
  kelvinToHex,
  updateLight,
} from "./lighting";

describe("Lighting defaults", () => {
  it("emptyLightingSetup has all six roles", () => {
    const s = emptyLightingSetup();
    for (const r of LIGHT_ROLES) {
      expect(s.lights[r].role).toBe(r);
    }
  });

  it("key + fill + ambient are enabled by default", () => {
    const s = emptyLightingSetup();
    expect(s.lights.key.enabled).toBe(true);
    expect(s.lights.fill.enabled).toBe(true);
    expect(s.lights.ambient.enabled).toBe(true);
    expect(s.lights.rim.enabled).toBe(false);
  });

  it("defaultLight returns role-appropriate seeds", () => {
    expect(defaultLight("key").angle).toBe(45);
    expect(defaultLight("fill").angle).toBe(-45);
    expect(defaultLight("rim").angle).toBeGreaterThan(90);
    expect(defaultLight("hair").height).toBeGreaterThan(2);
    expect(defaultLight("practical").temperature).toBeLessThan(5000);
  });
});

describe("Presets", () => {
  it("ships six named presets", () => {
    expect(LIGHTING_PRESETS).toHaveLength(6);
    for (const id of ["three-point", "natural-window", "rembrandt", "split", "high-key", "low-key"] as const) {
      expect(findPreset(id)?.id).toBe(id);
    }
  });

  it("high-key preset makes fill nearly as bright as key", () => {
    const s = findPreset("high-key")!.apply(emptyLightingSetup());
    expect(s.lights.fill.intensity).toBeGreaterThanOrEqual(70);
    expect(s.presetId).toBe("high-key");
  });

  it("low-key preset drops ambient to a whisper", () => {
    const s = findPreset("low-key")!.apply(emptyLightingSetup());
    expect(s.lights.ambient.intensity).toBeLessThan(10);
    expect(s.lights.rim.enabled).toBe(true);
  });

  it("natural-window preset raises softness on the key light", () => {
    const s = findPreset("natural-window")!.apply(emptyLightingSetup());
    expect(s.lights.key.softness).toBeGreaterThan(90);
    expect(s.lights.key.modifier).toBe("window");
  });

  it("split preset zeroes fill and lights key + rim only", () => {
    const s = findPreset("split")!.apply(emptyLightingSetup());
    expect(s.lights.fill.enabled).toBe(false);
    expect(s.lights.key.enabled).toBe(true);
    expect(s.lights.rim.enabled).toBe(true);
  });
});

describe("updateLight", () => {
  it("patches a single light without mutating the setup", () => {
    const before = emptyLightingSetup();
    const after = updateLight(before, "key", { intensity: 30 });
    expect(after.lights.key.intensity).toBe(30);
    expect(before.lights.key.intensity).not.toBe(30);
  });

  it("clears the preset badge on manual edits", () => {
    const seeded = findPreset("three-point")!.apply(emptyLightingSetup());
    expect(seeded.presetId).toBe("three-point");
    const edited = updateLight(seeded, "key", { intensity: 50 });
    expect(edited.presetId).toBeUndefined();
  });
});

describe("Diagram geometry", () => {
  it("returns a node per role", () => {
    const nodes = computeLightingDiagram(emptyLightingSetup());
    expect(nodes).toHaveLength(LIGHT_ROLES.length);
    for (const r of LIGHT_ROLES) {
      expect(nodes.find((n) => n.role === r)).toBeDefined();
    }
  });

  it("places angle=0 above the origin (behind camera in top-down orientation)", () => {
    const setup = updateLight(emptyLightingSetup(), "hair", { angle: 0 });
    const nodes = computeLightingDiagram(setup);
    const hair = nodes.find((n) => n.role === "hair")!;
    expect(hair.x).toBeCloseTo(0, 3);
    expect(hair.y).toBeLessThan(0);
  });

  it("angle 90° lands the node on the +x axis", () => {
    const setup = updateLight(emptyLightingSetup(), "practical", { angle: 90 });
    const nodes = computeLightingDiagram(setup);
    const practical = nodes.find((n) => n.role === "practical")!;
    expect(practical.x).toBeCloseTo(1, 3);
    expect(practical.y).toBeCloseTo(0, 3);
  });

  it("marks disabled lights as inactive in the diagram", () => {
    const nodes = computeLightingDiagram(emptyLightingSetup());
    expect(nodes.find((n) => n.role === "rim")?.active).toBe(false);
    expect(nodes.find((n) => n.role === "key")?.active).toBe(true);
  });

  it("kelvinToHex reads warmer for tungsten, cooler for daylight", () => {
    expect(kelvinToHex(3200)).not.toBe(kelvinToHex(6500));
    // Warm should have higher red channel than cool
    const warm = parseInt(kelvinToHex(2500).slice(1, 3), 16);
    const cool = parseInt(kelvinToHex(9000).slice(1, 3), 16);
    expect(warm).toBeGreaterThan(cool);
  });
});

describe("isSetupActive", () => {
  it("true when any light is enabled", () => {
    expect(isSetupActive(emptyLightingSetup())).toBe(true);
  });

  it("false when everything is disabled", () => {
    let s = emptyLightingSetup();
    for (const r of LIGHT_ROLES) {
      s = updateLight(s, r, { enabled: false });
    }
    expect(isSetupActive(s)).toBe(false);
  });
});
