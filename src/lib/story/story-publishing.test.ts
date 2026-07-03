import { describe, expect, it } from "vitest";
import {
  addPublishItem,
  queueForStatus,
  queueForStory,
  removePublishItem,
  setPublishStatus,
  statusSummary,
  updatePublishItem,
  upcomingWithin,
} from "./story-publishing";

describe("publishing queue", () => {
  it("adds a draft when no scheduledAt is given", () => {
    const q = addPublishItem([], {
      id: "p1",
      storyId: "s1",
      platform: "instagram",
    });
    expect(q).toHaveLength(1);
    expect(q[0]!.status).toBe("draft");
  });

  it("adds a scheduled item when a time is given", () => {
    const q = addPublishItem([], {
      id: "p1",
      storyId: "s1",
      platform: "instagram",
      scheduledAt: 1000,
    });
    expect(q[0]!.status).toBe("scheduled");
  });

  it("update / remove behave", () => {
    let q = addPublishItem([], { id: "p1", storyId: "s1", platform: "tiktok" });
    q = updatePublishItem(q, "p1", { note: "hello" });
    expect(q[0]!.note).toBe("hello");
    q = removePublishItem(q, "p1");
    expect(q).toHaveLength(0);
  });

  it("setPublishStatus published stamps publishedAt", () => {
    let q = addPublishItem([], { id: "p1", storyId: "s1", platform: "instagram" });
    q = setPublishStatus(q, "p1", "published", { publishedUrl: "https://example.com" });
    expect(q[0]!.status).toBe("published");
    expect(q[0]!.publishedAt).toBeDefined();
    expect(q[0]!.publishedUrl).toBe("https://example.com");
  });

  it("queueForStory / queueForStatus filter", () => {
    let q = addPublishItem([], { id: "p1", storyId: "s1", platform: "instagram" });
    q = addPublishItem(q, { id: "p2", storyId: "s2", platform: "tiktok" });
    q = setPublishStatus(q, "p1", "queued");
    expect(queueForStory(q, "s1")).toHaveLength(1);
    expect(queueForStatus(q, "queued")).toHaveLength(1);
  });

  it("statusSummary counts by status", () => {
    let q = addPublishItem([], { id: "p1", storyId: "s1", platform: "instagram" });
    q = addPublishItem(q, { id: "p2", storyId: "s2", platform: "tiktok" });
    q = setPublishStatus(q, "p1", "queued");
    q = setPublishStatus(q, "p2", "published", { publishedUrl: "u" });
    const s = statusSummary(q);
    expect(s.queued).toBe(1);
    expect(s.published).toBe(1);
  });

  it("upcomingWithin returns sorted future scheduled/queued", () => {
    const now = 1000;
    let q = addPublishItem([], {
      id: "p1",
      storyId: "s1",
      platform: "instagram",
      scheduledAt: now + 5000,
    });
    q = addPublishItem(q, {
      id: "p2",
      storyId: "s2",
      platform: "instagram",
      scheduledAt: now + 2000,
    });
    q = addPublishItem(q, {
      id: "p3",
      storyId: "s3",
      platform: "instagram",
      scheduledAt: now - 5000,
    });
    const up = upcomingWithin(q, 10_000, now);
    expect(up.map((i) => i.id)).toEqual(["p2", "p1"]);
  });
});
