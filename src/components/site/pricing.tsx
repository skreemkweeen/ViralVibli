import { tiers } from "@/lib/content";
import { Reveal } from "@/components/ui/reveal";
import { MaskText } from "@/components/ui/mask-text";
import { Button } from "@/components/ui/button";
import { Check } from "@phosphor-icons/react/dist/ssr";

export function Pricing() {
  return (
    <section id="pricing" className="py-28 md:py-36">
      <div className="mx-auto max-w-[1180px] px-5">
        <div className="max-w-2xl">
          <MaskText className="display text-[clamp(2.2rem,5vw,3.6rem)]">
            Start free. Grow into it.
          </MaskText>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted">
              One subscription instead of a dozen. Cancel anytime, keep
              everything you have made.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {tiers.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <div
                className={`flex h-full flex-col rounded-[var(--radius-card)] border p-7 ${
                  t.featured
                    ? "border-accent/40 bg-gradient-to-b from-accent/[0.07] to-surface"
                    : "border-line bg-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[17px] font-medium text-ink">{t.name}</h3>
                  {t.featured && (
                    <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-ink">
                      Most popular
                    </span>
                  )}
                </div>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="display text-[3rem] text-ink">{t.price}</span>
                  <span className="text-[14px] text-faint">{t.cadence}</span>
                </div>
                <p className="mt-3 min-h-[44px] text-[14px] leading-relaxed text-muted">
                  {t.summary}
                </p>

                <Button
                  href="#"
                  variant={t.featured ? "primary" : "ghost"}
                  className="mt-6 w-full"
                >
                  {t.cta}
                </Button>

                <ul className="mt-7 space-y-3 border-t border-line-soft pt-7">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        weight="bold"
                        className="mt-0.5 size-4 shrink-0 text-accent"
                      />
                      <span className="text-[14px] leading-snug text-muted">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
