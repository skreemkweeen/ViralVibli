"use client";

import type { ComponentProps, ReactNode } from "react";
import { forwardRef, useId } from "react";

const inputBase =
  "w-full rounded-xl border border-line bg-bg px-3.5 text-[14px] text-ink placeholder:text-faint transition-colors focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50";

/** Standard 44px+ single-line input. Always pair with <Label>. */
export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  function Input({ className = "", type = "text", ...rest }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={`h-11 ${inputBase} ${className}`}
        {...rest}
      />
    );
  },
);

/** Multi-line input. Auto-shrinks below md height for compact panels. */
export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(
  function Textarea({ className = "", rows = 3, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`resize-none py-2.5 ${inputBase} ${className}`}
        {...rest}
      />
    );
  },
);

/** Semantic form group: renders label + control + optional hint/error. */
export function Field({
  label,
  hint,
  error,
  optional,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: (id: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const hintId = hint || error ? `${id}-hint` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[12px] text-faint">
        {label}
        {optional && <span className="ml-1 text-faint/60">(optional)</span>}
      </label>
      {children({
        id,
        "aria-describedby": hintId,
        "aria-invalid": error ? true : undefined,
      })}
      {(hint || error) && (
        <p
          id={hintId}
          className={`text-[11.5px] ${error ? "text-red-400" : "text-faint"}`}
          role={error ? "alert" : undefined}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
