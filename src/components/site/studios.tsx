"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";
import { studios } from "@/lib/content";
import { MaskText } from "@/components/ui/mask-text";

gsap.registerPlugin(ScrollTrigger);

export function Studios() {
  const reduce = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce) return;
    const mm = gsap.matchMedia();
    // Pin + horizontal pan only on desktop. Mobile uses native scroll-snap.
    mm.add("(min-width: 1024px)", () => {
      if (!wrap.current || !track.current) return;
      const distance = track.current.scrollWidth - window.innerWidth;
      const tween = gsap.to(track.current, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top",
          end: () => `+=${distance}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });
    return () => mm.revert();
  }, [reduce]);

  return (
    <section id="studios" className="relative bg-bg py-28 md:py-0">
      {/* desktop: pinned horizontal pan. mobile: scroll-snap row. */}
      <div ref={wrap} className="lg:min-h-[100dvh] lg:overflow-hidden">
        <div className="mx-auto max-w-[1180px] px-5 pt-0 lg:pt-20">
          <MaskText className="display max-w-2xl text-[clamp(2.2rem,5vw,3.6rem)] lg:absolute lg:z-10">
            Made to be seen in motion.
          </MaskText>
        </div>

        <div
          ref={track}
          className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 lg:mt-0 lg:h-[100dvh] lg:items-center lg:overflow-visible lg:px-[max(2rem,calc((100vw-1180px)/2))] lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {studios.map((s) => {
            const Icon = s.icon;
            return (
            <article
              key={s.label}
              className="group relative flex w-[84vw] shrink-0 snap-center flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface sm:w-[420px] lg:h-[68vh] lg:w-[640px]"
            >
              <div
                className="relative h-44 overflow-hidden lg:h-1/2"
                style={{
                  background: `radial-gradient(120% 120% at 78% 18%, ${s.from} 0%, ${s.to} 70%)`,
                }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full opacity-20 blur-3xl"
                  style={{ background: "var(--color-accent)" }}
                />
                <Icon
                  weight="thin"
                  aria-hidden="true"
                  className="absolute -bottom-6 -right-4 size-44 text-ink/[0.06] transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
              </div>
              <div className="flex flex-1 flex-col justify-end p-7">
                <span className="text-[14px] font-medium text-accent">
                  {s.label}
                </span>
                <h3 className="mt-3 text-[clamp(1.5rem,3vw,2.1rem)] font-medium leading-tight tracking-[-0.02em] text-ink">
                  {s.title}
                </h3>
                <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">
                  {s.body}
                </p>
              </div>
            </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
