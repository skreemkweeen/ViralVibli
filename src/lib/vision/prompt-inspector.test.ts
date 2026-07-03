import { describe, expect, it } from "vitest";
import { emptyDirection } from "./prompt";
import { inspectPrompt } from "./prompt-inspector";

describe("inspectPrompt", () => {
  it("returns 9 dimensions and an overall score", () => {
    const report = inspectPrompt(emptyDirection, "prompt text");
    expect(report.dimensions).toHaveLength(9);
    expect(report.overall).toBeGreaterThanOrEqual(0);
    expect(report.overall).toBeLessThanOrEqual(100);
  });

  it("completeness rises as fields are filled", () => {
    const bare = inspectPrompt(
      { ...emptyDirection, subject: "" },
      "prompt",
    );
    const full = inspectPrompt(
      {
        ...emptyDirection,
        subject: "hand-thrown ceramic mug",
        environment: "on stone shelf",
        material: "ceramic",
        texture: "matte",
        timeOfDay: "morning",
      },
      "prompt",
    );
    const bareScore = bare.dimensions.find((d) => d.id === "completeness")!.score;
    const fullScore = full.dimensions.find((d) => d.id === "completeness")!.score;
    expect(fullScore).toBeGreaterThan(bareScore);
  });

  it("specificity rewards long subject + environment + material", () => {
    const generic = inspectPrompt(
      { ...emptyDirection, subject: "mug", material: null, environment: "" },
      "short prompt",
    );
    const specific = inspectPrompt(
      {
        ...emptyDirection,
        subject: "hand-thrown ceramic mug with fingerprints",
        material: "ceramic",
        environment: "on sun-bleached stone shelf",
      },
      "a longer prompt with concrete detail that reads clearly",
    );
    const g = generic.dimensions.find((d) => d.id === "specificity")!.score;
    const s = specific.dimensions.find((d) => d.id === "specificity")!.score;
    expect(s).toBeGreaterThan(g);
  });

  it("composition penalises missing composition", () => {
    const withoutComp = inspectPrompt(
      { ...emptyDirection, composition: null },
      "prompt",
    );
    const withComp = inspectPrompt(
      { ...emptyDirection, composition: "thirds" },
      "prompt",
    );
    expect(
      withoutComp.dimensions.find((d) => d.id === "composition")!.score,
    ).toBeLessThan(
      withComp.dimensions.find((d) => d.id === "composition")!.score,
    );
  });

  it("platform score aligns with the intended shot type", () => {
    const nine16 = inspectPrompt(
      { ...emptyDirection, aspect: "9-16" },
      "prompt",
      { intendedType: "tiktok" },
    );
    const wrong = inspectPrompt(
      { ...emptyDirection, aspect: "1-1" },
      "prompt",
      { intendedType: "tiktok" },
    );
    expect(
      nine16.dimensions.find((d) => d.id === "platform-optimization")!.score,
    ).toBeGreaterThan(
      wrong.dimensions.find((d) => d.id === "platform-optimization")!.score,
    );
  });

  it("style consistency scores against the shot spec when a type is set", () => {
    const aligned = inspectPrompt(
      { ...emptyDirection, aspect: "1-1", composition: "overhead", lens: "50" },
      "prompt",
      { intendedType: "flat-lay" },
    );
    const misaligned = inspectPrompt(
      { ...emptyDirection, aspect: "16-9", composition: "closeup", lens: "24" },
      "prompt",
      { intendedType: "flat-lay" },
    );
    expect(
      aligned.dimensions.find((d) => d.id === "style-consistency")!.score,
    ).toBeGreaterThan(
      misaligned.dimensions.find((d) => d.id === "style-consistency")!.score,
    );
  });

  it("estimated quality rises with prompt length + ultra quality", () => {
    const low = inspectPrompt(
      { ...emptyDirection, quality: "standard" },
      "short",
    );
    const high = inspectPrompt(
      { ...emptyDirection, quality: "ultra", render: "photographic" },
      "a much longer prompt with plenty of detail and considered direction that runs past two hundred characters to bias the length-based scoring upward.",
      { targetModel: "midjourney" },
    );
    expect(
      high.dimensions.find((d) => d.id === "estimated-quality")!.score,
    ).toBeGreaterThan(
      low.dimensions.find((d) => d.id === "estimated-quality")!.score,
    );
  });

  it("provides fixes on low-scoring dimensions", () => {
    const bare = inspectPrompt(
      { ...emptyDirection, composition: null, lighting: null },
      "prompt",
    );
    const comp = bare.dimensions.find((d) => d.id === "composition")!;
    const light = bare.dimensions.find((d) => d.id === "lighting")!;
    expect(comp.fix).toBeTruthy();
    expect(light.fix).toBeTruthy();
  });
});
