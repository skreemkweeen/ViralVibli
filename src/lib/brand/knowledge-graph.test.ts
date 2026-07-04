import { describe, expect, it } from "vitest";
import {
  buildKnowledgeGraph,
  emptyKGInput,
  kgFilterByKind,
  kgNeighbours,
  kgNodesByDepth,
} from "./knowledge-graph";

describe("emptyKGInput", () => {
  it("seeds a graph input around a brand", () => {
    const input = emptyKGInput({ id: "b1", name: "Marrow" });
    expect(input.brand.name).toBe("Marrow");
    expect(input.projects).toEqual([]);
  });
});

describe("buildKnowledgeGraph", () => {
  it("builds a brand → project → campaign → story → vision → prompt chain", () => {
    const g = buildKnowledgeGraph({
      brand: { id: "b1", name: "Marrow" },
      projects: [{ id: "p1", name: "Autumn Launch" }],
      campaigns: [{ id: "c1", name: "Teaser", projectId: "p1" }],
      stories: [{ id: "s1", name: "Story 1", campaignId: "c1" }],
      visionConcepts: [{ id: "v1", label: "Vision hero", storyId: "s1" }],
      prompts: [{ id: "pr1", label: "prompt A", conceptId: "v1" }],
      moodboards: [],
      publishing: [{ id: "pu1", label: "IG", storyId: "s1" }],
      analytics: [{ id: "a1", label: "IG stats", publishingId: "pu1" }],
    });
    const depths = kgNodesByDepth(g);
    expect(depths[0]?.some((n) => n.kind === "brand")).toBe(true);
    expect(depths[1]?.some((n) => n.kind === "project")).toBe(true);
    expect(depths[2]?.some((n) => n.kind === "campaign")).toBe(true);
    expect(depths[3]?.some((n) => n.kind === "story")).toBe(true);
    expect(depths[4]?.some((n) => n.kind === "vision")).toBe(true);
    expect(depths[5]?.some((n) => n.kind === "prompt")).toBe(true);
    expect(depths[5]?.some((n) => n.kind === "analytics")).toBe(true);
  });
  it("de-duplicates nodes", () => {
    const input = emptyKGInput({ id: "b1", name: "Marrow" });
    input.projects.push({ id: "p1", name: "Same" });
    input.projects.push({ id: "p1", name: "Same" });
    const g = buildKnowledgeGraph(input);
    expect(g.nodes.filter((n) => n.id === "project:p1")).toHaveLength(1);
  });
});

describe("kgNeighbours", () => {
  it("returns nodes on either end of an edge", () => {
    const g = buildKnowledgeGraph({
      brand: { id: "b1", name: "Marrow" },
      projects: [{ id: "p1", name: "P" }],
      campaigns: [],
      stories: [],
      visionConcepts: [],
      prompts: [],
      moodboards: [],
      publishing: [],
      analytics: [],
    });
    const around = kgNeighbours(g, "project:p1");
    expect(around.some((n) => n.kind === "brand")).toBe(true);
  });
});

describe("kgFilterByKind", () => {
  it("returns only the requested kinds and prunes dangling edges", () => {
    const g = buildKnowledgeGraph({
      brand: { id: "b1", name: "Marrow" },
      projects: [{ id: "p1", name: "P" }],
      campaigns: [{ id: "c1", name: "C", projectId: "p1" }],
      stories: [],
      visionConcepts: [],
      prompts: [],
      moodboards: [],
      publishing: [],
      analytics: [],
    });
    const filtered = kgFilterByKind(g, ["brand", "project"]);
    expect(filtered.nodes.every((n) => n.kind === "brand" || n.kind === "project")).toBe(true);
    expect(filtered.edges.every((e) => e.from.startsWith("brand:") && e.to.startsWith("project:"))).toBe(true);
  });
});
