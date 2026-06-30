import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[15px] font-medium transition-[transform,background-color,border-color,color] duration-200 active:scale-[0.98] active:translate-y-px focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2";

const variants: Record<Variant, string> = {
  // lime on near-black ink: WCAG AA large/UI safe, brand-locked accent
  primary:
    "bg-accent text-accent-ink px-6 h-12 hover:bg-[#d6f56b] shadow-[0_0_0_1px_rgba(200,240,78,0.0)]",
  ghost:
    "border border-line text-ink px-6 h-12 hover:border-faint hover:bg-surface",
};

export function Button({
  href,
  variant = "primary",
  className = "",
  children,
  ...rest
}: {
  href: string;
  variant?: Variant;
} & Omit<ComponentProps<typeof Link>, "href">) {
  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
