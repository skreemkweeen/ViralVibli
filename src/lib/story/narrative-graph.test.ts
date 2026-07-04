import { describe, expect, it } from "vitest";
import { buildCampaign } from "./story-campaigns";
import { buildNarrativeGraph, neighbours, nodesByDepth } from "./narrative-graph";
import { emptySlide, type RichSlide } from "./story-slides";

describe("narrative graph", () => {
  it("emits a project → campaign → sequence → story → slide chain", () => {
    const { campaign, stories } = buildCampaign({
      campaignId: "c1",
      templateId: "sale",
      now: 1,
    });
    const graph = buildNarrativeGraph({
      projectId: "p1",
      projectLabel: "Autumn Ceramic",
      brandLabel: "Marrow",
      campaigns: [campaign],
      stories,
    });
    const depths = nodesByDepth(graph);
    expect(depths[0]?.some((n) => n.kind === "project")).toBe(true);
    expect(depths[1]?.some((n) => n.kind === "campaign")).toBe(true);
    expect(depths[2]?.some((n) => n.kind === "sequence")).toBe(true);
    expect(depths[3]?.some((n) => n.kind === "story")).toBe(true);
    expect(depths[4]?.some((n) => n.kind === "slide")).toBe(true);
  });

  it("emits an edge from brand to campaign when brandLabel is set", () => {
    const { campaign, stories } = buildCampaign({
      campaignId: "c1",
      templateId: "sale",
    });
    const graph = buildNarrativeGraph({
      brandLabel: "Marrow",
      campaigns: [campaign],
      stories,
    });
    const edge = graph.edges.find(
      (e) => e.from === "brand:Marrow" && e.to === `campaign:${campaign.id}`,
    );
    expect(edge?.label).toBe("authors");
  });

  it("attaches vision + asset nodes for slides that reference them", () => {
    const slide: RichSlide = {
      ...emptySlide("slide-1", 0),
      visionConceptId: "vis-42",
      attachments: [
        { id: "a-1", kind: "image", label: "Hero mug", url: "https://ex.com/hero.png" },
      ],
    };
    const story = {
      id: "story-1",
      name: "Story 1",
      slides: [slide],
      createdAt: 0,
      updatedAt: 0,
    };
    const campaign = {
      id: "c-1",
      name: "C",
      templateId: "sale",
      goal: "",
      platforms: [] as never[],
      sequences: [
        { id: "seq-1", label: "S", hint: "", storyIds: ["story-1"] },
      ],
      createdAt: 0,
      updatedAt: 0,
    };
    const graph = buildNarrativeGraph({ campaigns: [campaign], stories: [story] });
    expect(graph.nodes.find((n) => n.kind === "vision")).toBeTruthy();
    expect(graph.nodes.find((n) => n.kind === "asset")).toBeTruthy();
    expect(neighbours(graph, "slide:slide-1").some((n) => n.kind === "vision")).toBe(true);
  });
});
