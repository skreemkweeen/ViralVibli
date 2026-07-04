import { describe, expect, it } from "vitest";
import { localStoryProvider } from "./story";
import type { StoryRequest } from "../../types";

const baseRequest: StoryRequest = {
  brief: "Launch a new artisan ceramic mug collection",
  framework: "aida",
  platform: "instagram",
  count: 4,
};

describe("localStoryProvider", () => {
  it("declares a stable provider id so registries can select it", () => {
    expect(localStoryProvider.id).toBe("local-story");
  });

  it("returns a StoryResult with the requested slide count", async () => {
    const result = await localStoryProvider.generate(baseRequest, new AbortController().signal);
    expect(result.slides).toHaveLength(4);
    expect(result.slides[0].slide).toBe(1);
    expect(result.provider).toBe("local-story");
  });

  it("numbers slides monotonically", async () => {
    const result = await localStoryProvider.generate(
      { ...baseRequest, count: 3 },
      new AbortController().signal,
    );
    const numbers = result.slides.map((s) => s.slide);
    expect(numbers).toEqual([1, 2, 3]);
  });

  it("respects framework selection when supported", async () => {
    const result = await localStoryProvider.generate(
      { ...baseRequest, framework: "pas" },
      new AbortController().signal,
    );
    expect(result.slides.length).toBeGreaterThan(0);
    expect(result.slides[0].copy).toBeTruthy();
  });
});
