import type { ComponentProps, ReactNode } from "react";

type Padding = "none" | "sm" | "md" | "lg";

const paddings: Record<Padding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  padding = "md",
  as: Tag = "div",
  className = "",
  children,
  ...rest
}: {
  padding?: Padding;
  as?: "div" | "section" | "article" | "aside";
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<"div">, "className" | "children">) {
  return (
    <Tag
      className={`rounded-2xl border border-line bg-surface ${paddings[padding]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
