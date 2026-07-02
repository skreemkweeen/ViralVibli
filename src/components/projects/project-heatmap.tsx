"use client";

/**
 * Creative timeline heatmap — GitHub-style density grid rendered inline.
 *
 * Fed by the pure `buildHeatmap` helper, so the component is a thin
 * presentational layer. Tooltip on hover reads the date + count. Cells
 * animate opacity in on mount so the grid draws rather than pops.
 */

import { motion, useReducedMotion } from "motion/react";
import type { Heatmap } from "@/lib/projects/heatmap";

const WEEKDAYS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

export function ProjectHeatmap({ heatmap }: { heatmap: Heatmap }) {
  const reduce = useReducedMotion();

  if (heatmap.total === 0) return null;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
            Creative timeline
          </p>
          <h3 className="mt-1 text-[13px] font-semibold text-ink">
            {heatmap.total} events over {heatmap.weeks} weeks
          </h3>
        </div>
        <Legend max={heatmap.max} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <div className="flex flex-col justify-between py-[2px] text-[10px] text-faint">
          {WEEKDAYS.map((d, i) => (
            <span key={i} className="h-3 leading-3">{d}</span>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateRows: "repeat(7, 12px)", gridAutoFlow: "column", gridAutoColumns: "12px", gap: 3 }}>
          {heatmap.cells.map((row, r) =>
            row.map((cell, c) => (
              <motion.button
                key={cell.date}
                type="button"
                title={`${cell.date} · ${cell.count} event${cell.count === 1 ? "" : "s"}`}
                aria-label={`${cell.date}: ${cell.count} events`}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: reduce ? 0 : 0.35,
                  delay: reduce ? 0 : (r * heatmap.weeks + c) * 0.004,
                  ease: "easeOut",
                }}
                className={`rounded-[3px] transition-colors ${cellClass(cell.intensity, cell.count)}`}
                aria-current={cell.count > 0 ? "true" : undefined}
              />
            )),
          )}
        </div>
      </div>
    </section>
  );
}

function cellClass(intensity: number, count: number): string {
  if (count === 0) return "bg-line/40 hover:bg-line";
  if (intensity <= 0.25) return "bg-accent/25 hover:bg-accent/40";
  if (intensity <= 0.5) return "bg-accent/50 hover:bg-accent/70";
  if (intensity <= 0.75) return "bg-accent/75 hover:bg-accent/90";
  return "bg-accent hover:bg-accent";
}

function Legend({ max }: { max: number }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-faint">
      <span>Less</span>
      <span className="size-2.5 rounded-[3px] bg-line/40" />
      <span className="size-2.5 rounded-[3px] bg-accent/25" />
      <span className="size-2.5 rounded-[3px] bg-accent/50" />
      <span className="size-2.5 rounded-[3px] bg-accent/75" />
      <span className="size-2.5 rounded-[3px] bg-accent" />
      <span>More · max {max}</span>
    </div>
  );
}
