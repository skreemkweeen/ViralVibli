import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";

export function Cta() {
  return (
    <section className="relative overflow-hidden py-32 md:py-44">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 size-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.16] blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, var(--color-accent) 0%, transparent 65%)",
        }}
      />
      <div className="relative mx-auto max-w-[1180px] px-5 text-center">
        <Reveal>
          <h2 className="display mx-auto max-w-4xl text-balance text-[clamp(2.6rem,7vw,5.4rem)]">
            Your whole studio, finally in one place.
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-7 max-w-md text-[17px] leading-relaxed text-muted">
            Join the creators building, growing, and earning without the
            tab-switching tax.
          </p>
        </Reveal>
        <Reveal delay={0.22}>
          <div className="mt-10 flex justify-center">
            <Magnetic strength={0.5}>
              <Button href="/sign-in" className="h-14 px-9 text-[16px]">
                Start free
              </Button>
            </Magnetic>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
