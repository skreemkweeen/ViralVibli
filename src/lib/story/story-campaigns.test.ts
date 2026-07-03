import { describe, expect, it } from "vitest";
import {
  buildCampaign,
  CAMPAIGN_TEMPLATES,
  campaignTemplate,
  findSequence,
  storyIdsFor,
  totalStories,
} from "./story-campaigns";

describe("CAMPAIGN_TEMPLATES", () => {
  it("has 14 templates", () => {
    expect(CAMPAIGN_TEMPLATES).toHaveLength(14);
  });

  it("every template has at least one sequence with a story", () => {
    for (const t of CAMPAIGN_TEMPLATES) {
      expect(t.sequences.length).toBeGreaterThan(0);
      for (const s of t.sequences) {
        expect(s.stories.length).toBeGreaterThan(0);
        for (const st of s.stories) {
          expect(st.slides).toBeGreaterThan(0);
        }
      }
    }
  });

  it("campaignTemplate looks up by id", () => {
    expect(campaignTemplate("product-launch")?.name).toBe("Product launch");
    expect(campaignTemplate("nope")).toBeUndefined();
  });
});

describe("buildCampaign", () => {
  it("throws on unknown template", () => {
    expect(() =>
      buildCampaign({ campaignId: "c1", templateId: "nope" }),
    ).toThrow(/Unknown template/);
  });

  it("materialises campaign + stories with slides", () => {
    const { campaign, stories } = buildCampaign({
      campaignId: "camp-1",
      templateId: "product-launch",
      now: 1000,
    });
    expect(campaign.id).toBe("camp-1");
    expect(campaign.templateId).toBe("product-launch");
    expect(campaign.sequences.length).toBe(3);
    expect(stories.length).toBe(3);
    for (const st of stories) {
      expect(st.slides.length).toBeGreaterThan(0);
    }
  });

  it("stamps hook goal on the first slide and cta on the last", () => {
    const { stories } = buildCampaign({
      campaignId: "camp-2",
      templateId: "sale",
    });
    const first = stories[0];
    expect(first?.slides[0]?.goal).toBe("hook");
    expect(first?.slides[first.slides.length - 1]?.goal).toBe("cta");
  });

  it("storyIdsFor lists every story", () => {
    const { campaign } = buildCampaign({
      campaignId: "c",
      templateId: "sample" in {} ? "sample" : "sale",
    });
    expect(storyIdsFor(campaign).length).toBe(totalStories(campaign));
    expect(totalStories(campaign)).toBeGreaterThan(0);
  });

  it("findSequence locates a sequence by story id", () => {
    const { campaign } = buildCampaign({
      campaignId: "c",
      templateId: "product-launch",
    });
    const firstStoryId = campaign.sequences[0]!.storyIds[0]!;
    const seq = findSequence(campaign, firstStoryId);
    expect(seq?.label).toBe("Teaser");
  });
});
