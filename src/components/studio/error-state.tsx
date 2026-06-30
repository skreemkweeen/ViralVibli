"use client";

import { WarningCircle, X } from "@phosphor-icons/react";

export function StudioErrorState({
  message,
  hint,
  onDismiss,
}: {
  message: string;
  hint?: string;
  onDismiss?: () => void;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4"
    >
      <WarningCircle className="mt-0.5 size-4 shrink-0 text-red-400" weight="fill" />
      <div className="flex-1 space-y-1">
        <p className="text-[13px] font-medium text-red-300">{message}</p>
        {hint && (
          <p className="text-[12px] leading-relaxed text-red-400/70">{hint}</p>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="shrink-0 text-red-400/60 transition-colors hover:text-red-300"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
