"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import type { ReactNode } from "react";

/**
 * Card with a cursor-following lime spotlight on its border and surface.
 * Uses motion values (no per-frame React renders). The glow is a hover
 * affordance, so it stays even under reduced motion (no movement involved).
 */
export function SpotlightCard({
  children,
  className = "",
  radius = 320,
}: {
  children: ReactNode;
  className?: string;
  radius?: number;
}) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(-radius);
  const my = useMotionValue(-radius);

  const surface = useMotionTemplate`radial-gradient(${radius}px circle at ${mx}px ${my}px, rgba(200,240,78,0.08), transparent 65%)`;
  const border = useMotionTemplate`radial-gradient(${radius}px circle at ${mx}px ${my}px, rgba(200,240,78,0.55), transparent 60%)`;

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  }

  return (
    <div
      onMouseMove={onMove}
      className={`group relative rounded-[var(--radius-card)] ${className}`}
    >
      {children}
      {/* inner surface sheen (over content, very low opacity) */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: surface }}
      />
      {/* lit border ring, revealed via mask to the 1px edge only */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: border,
          padding: 1,
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
    </div>
  );
}
