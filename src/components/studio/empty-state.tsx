import type { ReactNode } from "react";

export function StudioEmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      {icon && (
        <div className="grid size-14 place-items-center rounded-2xl border border-line bg-surface-2 text-faint">
          {icon}
        </div>
      )}
      <div className="space-y-1.5">
        <p className="text-[14px] font-medium text-ink">{title}</p>
        {body && (
          <p className="max-w-xs text-[13px] leading-relaxed text-muted">{body}</p>
        )}
      </div>
      {action}
    </div>
  );
}
