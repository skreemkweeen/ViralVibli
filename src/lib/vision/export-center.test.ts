import { describe, expect, it } from "vitest";
import { emptyCreativeBrief } from "./brief";
import { emptyLightingSetup } from "./lighting";
import { emptyDirection } from "./prompt";
import { newShot } from "./shots";
import { buildCampaignPlan } from "./campaign-plans";
import {
  exportCampaign,
  exportCampaignAsJson,
  exportCampaignAsMarkdown,
  exportShotsAsCsv,
  promptBundle,
  type CampaignPackageInput,
} from "./export-center";
import { TARGET_MODELS } from "./models";

function makeInput(): CampaignPackageInput {
  return {
    projectName: "Autumn ceramic",
    brief: {
      ...emptyCreativeBrief,
      objective: "Launch the mug",
      audience: "Design-forward home cooks",
      platform: "Instagram + web",
      visualKeywords: "warm, editorial, quiet",
      brandPersonality: "Refined, honest",
    },
    shots: [
      newShot("s1", "hero", emptyDirection, emptyLightingSetup(), 1),
      newShot("s2", "lifestyle", emptyDirection, emptyLightingSetup(), 2),
    ],
    campaigns: [
      buildCampaignPlan({
        planId: "camp",
        recipeId: "sample-plate",
        makeShotId: (t, i) => `camp-${t}-${i}`,
        now: 1000,
      }),
    ],
    lighting: emptyLightingSetup(),
    references: [
      {
        id: "r1",
        kind: "url",
        title: "Aesop hero",
        url: "https://example.com/aesop",
        createdAt: 1,
      },
    ],
    direction: {
      ...emptyDirection,
      subject: "hand-thrown ceramic mug",
    },
    prompt: "Hand-thrown ceramic mug. Luxury product photography.",
  };
}

describe("promptBundle", () => {
  it("returns one entry per target model", () => {
    const bundle = promptBundle("prompt text", emptyDirection);
    expect(bundle).toHaveLength(TARGET_MODELS.length);
    for (const b of bundle) {
      expect(b.modelId).toBeTruthy();
      expect(b.label).toBeTruthy();
      expect(b.text).toBeTruthy();
    }
  });
});

describe("exportCampaignAsJson", () => {
  it("returns a JSON artifact with a slugified filename", () => {
    const out = exportCampaignAsJson(makeInput());
    expect(out.mime).toBe("application/json");
    expect(out.filename).toBe("autumn-ceramic-campaign.json");
    const parsed = JSON.parse(out.content);
    expect(parsed.projectName).toBe("Autumn ceramic");
    expect(parsed.shots).toHaveLength(2);
    expect(parsed.campaigns).toHaveLength(1);
    expect(parsed.references).toHaveLength(1);
    expect(parsed.promptBundle).toHaveLength(TARGET_MODELS.length);
  });
});

describe("exportCampaignAsMarkdown", () => {
  it("emits a markdown document with brief + direction + shots + refs", () => {
    const out = exportCampaignAsMarkdown(makeInput());
    expect(out.mime).toBe("text/markdown");
    expect(out.filename.endsWith(".md")).toBe(true);
    expect(out.content).toMatch(/# Autumn ceramic/);
    expect(out.content).toMatch(/Launch the mug/);
    expect(out.content).toMatch(/Aesop hero/);
    expect(out.content).toMatch(/## Shot list/);
    expect(out.content).toMatch(/Hero/);
  });
});

describe("exportShotsAsCsv", () => {
  it("emits a header row + one row per shot", () => {
    const out = exportShotsAsCsv(makeInput());
    expect(out.mime).toBe("text/csv");
    const lines = out.content.trim().split("\n");
    expect(lines[0]).toContain("id");
    expect(lines[0]).toContain("type");
    expect(lines.length - 1).toBe(2);
    expect(lines[1]).toContain("hero");
  });
});

describe("exportCampaign dispatch", () => {
  it("selects the right format", () => {
    expect(exportCampaign(makeInput(), "json").mime).toBe("application/json");
    expect(exportCampaign(makeInput(), "markdown").mime).toBe("text/markdown");
    expect(exportCampaign(makeInput(), "csv").mime).toBe("text/csv");
  });
});
