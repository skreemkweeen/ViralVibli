/**
 * Prompt Version Control — Git-like branching model over prompts.
 *
 * Each snapshot has a parent (the previous state it was created from),
 * optional labels, and optional comments. Branches are just named
 * snapshots you keep returning to. Compare/restore/duplicate are pure
 * operations over the snapshot tree.
 */

import type { Direction } from "./prompt";

export type PromptSnapshotId = string;

export type PromptComment = {
  id: string;
  author?: string;
  body: string;
  createdAt: number;
};

export type PromptSnapshot = {
  id: PromptSnapshotId;
  parentId?: PromptSnapshotId;
  branchId?: string; // human-readable branch name if this is a branch tip
  label?: string;
  message?: string;
  prompt: string;
  direction: Direction;
  createdAt: number;
  comments: PromptComment[];
};

export type PromptTree = {
  snapshots: PromptSnapshot[];
  /** Current head snapshot the builder is anchored to */
  headId: PromptSnapshotId | null;
};

// ─── Factories ────────────────────────────────────────────────────────────

export function emptyTree(): PromptTree {
  return { snapshots: [], headId: null };
}

export function commitSnapshot(
  tree: PromptTree,
  input: {
    id: PromptSnapshotId;
    prompt: string;
    direction: Direction;
    message?: string;
    label?: string;
    branchId?: string;
    now?: number;
  },
): PromptTree {
  const snapshot: PromptSnapshot = {
    id: input.id,
    parentId: tree.headId ?? undefined,
    branchId: input.branchId,
    label: input.label,
    message: input.message,
    prompt: input.prompt,
    direction: input.direction,
    createdAt: input.now ?? Date.now(),
    comments: [],
  };
  return {
    snapshots: [snapshot, ...tree.snapshots],
    headId: snapshot.id,
  };
}

export function branchFrom(
  tree: PromptTree,
  parentId: PromptSnapshotId,
  input: {
    id: PromptSnapshotId;
    branchId: string;
    prompt: string;
    direction: Direction;
    now?: number;
  },
): PromptTree {
  const snapshot: PromptSnapshot = {
    id: input.id,
    parentId,
    branchId: input.branchId,
    prompt: input.prompt,
    direction: input.direction,
    createdAt: input.now ?? Date.now(),
    comments: [],
  };
  return {
    snapshots: [snapshot, ...tree.snapshots],
    headId: snapshot.id,
  };
}

// ─── Read ─────────────────────────────────────────────────────────────────

export function findSnapshot(
  tree: PromptTree,
  id: PromptSnapshotId,
): PromptSnapshot | undefined {
  return tree.snapshots.find((s) => s.id === id);
}

export function head(tree: PromptTree): PromptSnapshot | undefined {
  return tree.headId ? findSnapshot(tree, tree.headId) : undefined;
}

/** Walk from a snapshot up to the root through parentId links. */
export function lineage(
  tree: PromptTree,
  id: PromptSnapshotId,
): PromptSnapshot[] {
  const out: PromptSnapshot[] = [];
  let cursor: PromptSnapshot | undefined = findSnapshot(tree, id);
  const seen = new Set<PromptSnapshotId>();
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    out.push(cursor);
    cursor = cursor.parentId ? findSnapshot(tree, cursor.parentId) : undefined;
  }
  return out;
}

export function branchTips(tree: PromptTree): PromptSnapshot[] {
  return tree.snapshots.filter((s) => s.branchId);
}

// ─── Compare + restore + duplicate + merge ───────────────────────────────

export type FieldDiff = { field: keyof Direction; before: unknown; after: unknown };

export function compareSnapshots(
  a: PromptSnapshot,
  b: PromptSnapshot,
): { promptChanged: boolean; fieldDiffs: FieldDiff[] } {
  const promptChanged = a.prompt !== b.prompt;
  const fieldDiffs: FieldDiff[] = [];
  const keys = Object.keys(a.direction) as (keyof Direction)[];
  for (const k of keys) {
    if (a.direction[k] !== b.direction[k]) {
      fieldDiffs.push({ field: k, before: a.direction[k], after: b.direction[k] });
    }
  }
  return { promptChanged, fieldDiffs };
}

export function restore(
  tree: PromptTree,
  id: PromptSnapshotId,
): PromptTree {
  if (!findSnapshot(tree, id)) return tree;
  return { ...tree, headId: id };
}

export function duplicateSnapshot(
  tree: PromptTree,
  sourceId: PromptSnapshotId,
  newId: PromptSnapshotId,
  now: number = Date.now(),
): PromptTree {
  const src = findSnapshot(tree, sourceId);
  if (!src) return tree;
  const copy: PromptSnapshot = {
    ...src,
    id: newId,
    parentId: src.id,
    label: src.label ? `${src.label} (copy)` : undefined,
    branchId: undefined,
    createdAt: now,
    comments: [],
  };
  return {
    snapshots: [copy, ...tree.snapshots],
    headId: copy.id,
  };
}

/**
 * Merge — record a snapshot whose prompt/direction come from `takeId`
 * but whose parent is `intoId`. The intent is that the caller has
 * chosen which side wins; the tree records the lineage.
 */
export function mergeSnapshots(
  tree: PromptTree,
  intoId: PromptSnapshotId,
  takeId: PromptSnapshotId,
  newId: PromptSnapshotId,
  now: number = Date.now(),
): PromptTree {
  const into = findSnapshot(tree, intoId);
  const take = findSnapshot(tree, takeId);
  if (!into || !take) return tree;
  const merged: PromptSnapshot = {
    id: newId,
    parentId: into.id,
    prompt: take.prompt,
    direction: take.direction,
    createdAt: now,
    comments: [],
    label: "Merged",
    message: `Merged ${take.id} → ${into.id}`,
  };
  return {
    snapshots: [merged, ...tree.snapshots],
    headId: merged.id,
  };
}

// ─── Labels + comments ────────────────────────────────────────────────────

export function labelSnapshot(
  tree: PromptTree,
  id: PromptSnapshotId,
  label: string,
): PromptTree {
  return {
    ...tree,
    snapshots: tree.snapshots.map((s) =>
      s.id === id ? { ...s, label: label.trim() || undefined } : s,
    ),
  };
}

export function commentOnSnapshot(
  tree: PromptTree,
  id: PromptSnapshotId,
  comment: PromptComment,
): PromptTree {
  return {
    ...tree,
    snapshots: tree.snapshots.map((s) =>
      s.id === id ? { ...s, comments: [comment, ...s.comments] } : s,
    ),
  };
}

export function removeComment(
  tree: PromptTree,
  snapshotId: PromptSnapshotId,
  commentId: string,
): PromptTree {
  return {
    ...tree,
    snapshots: tree.snapshots.map((s) =>
      s.id === snapshotId
        ? { ...s, comments: s.comments.filter((c) => c.id !== commentId) }
        : s,
    ),
  };
}
