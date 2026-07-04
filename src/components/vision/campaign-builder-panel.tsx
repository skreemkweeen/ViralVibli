"use client";

/**
 * Campaign Builder modal — pick a recipe (Full launch / Social burst /
 * Product debut / Seasonal / Rebrand / Sample plate), preview the shot
 * counts, and materialise the plan. Below the recipe grid lives the
 * live list of built campaigns with a dependency-graph diagram so the
 * creator can see which shots feed which downstream shots.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { GitBranch, Sparkle, Trash, X } from "@phosphor-icons/react";
import { useVision } from "@/lib/vision/vision-store";
import {
  CAMPAIGN_RECIPES,
  type CampaignPlan,
} from "@/lib/vision/campaign-plans";
import type { Shot } from "@/lib/vision/shots";

export function CampaignBuilderPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { campaigns, createCampaign, removeCampaign } = useVision();
  const reduce = useReducedMotion();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (!selectedPlan && campaigns[0]) setSelectedPlan(campaigns[0].id);
  }, [open, campaigns, selectedPlan]);

  const active =
    campaigns.find((p) => p.id === selectedPlan) ?? campaigns[0] ?? null;

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
            aria-label="Close Campaign Builder"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Campaign Builder"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[1120px] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <div className="mb-1 inline-flex items-center gap-2">
                  <Sparkle className="size-4 text-accent-fg" weight="fill" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                    Campaign
                  </p>
                </div>
                <h2 className="text-[18px] font-semibold text-ink">
                  Campaign Builder
                </h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  Expand one brief into a full production schedule with a
                  dependency graph.
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

            {/* Recipe grid */}
            <div className="border-b border-line bg-bg/40 px-6 py-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-faint">
                Recipes
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {CAMPAIGN_RECIPES.map((r) => {
                  const total = r.items.reduce((n, i) => n + i.count, 0);
                  return (
                    <div
                      key={r.id}
                      className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 transition-colors hover:border-faint"
                    >
                      <div className="flex items-baseline justify-between">
                        <p className="text-[13px] font-semibold text-ink">
                          {r.label}
                        </p>
                        <span className="text-[10px] uppercase tracking-widest text-faint">
                          {total} shots
                        </span>
                      </div>
                      <p className="text-[11.5px] leading-relaxed text-muted">
                        {r.hint}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const id = createCampaign(r.id);
                          if (id) setSelectedPlan(id);
                        }}
                        aria-label={`Build ${r.label}`}
                        className="mt-1 inline-flex cursor-pointer items-center justify-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-[12px] font-medium text-ink transition-colors hover:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        Build campaign
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Built plans + graph */}
            <div className="grid gap-4 px-6 py-5 lg:grid-cols-[260px_minmax(0,1fr)]">
              {/* Plans list */}
              <aside className="min-h-0">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-faint">
                  Built campaigns
                </p>
                {campaigns.length === 0 ? (
                  <p className="text-[12px] text-faint">None yet — pick a recipe above.</p>
                ) : (
                  <ul className="grid gap-1">
                    {campaigns.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedPlan(p.id)}
                          aria-current={p.id === active?.id ? "true" : undefined}
                          className={`flex w-full items-baseline justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                            p.id === active?.id
                              ? "border-accent/60 bg-accent/[0.06]"
                              : "border-line bg-surface hover:border-faint"
                          }`}
                        >
                          <span className="truncate text-[12.5px] text-ink">
                            {p.label}
                          </span>
                          <span className="shrink-0 text-[10px] uppercase tracking-widest text-faint">
                            {p.shots.length} shots
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </aside>

              {/* Dependency diagram */}
              <section className="min-h-0">
                {!active ? (
                  <div className="flex h-full min-h-[240px] items-center justify-center rounded-xl border border-dashed border-line bg-bg text-[12px] text-muted">
                    Build a campaign to see its dependency graph.
                  </div>
                ) : (
                  <>
                    <div className="mb-2 flex items-baseline justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                        Dependency graph — {active.label}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete campaign "${active.label}"?`))
                            removeCampaign(active.id);
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        <Trash className="size-3" weight="bold" />
                        Delete
                      </button>
                    </div>
                    <CampaignGraph plan={active} />
                  </>
                )}
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Dependency graph diagram ─────────────────────────────────────────────

function CampaignGraph({ plan }: { plan: CampaignPlan }) {
  const { positions, size } = useMemo(
    () => layoutCampaign(plan.shots, plan.edges),
    [plan.shots, plan.edges],
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-bg p-3">
      <svg
        viewBox={`0 0 ${size.width} ${size.height}`}
        className="text-ink"
        style={{
          minWidth: `${Math.max(size.width, 400)}px`,
          height: `${size.height}px`,
        }}
      >
        {/* Edges */}
        {plan.edges.map((e, i) => {
          const from = positions[e.from];
          const to = positions[e.to];
          if (!from || !to) return null;
          return (
            <path
              key={`${e.from}->${e.to}-${i}`}
              d={`M ${from.x} ${from.y + 12} C ${from.x} ${
                from.y + 40
              }, ${to.x} ${to.y - 40}, ${to.x} ${to.y - 12}`}
              className="fill-none stroke-accent"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
          );
        })}
        {/* Nodes */}
        {plan.shots.map((s) => {
          const p = positions[s.id];
          if (!p) return null;
          return (
            <g key={s.id}>
              <rect
                x={p.x - 60}
                y={p.y - 12}
                width="120"
                height="24"
                rx="12"
                className="fill-surface stroke-line"
              />
              <circle cx={p.x - 46} cy={p.y} r="3" className="fill-accent" />
              <text
                x={p.x - 36}
                y={p.y + 3}
                className="fill-current text-[10px]"
              >
                {s.name.length > 14 ? s.name.slice(0, 14) + "…" : s.name}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-faint">
        <GitBranch className="size-3" />
        Every downstream shot is derived from its parent's approved take.
      </div>
    </div>
  );
}

function layoutCampaign(
  shots: Shot[],
  edges: { from: string; to: string }[],
) {
  const V_SPACING = 60;
  const H_SPACING = 130;
  const PADDING_X = 80;
  const PADDING_Y = 30;

  // Compute depth via topological levels — root = no incoming edge.
  const parents: Record<string, string[]> = {};
  for (const e of edges) {
    (parents[e.to] ??= []).push(e.from);
  }
  const depth: Record<string, number> = {};
  for (const s of shots) {
    depth[s.id] = 0;
  }
  // Repeatedly propagate max(parent.depth + 1)
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 32) {
    changed = false;
    for (const s of shots) {
      const parentDepths = (parents[s.id] ?? []).map((p) => depth[p] ?? 0);
      const next = parentDepths.length ? Math.max(...parentDepths) + 1 : 0;
      if (next !== depth[s.id]) {
        depth[s.id] = next;
        changed = true;
      }
    }
  }

  // Group by depth
  const byDepth: Record<number, Shot[]> = {};
  let maxDepth = 0;
  for (const s of shots) {
    const d = depth[s.id] ?? 0;
    (byDepth[d] ??= []).push(s);
    if (d > maxDepth) maxDepth = d;
  }

  const positions: Record<string, { x: number; y: number }> = {};
  let maxRowWidth = 0;
  for (let d = 0; d <= maxDepth; d++) {
    const row = byDepth[d] ?? [];
    row.forEach((s, i) => {
      const x = PADDING_X + i * H_SPACING;
      const y = PADDING_Y + d * V_SPACING;
      positions[s.id] = { x, y };
    });
    maxRowWidth = Math.max(maxRowWidth, row.length * H_SPACING);
  }

  return {
    positions,
    size: {
      width: maxRowWidth + PADDING_X * 2,
      height: (maxDepth + 1) * V_SPACING + PADDING_Y * 2,
    },
  };
}
