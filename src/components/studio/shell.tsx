import type { ReactNode } from "react";

/**
 * Two-pane studio layout: fixed-width controls panel on the left,
 * scrollable canvas area on the right.
 */
export function StudioShell({
  controls,
  canvas,
}: {
  controls: ReactNode;
  canvas: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Controls panel */}
      <aside className="flex h-full w-72 shrink-0 flex-col overflow-y-auto border-r border-line bg-surface lg:w-80">
        {controls}
      </aside>

      {/* Canvas / results area */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-bg">
        {canvas}
      </main>
    </div>
  );
}
