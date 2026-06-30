"use client";

import type { Option } from "@/lib/vision/data";

/**
 * Selectable chips. Single-select; clicking the active chip clears it when
 * `clearable`. Keyboard-operable (native buttons), with a clear focus ring.
 */
export function ChipGroup({
  options,
  value,
  onChange,
  clearable = true,
  size = "md",
}: {
  options: Option[];
  value: string | null;
  onChange: (id: string | null) => void;
  clearable?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active && clearable ? null : o.id)}
            title={o.detail}
            className={`rounded-lg border text-left transition-colors ${
              size === "sm" ? "px-2.5 py-1 text-[12.5px]" : "px-3 py-1.5 text-[13px]"
            } ${
              active
                ? "border-accent/50 bg-accent/[0.10] text-ink"
                : "border-line bg-bg text-muted hover:border-faint hover:text-ink"
            }`}
          >
            <span className="font-medium">{o.label}</span>
            {o.detail && size === "md" && (
              <span className="ml-1.5 text-faint">{o.detail}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
