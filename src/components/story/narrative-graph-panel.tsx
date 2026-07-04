"use client";

/**
 * Narrative graph — SVG hierarchy of campaigns → sequences → stories →
 * slides → assets / vision concepts.
 */

import { useEffect, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { GitBranch, X } from "@phosphor-icons/react";
import { useStory } from "@/lib/story/store";
import { nodesByDepth, type GraphNode } from "@/lib/story/narrative-graph";

const KIND_COLOR: Record<GraphNode["kind"], string> = {
  project: "fill-accent",
  brand: "fill-cyan-400",
  campaign: "fill-violet-400",
  sequence: "fill-pink-400",
  story: "fill-amber-400",
  slide: "fill-emerald-400",
  asset: "fill-line",
  vision: "fill-lime-400",
};

export function NarrativeGraphPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { narrativeGraph } = useStory();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const layout = useMemo(() => {
    const depths = nodesByDepth(narrativeGraph);
    const H_SPACING = 130;
    const V_SPACING = 90;
    const positions = new Map<string, { x: number; y: number }>();
    let maxRowWidth = 0;
    let maxDepth = 0;
    for (const depthStr of Object.keys(depths)) {
      const d = Number(depthStr);
      if (d > maxDepth) maxDepth = d;
      const row = depths[d]!;
      row.forEach((node, i) => {
        positions.set(node.id, {
          x: 80 + i * H_SPACING,
          y: 40 + d * V_SPACING,
        });
      });
      maxRowWidth = Math.max(maxRowWidth, row.length * H_SPACING);
    }
    return {
      positions,
      width: maxRowWidth + 160,
      height: (maxDepth + 1) * V_SPACING + 80,
    };
  }, [narrativeGraph]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto px-4 py-[6vh]"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            aria-label="Close narrative graph"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Narrative graph"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-[85vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <div className="mb-1 inline-flex items-center gap-2">
                  <GitBranch className="size-4 text-accent-fg" weight="fill" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">Graph</p>
                </div>
                <h2 className="text-[18px] font-semibold text-ink">Narrative Graph</h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  Project → brand → campaign → sequence → story → slide → asset / vision.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="cursor-pointer rounded-full p-1.5 text-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <X className="size-4" weight="bold" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-auto p-4">
              {narrativeGraph.nodes.length === 0 ? (
                <p className="text-[13px] text-muted">
                  Nothing to graph yet — build a campaign in the Campaigns panel.
                </p>
              ) : (
                <svg
                  viewBox={`0 0 ${layout.width} ${layout.height}`}
                  className="text-ink"
                  style={{ minWidth: `${Math.max(layout.width, 480)}px`, height: `${layout.height}px` }}
                >
                  {/* Edges */}
                  {narrativeGraph.edges.map((e, i) => {
                    const from = layout.positions.get(e.from);
                    const to = layout.positions.get(e.to);
                    if (!from || !to) return null;
                    return (
                      <path
                        key={i}
                        d={`M ${from.x} ${from.y + 12} C ${from.x} ${from.y + 40}, ${to.x} ${to.y - 40}, ${to.x} ${to.y - 12}`}
                        className="fill-none stroke-accent"
                        strokeOpacity="0.35"
                      />
                    );
                  })}
                  {/* Nodes */}
                  {narrativeGraph.nodes.map((n) => {
                    const p = layout.positions.get(n.id);
                    if (!p) return null;
                    return (
                      <g key={n.id}>
                        <rect
                          x={p.x - 60}
                          y={p.y - 12}
                          width={120}
                          height={24}
                          rx={12}
                          className="fill-surface stroke-line"
                        />
                        <circle cx={p.x - 46} cy={p.y} r={3.5} className={KIND_COLOR[n.kind]} />
                        <text
                          x={p.x - 36}
                          y={p.y + 3}
                          className="fill-current text-[10px]"
                        >
                          {n.label.length > 15 ? `${n.label.slice(0, 15)}…` : n.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
