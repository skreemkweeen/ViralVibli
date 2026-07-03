import { describe, expect, it } from "vitest";
import { emptyDirection } from "./prompt";
import {
  branchFrom,
  branchTips,
  commentOnSnapshot,
  commitSnapshot,
  compareSnapshots,
  duplicateSnapshot,
  emptyTree,
  findSnapshot,
  head,
  labelSnapshot,
  lineage,
  mergeSnapshots,
  removeComment,
  restore,
} from "./prompt-versions";

describe("commitSnapshot", () => {
  it("appends a snapshot and moves HEAD", () => {
    const t0 = emptyTree();
    const t1 = commitSnapshot(t0, {
      id: "s1",
      prompt: "p1",
      direction: emptyDirection,
      now: 1000,
    });
    expect(t1.snapshots).toHaveLength(1);
    expect(t1.headId).toBe("s1");
    expect(head(t1)?.parentId).toBeUndefined();
  });

  it("chains parents through consecutive commits", () => {
    let tree = emptyTree();
    tree = commitSnapshot(tree, {
      id: "s1",
      prompt: "p1",
      direction: emptyDirection,
    });
    tree = commitSnapshot(tree, {
      id: "s2",
      prompt: "p2",
      direction: emptyDirection,
    });
    expect(head(tree)?.parentId).toBe("s1");
    const chain = lineage(tree, "s2").map((s) => s.id);
    expect(chain).toEqual(["s2", "s1"]);
  });
});

describe("branch + restore", () => {
  it("branchFrom seeds a new tip with the parent's id", () => {
    let tree = emptyTree();
    tree = commitSnapshot(tree, {
      id: "s1",
      prompt: "p1",
      direction: emptyDirection,
    });
    tree = branchFrom(tree, "s1", {
      id: "b1",
      branchId: "wide-open",
      prompt: "p wide",
      direction: { ...emptyDirection, aperture: "1.4" },
    });
    expect(tree.headId).toBe("b1");
    expect(findSnapshot(tree, "b1")?.parentId).toBe("s1");
    expect(branchTips(tree).map((b) => b.branchId)).toContain("wide-open");
  });

  it("restore rewinds HEAD to an earlier snapshot", () => {
    let tree = emptyTree();
    tree = commitSnapshot(tree, { id: "s1", prompt: "p1", direction: emptyDirection });
    tree = commitSnapshot(tree, { id: "s2", prompt: "p2", direction: emptyDirection });
    const rewound = restore(tree, "s1");
    expect(rewound.headId).toBe("s1");
  });

  it("restore no-ops when the id is unknown", () => {
    const tree = commitSnapshot(emptyTree(), {
      id: "s1",
      prompt: "p1",
      direction: emptyDirection,
    });
    expect(restore(tree, "nope").headId).toBe("s1");
  });
});

describe("compareSnapshots", () => {
  it("detects field diffs", () => {
    const a = { ...emptyDirection, aperture: "2.8" };
    const b = { ...emptyDirection, aperture: "1.4", mood: "bold" };
    const cmp = compareSnapshots(
      {
        id: "a",
        prompt: "same",
        direction: a,
        createdAt: 1,
        comments: [],
      },
      {
        id: "b",
        prompt: "different",
        direction: b,
        createdAt: 2,
        comments: [],
      },
    );
    expect(cmp.promptChanged).toBe(true);
    const fields = new Set(cmp.fieldDiffs.map((d) => d.field));
    expect(fields.has("aperture")).toBe(true);
    expect(fields.has("mood")).toBe(true);
  });
});

describe("duplicate + merge", () => {
  it("duplicate copies content with a new id and clears the branch tag", () => {
    let tree = emptyTree();
    tree = commitSnapshot(tree, {
      id: "s1",
      prompt: "p",
      direction: emptyDirection,
      label: "Take 1",
    });
    tree = branchFrom(tree, "s1", {
      id: "b1",
      branchId: "moody",
      prompt: "p moody",
      direction: emptyDirection,
    });
    tree = duplicateSnapshot(tree, "b1", "c1", 2000);
    const copy = findSnapshot(tree, "c1");
    expect(copy?.parentId).toBe("b1");
    expect(copy?.branchId).toBeUndefined();
  });

  it("merge records lineage and takes the winning content", () => {
    let tree = emptyTree();
    tree = commitSnapshot(tree, {
      id: "main",
      prompt: "main",
      direction: emptyDirection,
    });
    tree = commitSnapshot(tree, {
      id: "feature",
      prompt: "feature-prompt",
      direction: { ...emptyDirection, mood: "bold" },
    });
    const merged = mergeSnapshots(tree, "main", "feature", "merge-1", 3000);
    const m = findSnapshot(merged, "merge-1");
    expect(m?.parentId).toBe("main");
    expect(m?.prompt).toBe("feature-prompt");
    expect(m?.direction.mood).toBe("bold");
  });
});

describe("labels + comments", () => {
  it("labels a snapshot", () => {
    let tree = emptyTree();
    tree = commitSnapshot(tree, {
      id: "s1",
      prompt: "p",
      direction: emptyDirection,
    });
    tree = labelSnapshot(tree, "s1", "Approved take");
    expect(findSnapshot(tree, "s1")?.label).toBe("Approved take");
  });

  it("adds and removes comments", () => {
    let tree = emptyTree();
    tree = commitSnapshot(tree, {
      id: "s1",
      prompt: "p",
      direction: emptyDirection,
    });
    tree = commentOnSnapshot(tree, "s1", {
      id: "c1",
      body: "Tighter crop plz",
      createdAt: 1,
    });
    expect(findSnapshot(tree, "s1")?.comments).toHaveLength(1);
    tree = removeComment(tree, "s1", "c1");
    expect(findSnapshot(tree, "s1")?.comments).toHaveLength(0);
  });
});
