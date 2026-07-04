import type { ComponentProps, ReactNode } from "react";

type Shape = "pill" | "rect";
type Size = "sm" | "md";

const shapes: Record<Shape, string> = {
  pill: "rounded-full",
  rect: "rounded-lg",
};

const sizes: Record<Size, string> = {
  sm: "px-2.5 py-1 text-[12px]",
  md: "px-3 py-1.5 text-[13px]",
};

const base =
  "cursor-pointer inline-flex items-center gap-1.5 border transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50";

const state = {
  active: "border-accent/50 bg-accent/[0.08] text-ink",
  inactive: "border-line bg-transparent text-muted hover:border-faint hover:text-ink",
} as const;

export function Chip({
  active = false,
  shape = "pill",
  size = "md",
  className = "",
  children,
  ...rest
}: {
  active?: boolean;
  shape?: Shape;
  size?: Size;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`${base} ${shapes[shape]} ${sizes[size]} ${active ? state.active : state.inactive} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
