/**
 * Prompt relationship graph — pure derivation of a graph structure from a
 * list of prompts, based on tag overlap. No physics simulation, no
 * randomness. Layout is a circular arrangement, sorted by category then
 * usage so the visual carries meaning.
 */

import type { PromptEntry } from "./types";

export type GraphNode = {
  id: string;
  title: string;
  category: string;
  favorite: boolean;
  pinned: boolean;
  usageCount: number;
  /** Angle around the ring, radians. */
  angle: number;
  /** Cartesian coordinate in a unit circle centered at (0.5, 0.5). */
  x: number;
  y: number;
  /** Number of edges incident to this node — useful for sizing. */
  degree: number;
};

export type GraphEdge = {
  source: string;
  target: string;
  /** Shared tag count. Higher = stronger relationship. */
  weight: number;
  sharedTags: string[];
};

export type PromptGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Highest edge weight in the graph — useful for normalising line opacity. */
  maxWeight: number;
};

export function buildPromptGraph(prompts: PromptEntry[]): PromptGraph {
  if (prompts.length === 0) {
    return { nodes: [], edges: [], maxWeight: 0 };
  }

  // Deterministic order: category → title → id so the same input always lays
  // out the same way. Users expect stability across renders.
  const ordered = [...prompts].sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.title !== b.title) return a.title.localeCompare(b.title);
    return a.id.localeCompare(b.id);
  });

  // Build edges first so we can compute degrees before finalising nodes.
  const edges: GraphEdge[] = [];
  for (let i = 0; i < ordered.length; i++) {
    const a = ordered[i];
    for (let j = i + 1; j < ordered.length; j++) {
      const b = ordered[j];
      const shared = a.tags.filter((t) => b.tags.includes(t));
      if (shared.length === 0) continue;
      edges.push({
        source: a.id,
        target: b.id,
        weight: shared.length,
        sharedTags: shared,
      });
    }
  }

  const degrees = new Map<string, number>();
  for (const edge of edges) {
    degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
    degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
  }

  // Layout — circle around (0.5, 0.5) with radius 0.42.
  const n = ordered.length;
  const R = 0.42;
  const nodes: GraphNode[] = ordered.map((p, i) => {
    // Rotate the starting angle by -π/2 so index 0 lands at the top.
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return {
      id: p.id,
      title: p.title,
      category: p.category,
      favorite: p.favorite,
      pinned: p.pinned,
      usageCount: p.usageCount,
      angle,
      x: 0.5 + R * Math.cos(angle),
      y: 0.5 + R * Math.sin(angle),
      degree: degrees.get(p.id) ?? 0,
    };
  });

  const maxWeight = edges.reduce((acc, e) => Math.max(acc, e.weight), 0);

  return { nodes, edges, maxWeight };
}
