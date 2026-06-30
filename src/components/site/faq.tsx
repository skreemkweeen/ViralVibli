"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus } from "@phosphor-icons/react";
import { faqs } from "@/lib/content";
import { MaskText } from "@/components/ui/mask-text";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <section id="faq" className="py-28 md:py-36">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-12 px-5 lg:grid-cols-[0.8fr_1.2fr]">
        <MaskText className="display text-[clamp(2.2rem,5vw,3.6rem)]">
          Questions, answered.
        </MaskText>

        <div className="divide-y divide-line border-y border-line">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className="text-[17px] font-medium text-ink">
                    {f.q}
                  </span>
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full border border-line transition-transform duration-300 ${
                      isOpen ? "rotate-45 border-accent bg-accent text-accent-ink" : "text-muted"
                    }`}
                  >
                    <Plus weight="bold" className="size-4" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduce ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-xl pb-6 text-[15px] leading-relaxed text-muted">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
