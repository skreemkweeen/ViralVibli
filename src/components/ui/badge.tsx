import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "warning" | "danger" | "success";

const tones: Record<Tone, string> = {
  neutral: "border-line bg-transparent text-faint",
  accent: "border-accent/40 bg-accent/[0.08] text-accent-fg",
  warning: "border-amber-500/30 bg-amber-500/[0.06] text-amber-300",
  danger: "border-red-500/30 bg-red-500/[0.06] text-red-400",
  success: "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300",
};

export function Badge({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium tabular-nums leading-none ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
