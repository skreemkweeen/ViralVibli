import { describe, expect, it } from "vitest";
import { buildPromptGraph } from "./graph";
import type { PromptEntry } from "./types";

function p(id: string, patch: Partial<PromptEntry> = {}): PromptEntry {
  return {
    id,
    title: id,
    content: "",
    category: "creative",
    tags: [],
    source: "user",
    favorite: false,
    pinned: false,
    usageCount: 0,
    versions: [],
    createdAt: 0,
    updatedAt: 0,
    ...patch,
  };
}

describe("buildPromptGraph", () => {
  it("returns an empty graph for empty input", () => {
    expect(buildPromptGraph([])).toEqual({ nodes: [], edges: [], maxWeight: 0 });
  });

  it("returns one node with degree 0 for a single prompt", () => {
    const g = buildPromptGraph([p("a", { tags: ["launch"] })]);
    expect(g.nodes).toHaveLength(1);
    expect(g.nodes[0].degree).toBe(0);
    expect(g.edges).toHaveLength(0);
    expect(g.maxWeight).toBe(0);
  });

  it("connects nodes when they share tags", () => {
    const g = buildPromptGraph([
      p("a", { tags: ["launch", "editorial"] }),
      p("b", { tags: ["editorial", "beauty"] }),
      p("c", { tags: ["macro"] }),
    ]);
    expect(g.edges).toHaveLength(1);
    expect(g.edges[0].source).toBe("a");
    expect(g.edges[0].target).toBe("b");
    expect(g.edges[0].sharedTags).toEqual(["editorial"]);
    expect(g.edges[0].weight).toBe(1);
    expect(g.maxWeight).toBe(1);
  });

  it("weight equals the number of shared tags between the pair", () => {
    const g = buildPromptGraph([
      p("a", { tags: ["x", "y", "z"] }),
      p("b", { tags: ["y", "z", "w"] }),
    ]);
    expect(g.edges[0].weight).toBe(2);
    expect(g.edges[0].sharedTags.sort()).toEqual(["y", "z"]);
  });

  it("increments degrees per incident edge", () => {
    const g = buildPromptGraph([
      p("a", { tags: ["t"] }),
      p("b", { tags: ["t"] }),
      p("c", { tags: ["t"] }),
    ]);
    // a-b, a-c, b-c → 3 edges, every node has degree 2
    expect(g.edges).toHaveLength(3);
    for (const node of g.nodes) {
      expect(node.degree).toBe(2);
    }
  });

  it("lays nodes out on a unit circle around (0.5, 0.5)", () => {
    const g = buildPromptGraph([
      p("a", { tags: [] }),
      p("b", { tags: [] }),
      p("c", { tags: [] }),
      p("d", { tags: [] }),
    ]);
    // With 4 nodes and starting at -π/2 (top), we expect first at ~y=0.08, third at ~y=0.92
    expect(g.nodes[0].y).toBeCloseTo(0.08, 2);
    expect(g.nodes[0].x).toBeCloseTo(0.5, 2);
    expect(g.nodes[2].y).toBeCloseTo(0.92, 2);
  });

  it("orders nodes deterministically by category, title, id", () => {
    const g1 = buildPromptGraph([
      p("z", { category: "creative", title: "Zebra" }),
      p("a", { category: "creative", title: "Alpha" }),
    ]);
    const g2 = buildPromptGraph([
      p("a", { category: "creative", title: "Alpha" }),
      p("z", { category: "creative", title: "Zebra" }),
    ]);
    expect(g1.nodes.map((n) => n.id)).toEqual(g2.nodes.map((n) => n.id));
    expect(g1.nodes.map((n) => n.id)).toEqual(["a", "z"]);
  });
});
