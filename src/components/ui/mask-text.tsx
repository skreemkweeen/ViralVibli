"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode, ElementType } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Heading that rises into view from behind a mask line. Premium scroll-reveal
 * for section titles. Collapses to static under reduced motion. Descender
 * clearance preserved via padding on the clip wrapper.
 */
export function MaskText({
  children,
  className = "",
  as: Tag = "h2",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <Tag className={className}>
      <span className="block overflow-hidden pb-[0.12em]">
        <motion.span
          className="block"
          initial={reduce ? false : { y: "115%" }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.85, delay, ease }}
        >
          {children}
        </motion.span>
      </span>
    </Tag>
  );
}
