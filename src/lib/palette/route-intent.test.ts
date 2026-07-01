import { describe, expect, it } from "vitest";
import { routeIntents } from "./route-intent";

describe("routeIntents", () => {
  it("returns [] for empty / too-short queries", () => {
    expect(routeIntents("")).toEqual([]);
    expect(routeIntents("  ")).toEqual([]);
    expect(routeIntents("hi")).toEqual([]);
  });

  it("routes 'generate a launch caption' to Story with subject 'launch'", () => {
    const intents = routeIntents("generate a launch caption");
    expect(intents.length).toBeGreaterThan(0);
    expect(intents[0].studio).toBe("story");
    expect(intents[0].subject).toContain("launch");
  });

  it("routes 'plan my posting week' to Story or the boost paths", () => {
    const intents = routeIntents("plan a week of stories for our launch");
    expect(intents[0]?.studio).toBe("story");
    // Verb + object + boost pushes confidence over the base
    expect(intents[0].confidence).toBeGreaterThan(0.75);
  });

  it("routes 'compose a hero product shot' to Vision", () => {
    const intents = routeIntents("compose a hero product shot for our ceramic mug");
    expect(intents[0].studio).toBe("vision");
    expect(intents[0].subject.toLowerCase()).toContain("ceramic mug");
  });

  it("routes 'save this prompt to the vault' to Vault", () => {
    const intents = routeIntents("save this prompt to the vault");
    expect(intents.some((i) => i.studio === "vault")).toBe(true);
  });

  it("returns no intent for a purely conversational query", () => {
    expect(routeIntents("what do you think of my newsletter?")).toEqual([]);
  });

  it("caps confidence at 1", () => {
    const intents = routeIntents(
      "generate a launch teaser story sequence for our ceramic mug reveal",
    );
    for (const intent of intents) {
      expect(intent.confidence).toBeLessThanOrEqual(1);
      expect(intent.confidence).toBeGreaterThan(0);
    }
  });

  it("dedupes multiple Story matches into a single top intent per studio", () => {
    const intents = routeIntents(
      "draft a launch caption story with hooks",
    );
    const storyIntents = intents.filter((i) => i.studio === "story");
    expect(storyIntents).toHaveLength(1);
  });

  it("preserves proper-noun casing in the extracted subject", () => {
    const intents = routeIntents("generate a caption for Marrow Bowl");
    expect(intents[0].subject).toContain("Marrow Bowl");
  });

  it("returns intents ordered by descending confidence", () => {
    const intents = routeIntents(
      "generate an editorial hero product shot campaign story",
    );
    for (let i = 0; i < intents.length - 1; i++) {
      expect(intents[i].confidence).toBeGreaterThanOrEqual(
        intents[i + 1].confidence,
      );
    }
  });

  it("caps output at 3 intents", () => {
    const intents = routeIntents(
      "generate a hero image and a launch story campaign and a caption prompt",
    );
    expect(intents.length).toBeLessThanOrEqual(3);
  });

  it("strips stop words and drops leading articles from the subject", () => {
    const intents = routeIntents("write a caption for my newsletter");
    const subject = intents[0].subject.toLowerCase();
    expect(subject).not.toMatch(/\ba\b/);
    expect(subject).not.toMatch(/\bfor\b/);
    expect(subject).not.toMatch(/\bmy\b/);
  });
});
