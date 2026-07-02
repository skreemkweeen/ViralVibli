/**
 * Project relationship graph.
 *
 * Given a Project + the entity slices it references (stories, vision
 * concepts, prompts, moodboard items, activity), produce a deterministic
 * node + edge graph suitable for a static SVG layout. Pure. No React.
 *
 * Layout algorithm: root project node at center. Kind clusters positioned
 * around it in a fixed angular order so the graph reads the same way each
 * time the creator opens the workspace — no drift, no reshuffling.
 */

import type { Project, ProjectItemRef } from "@/lib/workspace/types";

export type ProjectNodeKind =
  | "project"
  | "story"
  | "image"
  | "prompt"
  | "moodboard"
  | "note"
  | "activity";

export type ProjectNode = {
  id: string;
  kind: ProjectNodeKind;
  label: string;
  sublabel?: string;
  createdAt?: number;
  x: number;
  y: number;
};

export type ProjectEdge = {
  from: string;
  to: string;
};

export type ProjectGraph = {
  nodes: ProjectNode[];
  edges: ProjectEdge[];
};

export type ProjectGraphSources = {
  stories?: Array<{ id: string; title?: string; brief?: string; createdAt?: number }>;
  images?: Array<{ id: string; title?: string; brief?: string; createdAt?: number }>;
  prompts?: Array<{ id: string; title: string; createdAt?: number }>;
  moodboard?: Array<{ id: string; title?: string; createdAt?: number }>;
  activity?: Array<{ id: string; title: string; createdAt?: number; projectId?: string }>;
};

/**
 * Convert an item ref into the display kind used by the graph.
 */
function refKindToNodeKind(
  type: ProjectItemRef["type"],
): Exclude<ProjectNodeKind, "project"> {
  switch (type) {
    case "vision":
      return "image";
    case "story":
      return "story";
    case "prompt":
      return "prompt";
    case "conversation":
      return "note";
    default:
      return "note";
  }
}

/**
 * Cluster angles (radians) — kept fixed so returning to the project
 * doesn't reshuffle the layout.
 */
const CLUSTER_ANGLE: Record<Exclude<ProjectNodeKind, "project">, number> = {
  story: -Math.PI / 2, // top
  image: -Math.PI / 6, // upper right
  prompt: Math.PI / 6, // lower right
  moodboard: Math.PI / 2, // bottom
  note: (Math.PI * 5) / 6, // lower left
  activity: (-Math.PI * 5) / 6, // upper left
};

const CLUSTER_RADIUS = 180;
const NODE_SPREAD = 44; // spacing between siblings in a cluster

/**
 * Build a full graph. Nodes have deterministic (x, y) placements around
 * the project root so the SVG can render without a physics simulation.
 */
export function buildProjectGraph(
  project: Project,
  sources: ProjectGraphSources = {},
  size: { width: number; height: number } = { width: 720, height: 480 },
): ProjectGraph {
  const cx = size.width / 2;
  const cy = size.height / 2;

  const rootNode: ProjectNode = {
    id: `project:${project.id}`,
    kind: "project",
    label: project.name,
    sublabel: project.description ?? undefined,
    createdAt: project.createdAt,
    x: cx,
    y: cy,
  };

  const nodes: ProjectNode[] = [rootNode];
  const edges: ProjectEdge[] = [];

  // Group referenced items by kind for deterministic cluster placement.
  const grouped: Record<Exclude<ProjectNodeKind, "project">, ProjectNode[]> = {
    story: [],
    image: [],
    prompt: [],
    moodboard: [],
    note: [],
    activity: [],
  };

  const seen = new Set<string>();

  const push = (
    kind: Exclude<ProjectNodeKind, "project">,
    id: string,
    label: string,
    createdAt?: number,
    sublabel?: string,
  ) => {
    const nodeId = `${kind}:${id}`;
    if (seen.has(nodeId)) return;
    seen.add(nodeId);
    grouped[kind].push({
      id: nodeId,
      kind,
      label,
      sublabel,
      createdAt,
      x: 0,
      y: 0,
    });
  };

  // Project.items (legacy path)
  for (const item of project.items) {
    push(refKindToNodeKind(item.type), item.id, item.title);
  }

  // Sources (new path — passes in the actual persisted collections)
  for (const s of sources.stories ?? []) {
    push("story", s.id, s.title ?? "Story", s.createdAt, s.brief);
  }
  for (const i of sources.images ?? []) {
    push("image", i.id, i.title ?? "Image", i.createdAt, i.brief);
  }
  for (const p of sources.prompts ?? []) {
    push("prompt", p.id, p.title, p.createdAt);
  }
  for (const m of sources.moodboard ?? []) {
    push("moodboard", m.id, m.title ?? "Reference", m.createdAt);
  }

  // Notes stored on the project directly
  for (const n of project.notes ?? []) {
    push(
      "note",
      n.id,
      n.body.length > 40 ? n.body.slice(0, 40) + "…" : n.body,
      n.createdAt,
    );
  }

  // Activity items scoped to this project — cap at a small number so the
  // cluster stays readable.
  const activityItems = (sources.activity ?? [])
    .filter((a) => !a.projectId || a.projectId === project.id)
    .slice(0, 4);
  for (const a of activityItems) {
    push("activity", a.id, a.title, a.createdAt);
  }

  // Lay out each cluster on its arc.
  for (const kind of Object.keys(CLUSTER_ANGLE) as Array<
    keyof typeof CLUSTER_ANGLE
  >) {
    const group = grouped[kind];
    if (group.length === 0) continue;
    const angle = CLUSTER_ANGLE[kind];
    // Slight spread perpendicular to the radial line for multiple items.
    const perp = angle + Math.PI / 2;
    const centerX = cx + Math.cos(angle) * CLUSTER_RADIUS;
    const centerY = cy + Math.sin(angle) * CLUSTER_RADIUS;
    group.forEach((node, i) => {
      const offset = (i - (group.length - 1) / 2) * NODE_SPREAD;
      node.x = centerX + Math.cos(perp) * offset;
      node.y = centerY + Math.sin(perp) * offset;
      nodes.push(node);
      edges.push({ from: rootNode.id, to: node.id });
    });
  }

  return { nodes, edges };
}

/**
 * Return the ids of every node connected to `nodeId`. Bidirectional lookup
 * — used by the graph UI to highlight the whole neighborhood on hover.
 */
export function connectedIds(graph: ProjectGraph, nodeId: string): string[] {
  const out = new Set<string>();
  for (const e of graph.edges) {
    if (e.from === nodeId) out.add(e.to);
    if (e.to === nodeId) out.add(e.from);
  }
  return [...out];
}

/**
 * Return an insight summary — how many of each kind the project has —
 * for the inspector panel.
 */
export function projectSummary(
  project: Project,
  sources: ProjectGraphSources = {},
): {
  stories: number;
  images: number;
  prompts: number;
  moodboard: number;
  notes: number;
  activity: number;
} {
  const activityCount = (sources.activity ?? []).filter(
    (a) => !a.projectId || a.projectId === project.id,
  ).length;
  return {
    stories: (sources.stories ?? []).length,
    images: (sources.images ?? []).length,
    prompts: (sources.prompts ?? []).length,
    moodboard: (sources.moodboard ?? []).length,
    notes: (project.notes ?? []).length,
    activity: activityCount,
  };
}
