import { modules } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { MaskText } from "@/components/ui/mask-text";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

// index → column span (sums to 12 per row; 12 cells, no empties).
// Full class strings so Tailwind can statically detect them.
const spanClass = [
  "lg:col-span-7 sm:col-span-2",
  "lg:col-span-5",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-7 sm:col-span-2",
  "lg:col-span-5",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-5",
  "lg:col-span-7 sm:col-span-2",
];
const wide = [0, 5, 11];

export function Modules() {
  return (
    <section id="modules" className="relative py-28 md:py-36">
      <div className="mx-auto max-w-[1180px] px-5">
        <div className="max-w-2xl">
          <MaskText className="display text-[clamp(2.2rem,5vw,3.6rem)]">
            One workspace. Every part of the job.
          </MaskText>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted">
              Twelve studios that used to be twelve subscriptions. They share
              one brain, so everything you make stays on brand.
            </p>
          </Reveal>
        </div>

        <RevealGroup className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          {modules.map((m, i) => {
            const Icon = m.icon;
            const feature = i === 0 || i === 5 || i === 11;
            const isWide = wide.includes(i);
            return (
              <RevealItem key={m.name} className={spanClass[i]}>
                <SpotlightCard className="h-full">
                <article
                  className={`group relative flex h-full min-h-[180px] flex-col justify-between overflow-hidden rounded-[var(--radius-card)] border border-line p-6 transition-colors duration-300 hover:border-faint ${
                    i === 0
                      ? "bg-gradient-to-br from-accent/[0.10] to-surface"
                      : "bg-surface"
                  }`}
                >
                  {i === 5 && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full opacity-25 blur-[80px]"
                      style={{ background: "var(--color-accent)" }}
                    />
                  )}
                  <div className="relative flex items-start justify-between">
                    <span
                      className={`grid size-10 place-items-center rounded-xl border border-line-soft ${
                        feature ? "bg-accent text-accent-ink" : "bg-bg text-accent"
                      }`}
                    >
                      <Icon weight={feature ? "fill" : "regular"} className="size-5" />
                    </span>
                    <ArrowUpRight
                      weight="bold"
                      className="size-4 text-faint opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-muted group-hover:opacity-100"
                    />
                  </div>
                  <div className="relative mt-6">
                    <h3 className="text-[18px] font-medium tracking-[-0.01em] text-ink">
                      {m.name}
                    </h3>
                    <p
                      className={`mt-2 text-[14px] leading-relaxed text-muted ${
                        isWide ? "max-w-md" : ""
                      }`}
                    >
                      {m.blurb}
                    </p>
                  </div>
                </article>
                </SpotlightCard>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
