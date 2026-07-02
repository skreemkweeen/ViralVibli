import { describe, expect, it } from "vitest";
import {
  buildProjectGraph,
  connectedIds,
  projectSummary,
} from "./graph";
import type { Project } from "@/lib/workspace/types";

function seedProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "p1",
    name: "Skincare launch",
    description: "Spring launch",
    color: "lime",
    items: [],
    notes: [],
    createdAt: 1_000,
    updatedAt: 1_000,
    ...overrides,
  };
}

describe("buildProjectGraph", () => {
  it("always contains the project root at the graph centre", () => {
    const g = buildProjectGraph(seedProject(), {});
    expect(g.nodes.length).toBeGreaterThan(0);
    const root = g.nodes[0];
    expect(root.kind).toBe("project");
    expect(root.x).toBeCloseTo(360);
    expect(root.y).toBeCloseTo(240);
  });

  it("adds one node + one edge per referenced item", () => {
    const g = buildProjectGraph(seedProject(), {
      stories: [{ id: "s1", title: "Story A", createdAt: 1 }],
      images: [{ id: "i1", title: "Image A", createdAt: 2 }],
      prompts: [{ id: "pr1", title: "Prompt A", createdAt: 3 }],
    });
    expect(g.nodes.length).toBe(4);
    expect(g.edges.length).toBe(3);
    expect(g.edges.every((e) => e.from === "project:p1")).toBe(true);
  });

  it("dedupes duplicate ids across sources", () => {
    const g = buildProjectGraph(
      seedProject({
        items: [{ type: "story", id: "shared", title: "Ref" }],
      }),
      {
        stories: [{ id: "shared", title: "Story A" }],
      },
    );
    const storyNodes = g.nodes.filter((n) => n.kind === "story");
    expect(storyNodes).toHaveLength(1);
  });

  it("places clusters at distinct angles", () => {
    const g = buildProjectGraph(seedProject(), {
      stories: [{ id: "s1", title: "s" }],
      images: [{ id: "i1", title: "i" }],
      prompts: [{ id: "pr1", title: "p" }],
      moodboard: [{ id: "m1", title: "m" }],
    });
    const angles = g.nodes
      .filter((n) => n.kind !== "project")
      .map((n) => Math.atan2(n.y - 240, n.x - 360));
    // Every cluster should land at a different angle
    const unique = new Set(angles.map((a) => Math.round(a * 100)));
    expect(unique.size).toBe(4);
  });

  it("filters activity to this project only", () => {
    const g = buildProjectGraph(seedProject(), {
      activity: [
        { id: "a1", title: "own", projectId: "p1" },
        { id: "a2", title: "other", projectId: "p2" },
        { id: "a3", title: "orphan" }, // no projectId
      ],
    });
    const acts = g.nodes.filter((n) => n.kind === "activity");
    expect(acts.map((a) => a.label).sort()).toEqual(["orphan", "own"]);
  });

  it("caps activity at 4 entries", () => {
    const g = buildProjectGraph(seedProject(), {
      activity: Array.from({ length: 10 }, (_, i) => ({
        id: `a${i}`,
        title: `event ${i}`,
        projectId: "p1",
      })),
    });
    const acts = g.nodes.filter((n) => n.kind === "activity");
    expect(acts).toHaveLength(4);
  });
});

describe("connectedIds", () => {
  it("returns every neighbor of a node bidirectionally", () => {
    const g = buildProjectGraph(seedProject(), {
      stories: [{ id: "s1", title: "s" }],
      images: [{ id: "i1", title: "i" }],
    });
    const rootConnections = connectedIds(g, "project:p1");
    expect(rootConnections).toContain("story:s1");
    expect(rootConnections).toContain("image:i1");
    const storyConnections = connectedIds(g, "story:s1");
    expect(storyConnections).toEqual(["project:p1"]);
  });
});

describe("projectSummary", () => {
  it("counts every kind including notes", () => {
    const p = seedProject({
      notes: [
        { id: "n1", body: "n", createdAt: 1 },
        { id: "n2", body: "n2", createdAt: 2 },
      ],
    });
    const s = projectSummary(p, {
      stories: [{ id: "a", title: "" }, { id: "b", title: "" }],
      images: [{ id: "c", title: "" }],
      prompts: [{ id: "d", title: "" }],
      moodboard: [{ id: "e", title: "" }],
      activity: [
        { id: "a1", title: "own", projectId: "p1" },
        { id: "a2", title: "other", projectId: "p2" },
      ],
    });
    expect(s).toEqual({
      stories: 2,
      images: 1,
      prompts: 1,
      moodboard: 1,
      notes: 2,
      activity: 1,
    });
  });
});
