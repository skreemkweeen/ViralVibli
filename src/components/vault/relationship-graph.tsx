"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Graph as GraphIcon, Sparkle } from "@phosphor-icons/react";
import { useVault } from "@/lib/vault/store";
import { buildPromptGraph, type GraphNode } from "@/lib/vault/graph";
import { categories } from "@/lib/vault/data";
import type { PromptCategory } from "@/lib/vault/types";

/**
 * Prompt relationship graph — SVG visualisation of tag-overlap edges between
 * prompts. Read-only: hover to highlight, click to select. All layout math
 * happens in the pure buildPromptGraph() so the component only maps values
 * onto SVG coordinates.
 *
 * Gate: the graph is emotionally meaningful once at least 8 prompts exist.
 * Below that we show a small "add more prompts" hint.
 */

const CATEGORY_HUE: Record<PromptCategory, number> = {
  "image-gen": 82, // acid-lime family
  "copywriting": 200, // cool blue
  social: 320, // rose
  video: 260, // violet
  research: 30, // amber
  code: 160, // teal
  analysis: 100, // sage green
  creative: 40, // warm gold
};

const MIN_PROMPTS = 8;

export function PromptRelationshipGraph() {
  const { prompts, selectPrompt } = useVault();
  const reduce = useReducedMotion();
  const [hoverId, setHoverId] = useState<string | null>(null);

  const graph = useMemo(() => buildPromptGraph(prompts), [prompts]);

  if (prompts.length < MIN_PROMPTS) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <span className="grid size-14 place-items-center rounded-2xl border border-line bg-surface-2 text-faint">
          <GraphIcon className="size-6" />
        </span>
        <div className="space-y-1.5">
          <p className="text-[14px] font-medium text-ink">
            The graph unlocks once your vault has {MIN_PROMPTS} prompts
          </p>
          <p className="max-w-xs text-[13px] leading-relaxed text-muted">
            You have {prompts.length}. Save a few more and the shared-tag
            relationships between them will appear as a connected map here.
          </p>
        </div>
      </div>
    );
  }

  const activeEdgeSet = new Set<number>();
  if (hoverId) {
    graph.edges.forEach((edge, i) => {
      if (edge.source === hoverId || edge.target === hoverId) {
        activeEdgeSet.add(i);
      }
    });
  }

  const activeNodeSet = new Set<string>();
  if (hoverId) {
    activeNodeSet.add(hoverId);
    for (const edge of graph.edges) {
      if (edge.source === hoverId) activeNodeSet.add(edge.target);
      if (edge.target === hoverId) activeNodeSet.add(edge.source);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line-soft px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
              Relationship graph
            </p>
            <h3 className="mt-0.5 text-[14px] font-medium text-ink">
              {graph.nodes.length} prompts · {graph.edges.length} shared-tag connections
            </h3>
          </div>
          <p className="text-[11px] text-faint">Hover a prompt to highlight its ties</p>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <svg
          viewBox="0 0 1 1"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={`Relationship graph of ${graph.nodes.length} prompts`}
        >
          {/* Edges under nodes */}
          <g>
            {graph.edges.map((edge, i) => {
              const src = graph.nodes.find((n) => n.id === edge.source)!;
              const tgt = graph.nodes.find((n) => n.id === edge.target)!;
              const isActive = activeEdgeSet.has(i);
              const dimmed = hoverId && !isActive;
              const strength = graph.maxWeight
                ? edge.weight / graph.maxWeight
                : 0.5;
              const opacity = dimmed ? 0.05 : 0.15 + strength * 0.55;
              // Curve control point pulls toward center for readability
              const mx = (src.x + tgt.x) / 2;
              const my = (src.y + tgt.y) / 2;
              const cx = mx + (0.5 - mx) * 0.35;
              const cy = my + (0.5 - my) * 0.35;
              return (
                <motion.path
                  key={`${edge.source}-${edge.target}`}
                  d={`M ${src.x} ${src.y} Q ${cx} ${cy} ${tgt.x} ${tgt.y}`}
                  fill="none"
                  stroke={isActive ? "var(--color-accent)" : "var(--color-line)"}
                  strokeWidth={isActive ? 0.004 : 0.0025}
                  strokeLinecap="round"
                  animate={{ opacity }}
                  transition={{
                    duration: reduce ? 0 : 0.25,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {graph.nodes.map((node) => (
              <NodeMark
                key={node.id}
                node={node}
                highlighted={activeNodeSet.has(node.id)}
                dimmed={Boolean(hoverId && !activeNodeSet.has(node.id))}
                onHover={setHoverId}
                onSelect={() => selectPrompt(node.id)}
                reduce={reduce}
              />
            ))}
          </g>
        </svg>

        {/* Legend */}
        <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line-soft bg-surface/80 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-faint">
            Categories
          </span>
          {Object.entries(CATEGORY_HUE).map(([cat, hue]) => {
            const label = categories.find((c) => c.id === cat)?.label ?? cat;
            const count = graph.nodes.filter((n) => n.category === cat).length;
            if (count === 0) return null;
            return (
              <span
                key={cat}
                className="flex items-center gap-1.5 text-[10.5px] text-muted"
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    background: `hsl(${hue} 65% 55%)`,
                  }}
                />
                {label}
                <span className="font-mono tabular-nums text-faint">({count})</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NodeMark({
  node,
  highlighted,
  dimmed,
  onHover,
  onSelect,
  reduce,
}: {
  node: GraphNode;
  highlighted: boolean;
  dimmed: boolean;
  onHover: (id: string | null) => void;
  onSelect: () => void;
  reduce: boolean | null;
}) {
  const hue = CATEGORY_HUE[node.category as PromptCategory] ?? 60;
  const r = 0.008 + Math.min(node.degree, 12) * 0.0015;
  const opacity = dimmed ? 0.25 : 1;
  const color = `hsl(${hue} 65% 55%)`;
  const glow = highlighted ? `hsl(${hue} 85% 65%)` : color;
  return (
    <g
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={node.title}
      className="cursor-pointer focus:outline-none"
      style={{ opacity }}
    >
      {highlighted && (
        <motion.circle
          cx={node.x}
          cy={node.y}
          r={r * 3}
          fill={glow}
          opacity={0.15}
          initial={reduce ? false : { scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
      <circle
        cx={node.x}
        cy={node.y}
        r={r}
        fill={color}
        stroke={highlighted ? glow : "transparent"}
        strokeWidth={0.002}
      />
      {node.pinned && (
        <circle
          cx={node.x}
          cy={node.y}
          r={r + 0.005}
          fill="none"
          stroke={glow}
          strokeWidth={0.001}
          strokeDasharray="0.002 0.003"
        />
      )}
      {highlighted && (
        <text
          x={node.x}
          y={node.y - r * 1.6}
          textAnchor="middle"
          fontSize={0.017}
          fill="var(--color-ink)"
          fontFamily="var(--font-sans)"
          fontWeight={600}
        >
          {trimTitle(node.title)}
        </text>
      )}
    </g>
  );
}

function trimTitle(t: string): string {
  return t.length > 26 ? `${t.slice(0, 25)}…` : t;
}

/** Toggle chip pair for switching Grid ↔ Graph. */
export function VaultViewToggle({
  view,
  onChange,
}: {
  view: "grid" | "graph";
  onChange: (next: "grid" | "graph") => void;
}) {
  return (
    <div
      className="inline-flex items-center gap-0 rounded-full border border-line bg-bg p-0.5"
      role="group"
      aria-label="Vault view"
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={view === "grid"}
        className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
          view === "grid"
            ? "bg-surface-2 text-ink"
            : "text-muted hover:text-ink"
        }`}
      >
        <Sparkle weight="fill" className="size-3" />
        Grid
      </button>
      <button
        type="button"
        onClick={() => onChange("graph")}
        aria-pressed={view === "graph"}
        className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
          view === "graph"
            ? "bg-surface-2 text-ink"
            : "text-muted hover:text-ink"
        }`}
      >
        <GraphIcon className="size-3" weight="bold" />
        Graph
      </button>
    </div>
  );
}
