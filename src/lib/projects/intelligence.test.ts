import { describe, expect, it } from "vitest";
import { computeProjectHealth } from "./intelligence";
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

const NOW = 100_000_000;

describe("computeProjectHealth", () => {
  it("returns 0 completion for an empty project", () => {
    const h = computeProjectHealth(seedProject(), {}, NOW);
    expect(h.completion).toBe(0);
    expect(h.score).toBeLessThan(50);
    expect(h.missing.length).toBeGreaterThan(0);
    expect(h.nextStep.length).toBeGreaterThan(0);
  });

  it("reaches 100% completion when the baseline is met", () => {
    const h = computeProjectHealth(
      seedProject({
        notes: [{ id: "n1", body: "voice", createdAt: NOW }],
      }),
      {
        stories: [{ id: "s1", title: "s", projectId: "p1", createdAt: NOW - 1000 }],
        images: [
          { id: "i1", title: "i", projectId: "p1", createdAt: NOW - 1000 },
          { id: "i2", title: "j", projectId: "p1", createdAt: NOW - 1000 },
          { id: "i3", title: "k", projectId: "p1", createdAt: NOW - 1000 },
        ],
        prompts: [
          { id: "p1p", title: "a", content: "", projectId: "p1" },
          { id: "p2p", title: "b", content: "", projectId: "p1" },
          { id: "p3p", title: "c", content: "", projectId: "p1" },
        ],
        moodboard: [
          { id: "m1", title: "r", projectId: "p1" },
          { id: "m2", title: "s", projectId: "p1" },
        ],
      },
      NOW,
    );
    expect(h.completion).toBe(100);
    expect(h.missing).toEqual([]);
    expect(h.nextStep).toMatch(/[Ss]hip/);
  });

  it("scopes strictly to projectId when any items are tagged", () => {
    const h = computeProjectHealth(
      seedProject(),
      {
        stories: [
          { id: "own", title: "own", projectId: "p1" },
          { id: "other", title: "other", projectId: "p2" },
        ],
      },
      NOW,
    );
    // Only one story counted (own), so still missing images/prompts/etc.
    expect(h.missing.find((m) => m.kind === "story")).toBeUndefined();
    expect(h.missing.find((m) => m.kind === "image")?.count).toBe(3);
  });

  it("computes an 'up' momentum when this week beats last week", () => {
    const h = computeProjectHealth(seedProject(), {
      activity: [
        { id: "a1", title: "recent", createdAt: NOW - 1 * 86_400_000, projectId: "p1" },
        { id: "a2", title: "recent", createdAt: NOW - 2 * 86_400_000, projectId: "p1" },
        { id: "a3", title: "recent", createdAt: NOW - 3 * 86_400_000, projectId: "p1" },
        { id: "a4", title: "prior", createdAt: NOW - 10 * 86_400_000, projectId: "p1" },
      ],
    }, NOW);
    expect(h.momentum.recent).toBe(3);
    expect(h.momentum.prior).toBe(1);
    expect(h.momentum.trend).toBe("up");
  });

  it("computes a 'down' momentum when this week trails last week", () => {
    const h = computeProjectHealth(seedProject(), {
      activity: [
        { id: "r1", title: "r", createdAt: NOW - 2 * 86_400_000, projectId: "p1" },
        { id: "p1", title: "p", createdAt: NOW - 9 * 86_400_000, projectId: "p1" },
        { id: "p2", title: "p", createdAt: NOW - 10 * 86_400_000, projectId: "p1" },
        { id: "p3", title: "p", createdAt: NOW - 11 * 86_400_000, projectId: "p1" },
      ],
    }, NOW);
    expect(h.momentum.trend).toBe("down");
  });

  it("detects prompt duplicates by token overlap", () => {
    const h = computeProjectHealth(seedProject(), {
      prompts: [
        {
          id: "p1",
          title: "hero product mug shot",
          content: "editorial hero product shot for a matte ceramic mug",
          projectId: "p1",
        },
        {
          id: "p2",
          title: "hero product shot",
          content: "editorial hero shot for a matte ceramic mug product",
          projectId: "p1",
        },
      ],
    }, NOW);
    expect(h.duplicates.length).toBe(1);
    expect(h.duplicates[0].overlap).toBeGreaterThan(0.65);
    expect(h.recommendations.some((r) => r.id === "duplicates")).toBe(true);
  });

  it("flags reuse opportunities when overlap is moderate", () => {
    const h = computeProjectHealth(seedProject(), {
      prompts: [
        {
          id: "p1",
          title: "morning cleanse ritual",
          content: "gentle warm light hero shot",
          projectId: "p1",
        },
        {
          id: "p2",
          title: "evening layered ritual",
          content: "gentle warm light overhead shot",
          projectId: "p1",
        },
      ],
    }, NOW);
    expect(h.reuse.length + h.duplicates.length).toBeGreaterThan(0);
  });

  it("marks a prompt with zero usage as unused when nothing references it", () => {
    const h = computeProjectHealth(seedProject(), {
      prompts: [
        {
          id: "p-orphan",
          title: "orphan concept idea",
          content: "totally unrelated content",
          projectId: "p1",
          usageCount: 0,
        },
      ],
    }, NOW);
    expect(h.unused.prompts.length).toBe(1);
  });

  it("does not mark a prompt as unused when its title tokens appear in a story", () => {
    const h = computeProjectHealth(seedProject(), {
      prompts: [
        { id: "p", title: "editorial hero shot", projectId: "p1", usageCount: 0 },
      ],
      stories: [
        { id: "s", brief: "editorial hero shot campaign", projectId: "p1" },
      ],
    }, NOW);
    expect(h.unused.prompts.length).toBe(0);
  });

  it("caps recommendations at 5", () => {
    const h = computeProjectHealth(seedProject(), {}, NOW);
    expect(h.recommendations.length).toBeLessThanOrEqual(5);
  });

  it("returns a distinct next step at each maturity level", () => {
    const empty = computeProjectHealth(seedProject(), {}, NOW).nextStep;
    const withMoodboard = computeProjectHealth(
      seedProject(),
      { moodboard: [{ id: "m", title: "r", projectId: "p1" }] },
      NOW,
    ).nextStep;
    expect(empty).not.toBe(withMoodboard);
  });

  it("dependencies link moodboard tokens to images that share them", () => {
    const h = computeProjectHealth(seedProject(), {
      moodboard: [
        { id: "m", title: "warm brass window", note: "editorial warmth", projectId: "p1" },
      ],
      images: [
        { id: "i", title: "warm brass mug", brief: "warm brass ceramic mug editorial", projectId: "p1" },
      ],
    }, NOW);
    expect(h.dependencies.length).toBeGreaterThan(0);
    expect(h.dependencies[0].from.kind).toBe("moodboard");
    expect(h.dependencies[0].to.kind).toBe("image");
  });

  it("score stays within 0..100", () => {
    const h = computeProjectHealth(seedProject(), {
      activity: Array.from({ length: 50 }, (_, i) => ({
        id: `a${i}`,
        title: `t${i}`,
        createdAt: NOW - i * 3600_000,
        projectId: "p1",
      })),
    }, NOW);
    expect(h.score).toBeGreaterThanOrEqual(0);
    expect(h.score).toBeLessThanOrEqual(100);
  });
});
