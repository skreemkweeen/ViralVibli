import { describe, expect, it } from "vitest";
import { buildCampaign, CAMPAIGN_SHOTS } from "./campaign";
import { emptyDirection } from "./prompt";

describe("buildCampaign", () => {
  it("returns exactly six shots in the canonical order", () => {
    const shots = buildCampaign(emptyDirection);
    expect(shots).toHaveLength(6);
    expect(shots.map((s) => s.kind)).toEqual([
      "hero",
      "lifestyle",
      "macro",
      "packaging",
      "detail",
      "social",
    ]);
  });

  it("preserves the user's Hero direction verbatim", () => {
    const custom = { ...emptyDirection, subject: "ceramic mug", style: "editorial" as const };
    const shots = buildCampaign(custom);
    expect(shots[0].kind).toBe("hero");
    expect(shots[0].direction).toEqual(custom);
  });

  it("Lifestyle uses a 35mm lens and thirds composition", () => {
    const shots = buildCampaign(emptyDirection);
    const lifestyle = shots.find((s) => s.kind === "lifestyle")!;
    expect(lifestyle.direction.lens).toBe("35");
    expect(lifestyle.direction.composition).toBe("thirds");
  });

  it("Macro uses a 100mm lens and close-up composition", () => {
    const shots = buildCampaign(emptyDirection);
    const macro = shots.find((s) => s.kind === "macro")!;
    expect(macro.direction.lens).toBe("100");
    expect(macro.direction.composition).toBe("closeup");
  });

  it("Social returns a 1:1 square aspect", () => {
    const shots = buildCampaign(emptyDirection);
    const social = shots.find((s) => s.kind === "social")!;
    expect(social.direction.aspect).toBe("1-1");
  });

  it("preserves subject across every shot — the subject is invariant", () => {
    const withSubject = { ...emptyDirection, subject: "hand-thrown ceramic vessel" };
    const shots = buildCampaign(withSubject);
    for (const shot of shots) {
      expect(shot.direction.subject).toBe(withSubject.subject);
    }
  });

  it("static CAMPAIGN_SHOTS export matches the kind list", () => {
    expect(CAMPAIGN_SHOTS.map((s) => s.kind)).toEqual(
      buildCampaign(emptyDirection).map((s) => s.kind),
    );
  });
});
