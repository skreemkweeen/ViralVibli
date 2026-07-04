/**
 * Story version tree — Git-like snapshot history for a whole story
 * (deck-level). Complements per-slide version history: this one lets
 * a creator commit a full-story snapshot, branch alternate treatments,
 * merge, compare, restore, and comment.
 *
 * Reuses the same shape as Vision Studio's prompt-versions so consumers
 * feel familiar.
 */

import type { RichSlide } from "./story-slides";

export type StorySnapshotId = string;

export type StoryComment = {
  id: string;
  author?: string;
  body: string;
  createdAt: number;
};

export type StorySnapshot = {
  id: StorySnapshotId;
  parentId?: StorySnapshotId;
  branchId?: string;
  label?: string;
  message?: string;
  slides: RichSlide[];
  createdAt: number;
  comments: StoryComment[];
  approval?: "draft" | "in-review" | "approved" | "rejected";
};

export type StoryTree = {
  snapshots: StorySnapshot[];
  headId: StorySnapshotId | null;
};

// ─── Factories ────────────────────────────────────────────────────────────

export const emptyStoryTree = (): StoryTree => ({ snapshots: [], headId: null });

export function commitStorySnapshot(
  tree: StoryTree,
  input: {
    id: StorySnapshotId;
    slides: RichSlide[];
    label?: string;
    message?: string;
    branchId?: string;
    now?: number;
  },
): StoryTree {
  const snapshot: StorySnapshot = {
    id: input.id,
    parentId: tree.headId ?? undefined,
    branchId: input.branchId,
    label: input.label,
    message: input.message,
    slides: input.slides,
    createdAt: input.now ?? Date.now(),
    comments: [],
    approval: "draft",
  };
  return { snapshots: [snapshot, ...tree.snapshots], headId: snapshot.id };
}

export function branchStoryFrom(
  tree: StoryTree,
  parentId: StorySnapshotId,
  input: {
    id: StorySnapshotId;
    branchId: string;
    slides: RichSlide[];
    now?: number;
  },
): StoryTree {
  const snapshot: StorySnapshot = {
    id: input.id,
    parentId,
    branchId: input.branchId,
    slides: input.slides,
    createdAt: input.now ?? Date.now(),
    comments: [],
    approval: "draft",
  };
  return { snapshots: [snapshot, ...tree.snapshots], headId: snapshot.id };
}

// ─── Read ─────────────────────────────────────────────────────────────────

export function findStorySnapshot(
  tree: StoryTree,
  id: StorySnapshotId,
): StorySnapshot | undefined {
  return tree.snapshots.find((s) => s.id === id);
}

export function storyHead(tree: StoryTree): StorySnapshot | undefined {
  return tree.headId ? findStorySnapshot(tree, tree.headId) : undefined;
}

export function storyLineage(
  tree: StoryTree,
  id: StorySnapshotId,
): StorySnapshot[] {
  const out: StorySnapshot[] = [];
  let cursor: StorySnapshot | undefined = findStorySnapshot(tree, id);
  const seen = new Set<StorySnapshotId>();
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    out.push(cursor);
    cursor = cursor.parentId ? findStorySnapshot(tree, cursor.parentId) : undefined;
  }
  return out;
}

export function storyBranchTips(tree: StoryTree): StorySnapshot[] {
  return tree.snapshots.filter((s) => s.branchId);
}

// ─── Compare / restore / duplicate / merge ────────────────────────────────

export type SlideDiff = {
  index: number;
  slideId: string;
  before: RichSlide | undefined;
  after: RichSlide | undefined;
  kind: "added" | "removed" | "changed";
};

export function compareStorySnapshots(
  a: StorySnapshot,
  b: StorySnapshot,
): { slideDiffs: SlideDiff[] } {
  const byIdA = new Map(a.slides.map((s) => [s.id, s]));
  const byIdB = new Map(b.slides.map((s) => [s.id, s]));
  const allIds = new Set([...byIdA.keys(), ...byIdB.keys()]);
  const diffs: SlideDiff[] = [];
  for (const id of allIds) {
    const before = byIdA.get(id);
    const after = byIdB.get(id);
    if (!before && after) {
      diffs.push({ index: after.index, slideId: id, before: undefined, after, kind: "added" });
    } else if (before && !after) {
      diffs.push({ index: before.index, slideId: id, before, after: undefined, kind: "removed" });
    } else if (before && after) {
      if (before.title !== after.title || before.body !== after.body || before.cta?.label !== after.cta?.label) {
        diffs.push({ index: after.index, slideId: id, before, after, kind: "changed" });
      }
    }
  }
  return { slideDiffs: diffs.sort((x, y) => x.index - y.index) };
}

export function restoreStorySnapshot(tree: StoryTree, id: StorySnapshotId): StoryTree {
  if (!findStorySnapshot(tree, id)) return tree;
  return { ...tree, headId: id };
}

export function duplicateStorySnapshot(
  tree: StoryTree,
  sourceId: StorySnapshotId,
  newId: StorySnapshotId,
  now: number = Date.now(),
): StoryTree {
  const src = findStorySnapshot(tree, sourceId);
  if (!src) return tree;
  const copy: StorySnapshot = {
    ...src,
    id: newId,
    parentId: src.id,
    label: src.label ? `${src.label} (copy)` : undefined,
    branchId: undefined,
    createdAt: now,
    comments: [],
    approval: "draft",
  };
  return { snapshots: [copy, ...tree.snapshots], headId: copy.id };
}

export function mergeStorySnapshots(
  tree: StoryTree,
  intoId: StorySnapshotId,
  takeId: StorySnapshotId,
  newId: StorySnapshotId,
  now: number = Date.now(),
): StoryTree {
  const into = findStorySnapshot(tree, intoId);
  const take = findStorySnapshot(tree, takeId);
  if (!into || !take) return tree;
  const merged: StorySnapshot = {
    id: newId,
    parentId: into.id,
    slides: take.slides,
    createdAt: now,
    comments: [],
    label: "Merged",
    message: `Merged ${take.id} → ${into.id}`,
    approval: "draft",
  };
  return { snapshots: [merged, ...tree.snapshots], headId: merged.id };
}

// ─── Labels + comments + approval ────────────────────────────────────────

export function labelStorySnapshot(
  tree: StoryTree,
  id: StorySnapshotId,
  label: string,
): StoryTree {
  return {
    ...tree,
    snapshots: tree.snapshots.map((s) =>
      s.id === id ? { ...s, label: label.trim() || undefined } : s,
    ),
  };
}

export function commentOnStorySnapshot(
  tree: StoryTree,
  id: StorySnapshotId,
  comment: StoryComment,
): StoryTree {
  return {
    ...tree,
    snapshots: tree.snapshots.map((s) =>
      s.id === id ? { ...s, comments: [comment, ...s.comments] } : s,
    ),
  };
}

export function removeStoryComment(
  tree: StoryTree,
  snapshotId: StorySnapshotId,
  commentId: string,
): StoryTree {
  return {
    ...tree,
    snapshots: tree.snapshots.map((s) =>
      s.id === snapshotId
        ? { ...s, comments: s.comments.filter((c) => c.id !== commentId) }
        : s,
    ),
  };
}

export function setStoryApproval(
  tree: StoryTree,
  id: StorySnapshotId,
  approval: NonNullable<StorySnapshot["approval"]>,
): StoryTree {
  return {
    ...tree,
    snapshots: tree.snapshots.map((s) => (s.id === id ? { ...s, approval } : s)),
  };
}
