import { describe, expect, it } from "vitest";
import { addValueTag, emptyBrand, setPersonalityAxis } from "./brand-dna";
import { defaultVisualLanguage } from "./visual-language";
import { analyseConsistency } from "./consistency";

describe("analyseConsistency", () => {
  it("returns 10 dimensions with an overall row", () => {
    const rep = analyseConsistency(emptyBrand("b"), defaultVisualLanguage(), {
      text: "Quiet, considered piece.",
    });
    expect(rep.dimensions).toHaveLength(10);
    expect(rep.dimensions.find((d) => d.id === "overall")!.score).toBe(rep.overall);
  });

  it("voice dimension penalises forbidden words", () => {
    const brand = addValueTag(emptyBrand("b"), "forbiddenWords", "awesome");
    const on = analyseConsistency(brand, defaultVisualLanguage(), {
      text: "This is quiet and considered.",
    });
    const off = analyseConsistency(brand, defaultVisualLanguage(), {
      text: "This is awesome.",
    });
    expect(on.dimensions.find((d) => d.id === "voice")!.score).toBeGreaterThan(
      off.dimensions.find((d) => d.id === "voice")!.score,
    );
  });

  it("visual dimension rewards brand-palette colours", () => {
    const brand = emptyBrand("b");
    const on = analyseConsistency(brand, defaultVisualLanguage(), {
      colors: ["#c8f04e"],
    });
    const off = analyseConsistency(brand, defaultVisualLanguage(), {
      colors: ["#ff00ff", "#00ffff"],
    });
    expect(on.dimensions.find((d) => d.id === "visual")!.score).toBeGreaterThan(
      off.dimensions.find((d) => d.id === "visual")!.score,
    );
  });

  it("messaging dimension rewards vocab hits", () => {
    const brand = addValueTag(emptyBrand("b"), "vocabulary", "quiet");
    const on = analyseConsistency(brand, defaultVisualLanguage(), {
      text: "A quiet, considered piece.",
    });
    const off = analyseConsistency(brand, defaultVisualLanguage(), {
      text: "Nothing on-brand here.",
    });
    expect(
      on.dimensions.find((d) => d.id === "messaging")!.score,
    ).toBeGreaterThan(
      off.dimensions.find((d) => d.id === "messaging")!.score,
    );
  });

  it("luxury dimension aligns with brand target", () => {
    const brand = setPersonalityAxis(emptyBrand("b"), "luxury", 90);
    const on = analyseConsistency(brand, defaultVisualLanguage(), {
      text: "Considered, quiet, refined, editorial, restraint.",
    });
    const off = analyseConsistency(brand, defaultVisualLanguage(), {
      text: "Loud fast product ad.",
    });
    expect(on.dimensions.find((d) => d.id === "luxury")!.score).toBeGreaterThan(
      off.dimensions.find((d) => d.id === "luxury")!.score,
    );
  });

  it("platform-fit penalises text over the platform cap", () => {
    const brand = emptyBrand("b");
    const long = "x".repeat(1200);
    const on = analyseConsistency(brand, defaultVisualLanguage(), {
      text: "short",
      platform: "instagram",
    });
    const off = analyseConsistency(brand, defaultVisualLanguage(), {
      text: long,
      platform: "instagram",
    });
    expect(
      on.dimensions.find((d) => d.id === "platform-fit")!.score,
    ).toBeGreaterThan(
      off.dimensions.find((d) => d.id === "platform-fit")!.score,
    );
  });
});
