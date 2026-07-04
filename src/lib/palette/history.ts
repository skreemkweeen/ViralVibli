/**
 * Palette history: recently executed commands, pins, usage counters.
 *
 * Pure state helpers with no side effects — the React layer is responsible
 * for serialising to localStorage. Keeping it pure lets the whole ranking
 * logic run in tests without a jsdom or fake timers.
 */

export type PaletteHistory = {
  /** LRU list of command ids, most recent first. Capped at 24. */
  recent: string[];
  /** Explicit user pins, most recent pin first. */
  pinned: string[];
  /** Command id → number of executions. */
  counts: Record<string, number>;
};

export const EMPTY_HISTORY: PaletteHistory = {
  recent: [],
  pinned: [],
  counts: {},
};

const RECENT_CAP = 24;
const PINNED_CAP = 12;

export function recordUse(
  history: PaletteHistory,
  commandId: string,
): PaletteHistory {
  if (!commandId) return history;
  const nextRecent = [
    commandId,
    ...history.recent.filter((id) => id !== commandId),
  ].slice(0, RECENT_CAP);
  const nextCounts = { ...history.counts };
  nextCounts[commandId] = (nextCounts[commandId] ?? 0) + 1;
  return { ...history, recent: nextRecent, counts: nextCounts };
}

export function togglePin(
  history: PaletteHistory,
  commandId: string,
): PaletteHistory {
  if (!commandId) return history;
  const isPinned = history.pinned.includes(commandId);
  const nextPinned = isPinned
    ? history.pinned.filter((id) => id !== commandId)
    : [commandId, ...history.pinned].slice(0, PINNED_CAP);
  return { ...history, pinned: nextPinned };
}

export function isPinned(history: PaletteHistory, commandId: string): boolean {
  return history.pinned.includes(commandId);
}

/**
 * Return command ids sorted by usage count, descending. Ties broken by recency.
 */
export function mostUsedIds(
  history: PaletteHistory,
  limit: number,
): string[] {
  const entries = Object.entries(history.counts).filter(([, n]) => n > 0);
  const recentIndex = new Map<string, number>();
  history.recent.forEach((id, i) => recentIndex.set(id, i));
  entries.sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    const ra = recentIndex.get(a[0]) ?? 1_000;
    const rb = recentIndex.get(b[0]) ?? 1_000;
    return ra - rb;
  });
  return entries.slice(0, limit).map(([id]) => id);
}

export function recentIds(history: PaletteHistory, limit: number): string[] {
  return history.recent.slice(0, limit);
}
