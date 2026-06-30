"use client";

import { useState, useMemo, type ReactNode } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";

export function StudioResultGrid({
  children,
  items,
  filterFn,
  emptyState,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
}: {
  /** Pre-rendered card nodes, one per item. */
  children: ReactNode[];
  /** Parallel array of items to drive the filter. */
  items: unknown[];
  /** Given the filter query and an item, return true to include. */
  filterFn?: (query: string, item: unknown) => boolean;
  /** Shown when the grid is empty (after filter). */
  emptyState?: ReactNode;
  columns?: string;
}) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    if (!filterFn || !query.trim()) return children;
    return children.filter((_, i) => filterFn(query.trim().toLowerCase(), items[i]));
  }, [query, children, items, filterFn]);

  return (
    <div className="flex flex-col gap-4">
      {filterFn && (
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input
            type="search"
            placeholder="Filter concepts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-faint focus:border-faint focus:outline-none"
          />
        </div>
      )}

      {visible.length === 0 ? (
        emptyState ?? null
      ) : (
        <div className={`grid gap-4 ${columns}`}>{visible}</div>
      )}
    </div>
  );
}
