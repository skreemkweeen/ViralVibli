import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";

type Variant = "primary" | "ghost" | "subtle" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[transform,background-color,border-color,color,opacity] duration-200 active:scale-[0.98] active:translate-y-px disabled:pointer-events-none disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  // lime on near-black ink: WCAG AA large/UI safe, brand-locked accent
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  ghost:
    "border border-line text-ink hover:border-faint hover:bg-surface",
  subtle:
    "text-muted hover:text-ink hover:bg-surface-2",
  danger:
    "border border-red-500/40 text-red-400 hover:bg-red-500/[0.08]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-[14px]",
  lg: "h-12 px-7 text-[15px]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  loading?: boolean;
  children: ReactNode;
};

type LinkButtonProps = CommonProps & {
  href: string;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;

type NativeButtonProps = CommonProps & {
  href?: undefined;
} & Omit<ComponentProps<"button">, "className" | "children">;

export function Button(props: LinkButtonProps | NativeButtonProps) {
  const {
    variant = "primary",
    size = "md",
    className = "",
    loading = false,
    children,
    ...rest
  } = props;

  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  const content = (
    <>
      {loading && (
        <CircleNotch
          className="size-4 animate-spin"
          weight="bold"
          aria-hidden="true"
        />
      )}
      <span className={loading ? "opacity-90" : undefined}>{children}</span>
    </>
  );

  if ("href" in props && props.href !== undefined) {
    const { href, ...linkRest } = rest as Omit<LinkButtonProps, keyof CommonProps>;
    return (
      <Link href={href} className={classes} {...linkRest}>
        {content}
      </Link>
    );
  }

  const buttonRest = rest as Omit<NativeButtonProps, keyof CommonProps>;
  return (
    <button
      type="button"
      className={classes}
      aria-busy={loading || undefined}
      disabled={loading || buttonRest.disabled}
      {...buttonRest}
    >
      {content}
    </button>
  );
}
