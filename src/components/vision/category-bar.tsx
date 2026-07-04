"use client";

import { useVision } from "@/lib/vision/vision-store";
import { categories } from "@/lib/vision/data";

export function CategoryBar() {
  const { direction, setField } = useVision();

  return (
    <div
      role="group"
      aria-label="Photography category"
      className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [mask-image:linear-gradient(90deg,#000_94%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {categories.map((c) => {
        const active = direction.category === c.id;
        return (
          <button
            key={c.id}
            onClick={() => setField("category", c.id)}
            aria-pressed={active}
            title={c.tagline}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
              active
                ? "border-accent bg-accent text-accent-ink font-medium"
                : "border-line bg-surface text-muted hover:border-faint hover:text-ink"
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
