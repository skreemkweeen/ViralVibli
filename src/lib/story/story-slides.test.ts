import { describe, expect, it } from "vitest";
import {
  addSlideComment,
  approvalCounts,
  duplicateSlide,
  emptySlide,
  fromLegacySlide,
  groupSlides,
  insertSlide,
  mergeSlides,
  moveSlide,
  removeSlide,
  removeSlideComment,
  restoreSlideVersion,
  snapshotSlideVersion,
  splitSlide,
  statusCounts,
  totalDurationSeconds,
  ungroupSlides,
  updateSlideFields,
} from "./story-slides";

const s = (id: string, index: number, patch: Partial<ReturnType<typeof emptySlide>> = {}) => ({
  ...emptySlide(id, index, 1000),
  ...patch,
});

describe("emptySlide", () => {
  it("initialises safe defaults", () => {
    const slide = emptySlide("s1", 0, 1);
    expect(slide.id).toBe("s1");
    expect(slide.duration).toBe(5);
    expect(slide.transition).toBe("cut");
    expect(slide.animation).toBe("none");
    expect(slide.status).toBe("draft");
    expect(slide.approval).toBe("draft");
    expect(slide.color).toBe("none");
    expect(slide.comments).toEqual([]);
    expect(slide.history).toEqual([]);
  });
});

describe("fromLegacySlide", () => {
  it("carries copy / visual suggestion / speaker notes / cta over", () => {
    const slide = fromLegacySlide(
      {
        slide: 1,
        copy: "Bold hook\nrest of body",
        visualSuggestion: "mug on stone",
        speakerNotes: "Say this softly",
        cta: "Shop the collection",
      },
      "s1",
      0,
    );
    expect(slide.title).toBe("Bold hook");
    expect(slide.body).toContain("Bold hook");
    expect(slide.voiceover).toBe("Say this softly");
    expect(slide.visual).toBe("mug on stone");
    expect(slide.cta?.label).toBe("Shop the collection");
    expect(slide.goal).toBe("hook");
  });
});

describe("updateSlideFields", () => {
  it("patches fields and bumps updatedAt", () => {
    const before = s("s1", 0);
    const after = updateSlideFields(before, { title: "Bold hook", duration: 8 }, 2000);
    expect(after.title).toBe("Bold hook");
    expect(after.duration).toBe(8);
    expect(after.updatedAt).toBe(2000);
  });
});

describe("versions", () => {
  it("snapshots title + body + cta and restores", () => {
    let slide = s("s1", 0, { title: "First", body: "First body" });
    slide = snapshotSlideVersion(slide, "v1", "First take", undefined, 2000);
    slide = updateSlideFields(slide, { title: "Second", body: "Second body" });
    expect(slide.title).toBe("Second");
    slide = restoreSlideVersion(slide, "v1");
    expect(slide.title).toBe("First");
    expect(slide.body).toBe("First body");
  });

  it("caps history at 20", () => {
    let slide = s("s1", 0, { title: "t" });
    for (let i = 0; i < 30; i++) {
      slide = snapshotSlideVersion(slide, `v${i}`, `Take ${i}`, undefined, 1000 + i);
    }
    expect(slide.history).toHaveLength(20);
  });
});

describe("comments", () => {
  it("adds and removes", () => {
    let slide = s("s1", 0);
    slide = addSlideComment(slide, { id: "c1", body: "Tight hook", createdAt: 5 });
    expect(slide.comments).toHaveLength(1);
    slide = removeSlideComment(slide, "c1");
    expect(slide.comments).toHaveLength(0);
  });
});

describe("list operations", () => {
  const list = [s("a", 0, { title: "A" }), s("b", 1, { title: "B" }), s("c", 2, { title: "C" })];

  it("insertSlide re-indexes", () => {
    const inserted = insertSlide(list, 1, s("x", 99, { title: "X" }));
    expect(inserted.map((r) => r.id)).toEqual(["a", "x", "b", "c"]);
    expect(inserted.map((r) => r.index)).toEqual([0, 1, 2, 3]);
  });

  it("removeSlide re-indexes", () => {
    const removed = removeSlide(list, "b");
    expect(removed.map((r) => r.id)).toEqual(["a", "c"]);
    expect(removed.map((r) => r.index)).toEqual([0, 1]);
  });

  it("moveSlide re-orders", () => {
    const moved = moveSlide(list, 0, 2);
    expect(moved.map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  it("duplicateSlide inserts after source", () => {
    const dup = duplicateSlide(list, "b", "b-copy", 3000);
    expect(dup.map((r) => r.id)).toEqual(["a", "b", "b-copy", "c"]);
    expect(dup[2]!.createdAt).toBe(3000);
  });

  it("splitSlide cuts body and inserts a continuation", () => {
    const source = [
      s("a", 0, { title: "A", body: "first part second part" }),
    ];
    const split = splitSlide(source, "a", "a2", 11);
    expect(split).toHaveLength(2);
    expect(split[0]!.body).toBe("first part");
    expect(split[1]!.body).toBe("second part");
  });

  it("mergeSlides combines two consecutive slides", () => {
    const source = [
      s("a", 0, { body: "A body", duration: 5 }),
      s("b", 1, { body: "B body", duration: 3 }),
      s("c", 2, { body: "C body", duration: 4 }),
    ];
    const merged = mergeSlides(source, "a", "b");
    expect(merged).toHaveLength(2);
    expect(merged[0]!.body).toBe("A body\n\nB body");
    expect(merged[0]!.duration).toBe(8);
  });

  it("groupSlides + ungroupSlides tags and untags", () => {
    const grouped = groupSlides(list, ["a", "b"], "intro");
    expect(grouped.filter((s) => s.group === "intro")).toHaveLength(2);
    const ungrouped = ungroupSlides(grouped, "intro");
    expect(ungrouped.every((s) => s.group === undefined)).toBe(true);
  });
});

describe("aggregate helpers", () => {
  it("totalDurationSeconds sums", () => {
    const list = [s("a", 0, { duration: 5 }), s("b", 1, { duration: 3 })];
    expect(totalDurationSeconds(list)).toBe(8);
  });

  it("statusCounts + approvalCounts", () => {
    const list = [
      s("a", 0, { status: "ready", approval: "approved" }),
      s("b", 1, { status: "ready" }),
      s("c", 2, { status: "shot", approval: "in-review" }),
    ];
    const sc = statusCounts(list);
    expect(sc.ready).toBe(2);
    expect(sc.shot).toBe(1);
    const ac = approvalCounts(list);
    expect(ac.approved).toBe(1);
    expect(ac["in-review"]).toBe(1);
  });
});
