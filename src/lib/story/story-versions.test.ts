import { describe, expect, it } from "vitest";
import { emptySlide } from "./story-slides";
import {
  branchStoryFrom,
  commentOnStorySnapshot,
  commitStorySnapshot,
  compareStorySnapshots,
  duplicateStorySnapshot,
  emptyStoryTree,
  findStorySnapshot,
  labelStorySnapshot,
  mergeStorySnapshots,
  removeStoryComment,
  restoreStorySnapshot,
  setStoryApproval,
  storyBranchTips,
  storyHead,
  storyLineage,
} from "./story-versions";

const slidesA = [
  { ...emptySlide("s1", 0), title: "A", body: "body a" },
  { ...emptySlide("s2", 1), title: "B", body: "body b" },
];
const slidesB = [
  { ...emptySlide("s1", 0), title: "A (edited)", body: "body a2" },
  { ...emptySlide("s3", 1), title: "C", body: "body c" },
];

describe("story tree", () => {
  it("commits and chains parents", () => {
    let tree = emptyStoryTree();
    tree = commitStorySnapshot(tree, { id: "v1", slides: slidesA, label: "Take 1" });
    tree = commitStorySnapshot(tree, { id: "v2", slides: slidesB, label: "Take 2" });
    expect(tree.headId).toBe("v2");
    expect(storyHead(tree)?.parentId).toBe("v1");
    expect(storyLineage(tree, "v2").map((s) => s.id)).toEqual(["v2", "v1"]);
  });

  it("branchStoryFrom marks a branch tip", () => {
    let tree = emptyStoryTree();
    tree = commitStorySnapshot(tree, { id: "v1", slides: slidesA });
    tree = branchStoryFrom(tree, "v1", {
      id: "b1",
      branchId: "alt-tone",
      slides: slidesB,
    });
    expect(storyBranchTips(tree).map((t) => t.branchId)).toContain("alt-tone");
    expect(findStorySnapshot(tree, "b1")?.parentId).toBe("v1");
  });

  it("restoreStorySnapshot moves HEAD", () => {
    let tree = emptyStoryTree();
    tree = commitStorySnapshot(tree, { id: "v1", slides: slidesA });
    tree = commitStorySnapshot(tree, { id: "v2", slides: slidesB });
    const rewound = restoreStorySnapshot(tree, "v1");
    expect(rewound.headId).toBe("v1");
  });

  it("compareStorySnapshots emits per-slide diffs", () => {
    const a = { id: "a", slides: slidesA, createdAt: 1, comments: [] };
    const b = { id: "b", slides: slidesB, createdAt: 2, comments: [] };
    const { slideDiffs } = compareStorySnapshots(a, b);
    const kinds = new Set(slideDiffs.map((d) => d.kind));
    expect(kinds.has("changed")).toBe(true); // s1 changed
    expect(kinds.has("added")).toBe(true); // s3 added
    expect(kinds.has("removed")).toBe(true); // s2 removed
  });

  it("duplicateStorySnapshot clones without branch tag", () => {
    let tree = emptyStoryTree();
    tree = commitStorySnapshot(tree, { id: "v1", slides: slidesA });
    tree = branchStoryFrom(tree, "v1", { id: "b1", branchId: "alt", slides: slidesB });
    tree = duplicateStorySnapshot(tree, "b1", "c1", 5000);
    const copy = findStorySnapshot(tree, "c1");
    expect(copy?.branchId).toBeUndefined();
    expect(copy?.parentId).toBe("b1");
  });

  it("mergeStorySnapshots records lineage with the taker's slides", () => {
    let tree = emptyStoryTree();
    tree = commitStorySnapshot(tree, { id: "main", slides: slidesA });
    tree = commitStorySnapshot(tree, { id: "feature", slides: slidesB });
    tree = mergeStorySnapshots(tree, "main", "feature", "merge-1", 8000);
    const m = findStorySnapshot(tree, "merge-1");
    expect(m?.parentId).toBe("main");
    expect(m?.slides.length).toBe(slidesB.length);
  });

  it("labelStorySnapshot and comments", () => {
    let tree = emptyStoryTree();
    tree = commitStorySnapshot(tree, { id: "v1", slides: slidesA });
    tree = labelStorySnapshot(tree, "v1", "Golden take");
    expect(findStorySnapshot(tree, "v1")?.label).toBe("Golden take");
    tree = commentOnStorySnapshot(tree, "v1", { id: "c1", body: "love this", createdAt: 1 });
    expect(findStorySnapshot(tree, "v1")?.comments).toHaveLength(1);
    tree = removeStoryComment(tree, "v1", "c1");
    expect(findStorySnapshot(tree, "v1")?.comments).toHaveLength(0);
  });

  it("setStoryApproval flips the approval flag", () => {
    let tree = emptyStoryTree();
    tree = commitStorySnapshot(tree, { id: "v1", slides: slidesA });
    tree = setStoryApproval(tree, "v1", "approved");
    expect(findStorySnapshot(tree, "v1")?.approval).toBe("approved");
  });
});
