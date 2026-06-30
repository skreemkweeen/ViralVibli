"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { ProductPreview } from "./product-preview";

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const previewY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);
  const previewRotate = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 2]);

  const enter = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, delay, ease },
        };

  return (
    <section
      id="top"
      ref={ref}
      className="relative flex min-h-[100dvh] items-center overflow-hidden pb-16 pt-28 md:pt-24"
    >
      {/* ambient lighting: one soft lime bloom, low opacity, not neon */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-1/4 right-[-10%] size-[640px] rounded-full opacity-[0.14] blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, var(--color-accent) 0%, transparent 65%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          background:
            "radial-gradient(1200px 600px at 70% 10%, rgba(255,255,255,0.035), transparent 70%)",
        }}
      />

      <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-14 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        {/* left: message */}
        <div className="max-w-xl">
          <h1 className="display text-[clamp(3.2rem,9vw,6.2rem)]">
            {["Create. Grow.", "Monetize."].map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  className={`block ${i === 1 ? "text-accent" : ""}`}
                  initial={reduce ? false : { y: "115%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.95, delay: 0.05 + i * 0.12, ease }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            className="mt-7 max-w-md text-[17px] leading-relaxed text-muted"
            {...enter(0.32)}
          >
            Everything creators need in one workspace. An AI that knows your
            brand, across every platform you post on.
          </motion.p>

          <motion.div
            className="mt-9 flex flex-wrap items-center gap-3"
            {...enter(0.44)}
          >
            <Magnetic>
              <Button href="#pricing">Start free</Button>
            </Magnetic>
            <Button href="#studios" variant="ghost">
              See it in motion
            </Button>
          </motion.div>
        </div>

        {/* right: real workspace, floating.
            Outer wrapper owns the scroll parallax (y/rotate MotionValues);
            inner wrapper owns the entrance, so the two never fight over the
            same transform property. */}
        <motion.div style={{ y: previewY, rotate: previewRotate }} className="relative">
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.3, ease }}
          >
            <ProductPreview />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
