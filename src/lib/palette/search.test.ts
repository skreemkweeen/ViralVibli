import { describe, expect, it } from "vitest";
import { groupHits, score, search } from "./search";

describe("score", () => {
  it("returns 0 for empty inputs", () => {
    expect(score("", "hello")).toBe(0);
    expect(score("hello", "")).toBe(0);
  });

  it("gives max score for exact match", () => {
    expect(score("hello", "hello")).toBe(100);
  });

  it("gives strong score for prefix match", () => {
    expect(score("hello world", "hello")).toBe(80);
  });

  it("gives whole-word match score when all tokens hit as words", () => {
    expect(score("Aesop shop window", "shop window")).toBe(60);
  });

  it("falls back to substring match", () => {
    expect(score("A brand new hero shot", "hero")).toBeGreaterThan(0);
  });

  it("falls back to subsequence match at the lowest score", () => {
    const s = score("Portrait of a Marrow Bowl", "prtrmb");
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(45);
  });

  it("returns 0 when the query letters don't appear in order", () => {
    expect(score("apple", "zzz")).toBe(0);
  });
});

describe("search", () => {
  it("returns [] for empty / 1-char queries", () => {
    expect(search("", { projects: [{ id: "p", name: "hello" }] })).toEqual([]);
    expect(search("a", { projects: [{ id: "p", name: "apple" }] })).toEqual([]);
  });

  it("hits across sources and sorts by descending score", () => {
    const hits = search("hero", {
      projects: [{ id: "p1", name: "Hero launch project" }],
      prompts: [
        { id: "pr1", title: "Product hero shot", content: "hero prompt" },
      ],
      concepts: [{ id: "c1", brief: "hero product macro" }],
      activity: [{ id: "a1", title: "Generated hero shot" }],
    });
    expect(hits.length).toBeGreaterThan(0);
    for (let i = 1; i < hits.length; i++) {
      expect(hits[i - 1].score).toBeGreaterThanOrEqual(hits[i].score);
    }
  });

  it("prefers project hits with an equal base score", () => {
    const hits = search("launch", {
      projects: [{ id: "p1", name: "launch" }],
      activity: [{ id: "a1", title: "launch" }],
    });
    expect(hits[0].kind).toBe("project");
  });

  it("caps hits per kind to `limit`", () => {
    const prompts = Array.from({ length: 20 }, (_, i) => ({
      id: `p-${i}`,
      title: `hero shot ${i}`,
      content: "",
    }));
    const hits = search("hero", { prompts }, 3);
    expect(hits.filter((h) => h.kind === "prompt")).toHaveLength(3);
  });

  it("returns nothing when nothing matches", () => {
    expect(
      search("nonexistent", {
        prompts: [{ id: "pr", title: "unrelated", content: "" }],
      }),
    ).toEqual([]);
  });

  it("groupHits splits by kind while preserving order", () => {
    const hits = search("shot", {
      projects: [{ id: "p", name: "Hero shot roll" }],
      prompts: [{ id: "pr", title: "hero shot prompt", content: "shot" }],
    });
    const grouped = groupHits(hits);
    expect(Object.keys(grouped).sort()).toEqual(["project", "prompt"].sort());
    expect(grouped.project[0].kind).toBe("project");
  });
});
