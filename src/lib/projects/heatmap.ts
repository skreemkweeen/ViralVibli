/**
 * Creative Timeline Heatmap.
 *
 * Turn a project's activity into a GitHub-style grid: rows = weekday
 * (Mon..Sun), columns = weeks going backwards from now. Each cell holds
 * the count of activity events attributable to that day.
 *
 * Pure — the UI just consumes a matrix + max value.
 */

export type HeatmapCell = {
  /** ISO date string (YYYY-MM-DD) — deterministic anchor for keys. */
  date: string;
  /** Milliseconds at start-of-day for the cell. */
  ts: number;
  count: number;
  /** 0..1 relative to the max cell — used for opacity/color intensity. */
  intensity: number;
};

export type Heatmap = {
  /** Row-major grid: 7 rows (Mon..Sun), N columns (oldest → newest). */
  cells: HeatmapCell[][];
  weeks: number;
  max: number;
  total: number;
};

export type ActivityLike = {
  createdAt?: number;
  projectId?: string;
};

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Given an activity list and a target project id, produce a `weeks`-wide
 * heatmap ending on the current day (inclusive).
 *
 * Ordering conventions:
 *  - Rows are Mon..Sun (index 0 = Monday) for the Gregorian workweek feel.
 *  - Columns run oldest → newest so a scanline reads left-to-right in time.
 */
export function buildHeatmap(
  activity: ActivityLike[],
  projectId: string,
  weeks: number = 12,
  now: number = Date.now(),
): Heatmap {
  const todayStart = startOfDay(now);
  // Anchor to the Monday of this week.
  const dayOfWeek = new Date(todayStart).getDay(); // 0 = Sun ... 6 = Sat
  const monOffset = (dayOfWeek + 6) % 7; // days back to Monday
  const thisMonday = todayStart - monOffset * DAY;
  const firstMonday = thisMonday - (weeks - 1) * 7 * DAY;

  // Bucket activity into day counts.
  const dayCounts = new Map<number, number>();
  for (const a of activity) {
    if (!a.createdAt) continue;
    if (a.projectId && a.projectId !== projectId) continue;
    if (a.createdAt < firstMonday) continue;
    if (a.createdAt > now) continue;
    const key = startOfDay(a.createdAt);
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }

  let max = 0;
  let total = 0;
  const cells: HeatmapCell[][] = [];
  for (let row = 0; row < 7; row++) {
    const rowCells: HeatmapCell[] = [];
    for (let col = 0; col < weeks; col++) {
      const ts = firstMonday + col * 7 * DAY + row * DAY;
      const count = dayCounts.get(ts) ?? 0;
      if (count > max) max = count;
      total += count;
      rowCells.push({
        date: toISO(ts),
        ts,
        count,
        intensity: 0, // filled after we know max
      });
    }
    cells.push(rowCells);
  }
  if (max > 0) {
    for (const row of cells) {
      for (const cell of row) {
        cell.intensity = cell.count / max;
      }
    }
  }
  return { cells, weeks, max, total };
}

function toISO(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
