/**
 * Brand version tree — Git-like snapshots of a Brand's DNA + Visual
 * Language. Keeps a canonical HEAD so consumers always read a
 * consistent snapshot; supports commit / branch / restore / duplicate
 * / label / comments.
 */

import type { BrandDNA } from "./brand-dna";
import type { VisualLanguage } from "./visual-language";

export type BrandSnapshotId = string;

export type BrandComment = {
  id: string;
  author?: string;
  body: string;
  createdAt: number;
};

export type BrandSnapshot = {
  id: BrandSnapshotId;
  parentId?: BrandSnapshotId;
  branchId?: string;
  label?: string;
  message?: string;
  dna: BrandDNA;
  visual: VisualLanguage;
  createdAt: number;
  comments: BrandComment[];
};

export type BrandTree = {
  snapshots: BrandSnapshot[];
  headId: BrandSnapshotId | null;
};

export const emptyBrandTree = (): BrandTree => ({ snapshots: [], headId: null });

export function commitBrandSnapshot(
  tree: BrandTree,
  input: {
    id: BrandSnapshotId;
    dna: BrandDNA;
    visual: VisualLanguage;
    label?: string;
    message?: string;
    branchId?: string;
    now?: number;
  },
): BrandTree {
  const snapshot: BrandSnapshot = {
    id: input.id,
    parentId: tree.headId ?? undefined,
    branchId: input.branchId,
    label: input.label,
    message: input.message,
    dna: input.dna,
    visual: input.visual,
    createdAt: input.now ?? Date.now(),
    comments: [],
  };
  return { snapshots: [snapshot, ...tree.snapshots], headId: snapshot.id };
}

export function branchBrand(
  tree: BrandTree,
  parentId: BrandSnapshotId,
  input: {
    id: BrandSnapshotId;
    branchId: string;
    dna: BrandDNA;
    visual: VisualLanguage;
    now?: number;
  },
): BrandTree {
  const snap: BrandSnapshot = {
    id: input.id,
    parentId,
    branchId: input.branchId,
    dna: input.dna,
    visual: input.visual,
    createdAt: input.now ?? Date.now(),
    comments: [],
  };
  return { snapshots: [snap, ...tree.snapshots], headId: snap.id };
}

export function findBrandSnapshot(
  tree: BrandTree,
  id: BrandSnapshotId,
): BrandSnapshot | undefined {
  return tree.snapshots.find((s) => s.id === id);
}

export function brandHead(tree: BrandTree): BrandSnapshot | undefined {
  return tree.headId ? findBrandSnapshot(tree, tree.headId) : undefined;
}

export function restoreBrand(tree: BrandTree, id: BrandSnapshotId): BrandTree {
  if (!findBrandSnapshot(tree, id)) return tree;
  return { ...tree, headId: id };
}

export function duplicateBrand(
  tree: BrandTree,
  sourceId: BrandSnapshotId,
  newId: BrandSnapshotId,
  now: number = Date.now(),
): BrandTree {
  const src = findBrandSnapshot(tree, sourceId);
  if (!src) return tree;
  const copy: BrandSnapshot = {
    ...src,
    id: newId,
    parentId: src.id,
    branchId: undefined,
    label: src.label ? `${src.label} (copy)` : undefined,
    createdAt: now,
    comments: [],
  };
  return { snapshots: [copy, ...tree.snapshots], headId: copy.id };
}

export function labelBrandSnapshot(
  tree: BrandTree,
  id: BrandSnapshotId,
  label: string,
): BrandTree {
  return {
    ...tree,
    snapshots: tree.snapshots.map((s) =>
      s.id === id ? { ...s, label: label.trim() || undefined } : s,
    ),
  };
}

export function commentOnBrandSnapshot(
  tree: BrandTree,
  id: BrandSnapshotId,
  comment: BrandComment,
): BrandTree {
  return {
    ...tree,
    snapshots: tree.snapshots.map((s) =>
      s.id === id ? { ...s, comments: [comment, ...s.comments] } : s,
    ),
  };
}

export function removeBrandComment(
  tree: BrandTree,
  snapshotId: BrandSnapshotId,
  commentId: string,
): BrandTree {
  return {
    ...tree,
    snapshots: tree.snapshots.map((s) =>
      s.id === snapshotId
        ? { ...s, comments: s.comments.filter((c) => c.id !== commentId) }
        : s,
    ),
  };
}
