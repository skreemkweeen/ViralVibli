import { testimonials } from "@/lib/content";
import { Reveal } from "@/components/ui/reveal";

export function Testimonials() {
  return (
    <section className="py-28 md:py-36">
      <div className="mx-auto max-w-[1180px] px-5">
        <Reveal className="max-w-2xl">
          <h2 className="display text-[clamp(2.2rem,5vw,3.6rem)]">
            Creators who stopped tab-switching.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <Reveal
              key={t.name}
              delay={(i % 2) * 0.1}
              className={i % 2 === 1 ? "md:mt-16" : ""}
            >
              <figure className="flex h-full flex-col justify-between rounded-[var(--radius-card)] border border-line bg-surface p-7">
                <blockquote className="text-[18px] leading-relaxed text-ink">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-7 flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface-2 font-mono text-[13px] font-medium text-accent"
                  >
                    {t.initials}
                  </span>
                  <div>
                    <div className="text-[14px] font-medium text-ink">
                      {t.name}
                    </div>
                    <div className="text-[13px] text-faint">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
