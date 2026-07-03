/**
 * Narrative Graph — builds a directed relationship graph over a set of
 * Story Studio objects (Campaign > Sequence > Story > Slide > Asset >
 * Vision concept > Brand > Project).
 *
 * Pure — the caller passes in the raw objects it wants shown, and the
 * builder emits nodes + edges + layout hints. The UI reads those and
 * renders the graph.
 */

import type { RichSlide, SlideAttachment } from "./story-slides";
import type {
  StoryCampaign,
  StoryEntry,
  StorySequence,
} from "./story-campaigns";

export type GraphNodeKind =
  | "project"
  | "brand"
  | "campaign"
  | "sequence"
  | "story"
  | "slide"
  | "asset"
  | "vision";

export type GraphNode = {
  id: string;
  kind: GraphNodeKind;
  label: string;
  parentId?: string;
  /** Depth from the root (0 = root) */
  depth: number;
  /** Optional external link (e.g. asset URL) */
  href?: string;
};

export type GraphEdge = {
  from: string;
  to: string;
  /** Optional label — describes the relationship */
  label?: string;
};

export type NarrativeGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type BuildGraphInput = {
  projectId?: string;
  projectLabel?: string;
  brandLabel?: string;
  campaigns: StoryCampaign[];
  stories: StoryEntry[];
};

export function buildNarrativeGraph(input: BuildGraphInput): NarrativeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const storyIndex = new Map(input.stories.map((s) => [s.id, s]));

  // Project root
  if (input.projectId) {
    nodes.push({
      id: `project:${input.projectId}`,
      kind: "project",
      label: input.projectLabel ?? input.projectId,
      depth: 0,
    });
  }
  // Brand
  if (input.brandLabel) {
    nodes.push({
      id: `brand:${input.brandLabel}`,
      kind: "brand",
      label: input.brandLabel,
      depth: 0,
    });
  }

  for (const campaign of input.campaigns) {
    const campNodeId = `campaign:${campaign.id}`;
    nodes.push({
      id: campNodeId,
      kind: "campaign",
      label: campaign.name,
      parentId: input.projectId ? `project:${input.projectId}` : undefined,
      depth: 1,
    });
    if (input.projectId) {
      edges.push({
        from: `project:${input.projectId}`,
        to: campNodeId,
        label: "contains",
      });
    }
    if (input.brandLabel) {
      edges.push({
        from: `brand:${input.brandLabel}`,
        to: campNodeId,
        label: "authors",
      });
    }

    for (const seq of campaign.sequences) {
      pushSequence(nodes, edges, seq, campNodeId, campaign.id, storyIndex);
    }
  }

  return { nodes, edges };
}

function pushSequence(
  nodes: GraphNode[],
  edges: GraphEdge[],
  sequence: StorySequence,
  campaignNodeId: string,
  campaignId: string,
  storyIndex: Map<string, StoryEntry>,
) {
  const seqNodeId = `seq:${sequence.id}`;
  nodes.push({
    id: seqNodeId,
    kind: "sequence",
    label: sequence.label,
    parentId: campaignNodeId,
    depth: 2,
  });
  edges.push({ from: campaignNodeId, to: seqNodeId, label: "beat" });
  for (const sid of sequence.storyIds) {
    const story = storyIndex.get(sid);
    if (!story) continue;
    pushStory(nodes, edges, story, seqNodeId, campaignId);
  }
}

function pushStory(
  nodes: GraphNode[],
  edges: GraphEdge[],
  story: StoryEntry,
  parentSeqNodeId: string,
  _campaignId: string,
) {
  const storyNodeId = `story:${story.id}`;
  nodes.push({
    id: storyNodeId,
    kind: "story",
    label: story.name,
    parentId: parentSeqNodeId,
    depth: 3,
  });
  edges.push({ from: parentSeqNodeId, to: storyNodeId, label: "story" });
  for (const slide of story.slides) {
    pushSlide(nodes, edges, slide, storyNodeId);
  }
}

function pushSlide(
  nodes: GraphNode[],
  edges: GraphEdge[],
  slide: RichSlide,
  storyNodeId: string,
) {
  const slideNodeId = `slide:${slide.id}`;
  nodes.push({
    id: slideNodeId,
    kind: "slide",
    label: slide.title || `Slide ${slide.index + 1}`,
    parentId: storyNodeId,
    depth: 4,
  });
  edges.push({ from: storyNodeId, to: slideNodeId, label: "slide" });

  if (slide.visionConceptId) {
    const visionId = `vision:${slide.visionConceptId}`;
    if (!nodes.find((n) => n.id === visionId)) {
      nodes.push({
        id: visionId,
        kind: "vision",
        label: `Vision · ${slide.visionConceptId.slice(0, 8)}`,
        depth: 5,
      });
    }
    edges.push({ from: slideNodeId, to: visionId, label: "references" });
  }

  for (const att of slide.attachments) {
    pushAsset(nodes, edges, att, slideNodeId);
  }
}

function pushAsset(
  nodes: GraphNode[],
  edges: GraphEdge[],
  asset: SlideAttachment,
  slideNodeId: string,
) {
  const assetId = `asset:${asset.id}`;
  if (!nodes.find((n) => n.id === assetId)) {
    nodes.push({
      id: assetId,
      kind: "asset",
      label: asset.label,
      depth: 5,
      href: asset.url,
    });
  }
  edges.push({ from: slideNodeId, to: assetId, label: asset.kind });
}

// ─── Read helpers ─────────────────────────────────────────────────────────

export function nodesByDepth(graph: NarrativeGraph): Record<number, GraphNode[]> {
  const acc: Record<number, GraphNode[]> = {};
  for (const n of graph.nodes) {
    (acc[n.depth] ??= []).push(n);
  }
  return acc;
}

export function neighbours(graph: NarrativeGraph, id: string): GraphNode[] {
  const ids = new Set(
    graph.edges
      .filter((e) => e.from === id || e.to === id)
      .flatMap((e) => (e.from === id ? [e.to] : [e.from])),
  );
  return graph.nodes.filter((n) => ids.has(n.id));
}
