import { describe, expect, it } from "vitest";
import { emptySlide, type RichSlide } from "./story-slides";
import { inspectStory } from "./story-inspector";

function s(patch: Partial<RichSlide> & { id: string; index: number }): RichSlide {
  return { ...emptySlide(patch.id, patch.index), ...patch };
}

describe("inspectStory", () => {
  it("returns 15 dimensions and an overall score", () => {
    const rep = inspectStory([]);
    expect(rep.dimensions).toHaveLength(15);
    expect(rep.overall).toBeGreaterThanOrEqual(0);
    expect(rep.overall).toBeLessThanOrEqual(100);
  });

  it("hook rises with a 'you' / 'why' opener and short title", () => {
    const bare = inspectStory([s({ id: "a", index: 0, title: "product update" })]);
    const strong = inspectStory([
      s({ id: "a", index: 0, title: "Why nobody tells you this", goal: "hook" }),
    ]);
    const bareScore = bare.dimensions.find((d) => d.id === "hook")!.score;
    const strongScore = strong.dimensions.find((d) => d.id === "hook")!.score;
    expect(strongScore).toBeGreaterThan(bareScore);
  });

  it("cta penalises no CTA on the last slide", () => {
    const noCta = inspectStory([
      s({ id: "a", index: 0, goal: "hook" }),
      s({ id: "b", index: 1, goal: "context" }),
    ]);
    const withCta = inspectStory([
      s({ id: "a", index: 0, goal: "hook" }),
      s({ id: "b", index: 1, goal: "cta", cta: { label: "Shop now" } }),
    ]);
    expect(
      withCta.dimensions.find((d) => d.id === "cta")!.score,
    ).toBeGreaterThan(noCta.dimensions.find((d) => d.id === "cta")!.score);
  });

  it("pacing penalises long slides", () => {
    const long = inspectStory([
      s({
        id: "a",
        index: 0,
        body: Array(80).fill("word").join(" "),
      }),
    ]);
    const tight = inspectStory([s({ id: "a", index: 0, body: "short body" })]);
    expect(
      tight.dimensions.find((d) => d.id === "pacing")!.score,
    ).toBeGreaterThan(long.dimensions.find((d) => d.id === "pacing")!.score);
  });

  it("platform-fit penalises exceeding platform limits", () => {
    const heavy = Array(50).fill("word").join(" ");
    const ok = inspectStory([s({ id: "a", index: 0, body: heavy })], {
      platform: "lemon8",
    });
    const bad = inspectStory([s({ id: "a", index: 0, body: heavy })], {
      platform: "tiktok",
    });
    expect(
      ok.dimensions.find((d) => d.id === "platform-fit")!.score,
    ).toBeGreaterThan(
      bad.dimensions.find((d) => d.id === "platform-fit")!.score,
    );
  });

  it("brand-consistency scores against brand vocabulary", () => {
    const on = inspectStory(
      [s({ id: "a", index: 0, body: "quiet refined restraint marble editorial" })],
      { brandVocabulary: ["quiet", "restraint", "editorial", "loud", "shouty"] },
    );
    const off = inspectStory([s({ id: "a", index: 0, body: "unrelated copy" })], {
      brandVocabulary: ["quiet", "restraint", "editorial", "loud", "shouty"],
    });
    expect(
      on.dimensions.find((d) => d.id === "brand-consistency")!.score,
    ).toBeGreaterThan(
      off.dimensions.find((d) => d.id === "brand-consistency")!.score,
    );
  });

  it("accessibility penalises missing voiceover / visual", () => {
    const missing = inspectStory([s({ id: "a", index: 0 })]);
    const rich = inspectStory([
      s({
        id: "a",
        index: 0,
        voiceover: "spoken script",
        visual: "hand-thrown mug",
      }),
    ]);
    expect(
      rich.dimensions.find((d) => d.id === "accessibility")!.score,
    ).toBeGreaterThan(
      missing.dimensions.find((d) => d.id === "accessibility")!.score,
    );
  });

  it("flow rewards hook opener + cta closer + goal variety", () => {
    const flat = inspectStory([
      s({ id: "a", index: 0, goal: "context" }),
      s({ id: "b", index: 1, goal: "context" }),
    ]);
    const structured = inspectStory([
      s({ id: "a", index: 0, goal: "hook" }),
      s({ id: "b", index: 1, goal: "teach" }),
      s({ id: "c", index: 2, goal: "cta" }),
    ]);
    expect(
      structured.dimensions.find((d) => d.id === "flow")!.score,
    ).toBeGreaterThan(flat.dimensions.find((d) => d.id === "flow")!.score);
  });

  it("supplies a recommendation on every dimension", () => {
    const rep = inspectStory([s({ id: "a", index: 0 })]);
    for (const d of rep.dimensions) expect(d.recommendation).toBeTruthy();
  });
});
