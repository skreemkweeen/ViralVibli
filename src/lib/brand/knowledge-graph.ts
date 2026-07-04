/**
 * Creative Knowledge Graph — builds a directed graph over the whole
 * creative surface: Brand → Projects → Campaigns → Stories → Vision
 * concepts → Prompts → Moodboards → Publishing → Analytics.
 *
 * Pure. The caller passes only what it wants shown; the builder emits
 * nodes + edges + depth hints so the UI can lay them out.
 */

export type KGNodeKind =
  | "brand"
  | "project"
  | "campaign"
  | "story"
  | "vision"
  | "prompt"
  | "moodboard"
  | "publishing"
  | "analytics";

export type KGNode = {
  id: string;
  kind: KGNodeKind;
  label: string;
  depth: number;
  href?: string;
  parentId?: string;
};

export type KGEdge = {
  from: string;
  to: string;
  label?: string;
};

export type CreativeKnowledgeGraph = {
  nodes: KGNode[];
  edges: KGEdge[];
};

// ─── Inputs ──────────────────────────────────────────────────────────────

export type BuildKGInput = {
  brand: { id: string; name: string };
  projects: Array<{ id: string; name: string }>;
  campaigns: Array<{ id: string; name: string; projectId?: string }>;
  stories: Array<{ id: string; name: string; campaignId?: string }>;
  visionConcepts: Array<{ id: string; label: string; projectId?: string; storyId?: string }>;
  prompts: Array<{ id: string; label: string; conceptId?: string }>;
  moodboards: Array<{ id: string; label: string; brandId?: string }>;
  publishing: Array<{ id: string; label: string; storyId?: string }>;
  analytics: Array<{ id: string; label: string; publishingId?: string; storyId?: string }>;
};

export function emptyKGInput(brand: { id: string; name: string }): BuildKGInput {
  return {
    brand,
    projects: [],
    campaigns: [],
    stories: [],
    visionConcepts: [],
    prompts: [],
    moodboards: [],
    publishing: [],
    analytics: [],
  };
}

// ─── Builder ─────────────────────────────────────────────────────────────

export function buildKnowledgeGraph(input: BuildKGInput): CreativeKnowledgeGraph {
  const nodes: KGNode[] = [];
  const edges: KGEdge[] = [];
  const seen = new Set<string>();

  const push = (n: KGNode) => {
    if (seen.has(n.id)) return;
    seen.add(n.id);
    nodes.push(n);
  };
  const link = (from: string, to: string, label?: string) => {
    if (!from || !to) return;
    edges.push({ from, to, label });
  };

  const brandId = `brand:${input.brand.id}`;
  push({ id: brandId, kind: "brand", label: input.brand.name || "Brand", depth: 0 });

  for (const p of input.projects) {
    const pid = `project:${p.id}`;
    push({ id: pid, kind: "project", label: p.name, depth: 1, parentId: brandId });
    link(brandId, pid, "owns");
  }

  for (const m of input.moodboards) {
    const mid = `moodboard:${m.id}`;
    push({ id: mid, kind: "moodboard", label: m.label, depth: 1, parentId: brandId });
    link(brandId, mid, "moodboard");
  }

  for (const c of input.campaigns) {
    const cid = `campaign:${c.id}`;
    const parent = c.projectId ? `project:${c.projectId}` : brandId;
    push({ id: cid, kind: "campaign", label: c.name, depth: 2, parentId: parent });
    link(parent, cid, "campaign");
  }

  for (const s of input.stories) {
    const sid = `story:${s.id}`;
    const parent = s.campaignId ? `campaign:${s.campaignId}` : brandId;
    push({ id: sid, kind: "story", label: s.name, depth: 3, parentId: parent });
    link(parent, sid, "story");
  }

  for (const v of input.visionConcepts) {
    const vid = `vision:${v.id}`;
    const parent = v.storyId
      ? `story:${v.storyId}`
      : v.projectId
        ? `project:${v.projectId}`
        : brandId;
    push({ id: vid, kind: "vision", label: v.label, depth: 4, parentId: parent });
    link(parent, vid, "vision");
  }

  for (const pr of input.prompts) {
    const prid = `prompt:${pr.id}`;
    const parent = pr.conceptId ? `vision:${pr.conceptId}` : brandId;
    push({ id: prid, kind: "prompt", label: pr.label, depth: 5, parentId: parent });
    link(parent, prid, "prompt");
  }

  for (const pu of input.publishing) {
    const puid = `publishing:${pu.id}`;
    const parent = pu.storyId ? `story:${pu.storyId}` : brandId;
    push({ id: puid, kind: "publishing", label: pu.label, depth: 4, parentId: parent });
    link(parent, puid, "publishing");
  }

  for (const a of input.analytics) {
    const aid = `analytics:${a.id}`;
    const parent = a.publishingId
      ? `publishing:${a.publishingId}`
      : a.storyId
        ? `story:${a.storyId}`
        : brandId;
    push({ id: aid, kind: "analytics", label: a.label, depth: 5, parentId: parent });
    link(parent, aid, "analytics");
  }

  return { nodes, edges };
}

// ─── Read helpers ───────────────────────────────────────────────────────

export function kgNodesByDepth(g: CreativeKnowledgeGraph): Record<number, KGNode[]> {
  const acc: Record<number, KGNode[]> = {};
  for (const n of g.nodes) (acc[n.depth] ??= []).push(n);
  return acc;
}

export function kgNeighbours(g: CreativeKnowledgeGraph, id: string): KGNode[] {
  const ids = new Set(
    g.edges
      .filter((e) => e.from === id || e.to === id)
      .flatMap((e) => (e.from === id ? [e.to] : [e.from])),
  );
  return g.nodes.filter((n) => ids.has(n.id));
}

export function kgFilterByKind(
  g: CreativeKnowledgeGraph,
  kinds: KGNodeKind[],
): CreativeKnowledgeGraph {
  const set = new Set(kinds);
  const nodes = g.nodes.filter((n) => set.has(n.kind));
  const ids = new Set(nodes.map((n) => n.id));
  const edges = g.edges.filter((e) => ids.has(e.from) && ids.has(e.to));
  return { nodes, edges };
}
