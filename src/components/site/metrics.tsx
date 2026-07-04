import { Reveal } from "@/components/ui/reveal";

const stats = [
  { value: "12", label: "studios in one workspace" },
  { value: "10k", label: "prompts in the Vault" },
  { value: "8", label: "platforms, each tuned" },
  { value: "1", label: "brand brain behind it all" },
];

export function Metrics() {
  return (
    <section className="border-y border-line-soft py-20">
      <div className="mx-auto max-w-[1180px] px-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div className="border-l border-line pl-5">
                <div className="display text-[clamp(2.8rem,6vw,4.5rem)] text-ink">
                  {s.value}
                </div>
                <div className="mt-2 text-[14px] leading-snug text-muted">
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
