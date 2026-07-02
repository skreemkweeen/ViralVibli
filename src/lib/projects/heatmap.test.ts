import { describe, expect, it } from "vitest";
import { buildHeatmap } from "./heatmap";

const DAY = 24 * 60 * 60 * 1000;
// Anchor: 2026-07-02 (Thu). Monday of that week = 2026-06-29.
const NOW = new Date(2026, 6, 2, 12, 0, 0).getTime();

describe("buildHeatmap", () => {
  it("produces a 7 × weeks grid", () => {
    const h = buildHeatmap([], "p1", 12, NOW);
    expect(h.cells).toHaveLength(7);
    expect(h.cells[0]).toHaveLength(12);
    expect(h.weeks).toBe(12);
    expect(h.max).toBe(0);
    expect(h.total).toBe(0);
  });

  it("filters activity to the target project when items are tagged", () => {
    const activity = [
      { createdAt: NOW - 1 * DAY, projectId: "p1" },
      { createdAt: NOW - 1 * DAY, projectId: "p2" },
    ];
    const h = buildHeatmap(activity, "p1", 4, NOW);
    expect(h.total).toBe(1);
  });

  it("includes untagged activity as belonging to the project (legacy path)", () => {
    const activity = [{ createdAt: NOW - 1 * DAY }, { createdAt: NOW - 2 * DAY }];
    const h = buildHeatmap(activity, "p1", 4, NOW);
    expect(h.total).toBe(2);
  });

  it("computes intensity relative to the max cell", () => {
    const activity = [
      { createdAt: NOW - 1 * DAY, projectId: "p1" },
      { createdAt: NOW - 1 * DAY, projectId: "p1" },
      { createdAt: NOW - 2 * DAY, projectId: "p1" },
    ];
    const h = buildHeatmap(activity, "p1", 4, NOW);
    expect(h.max).toBe(2);
    const cellWithMax = h.cells
      .flatMap((row) => row)
      .find((c) => c.count === 2);
    expect(cellWithMax?.intensity).toBe(1);
    const cellWithOne = h.cells
      .flatMap((row) => row)
      .find((c) => c.count === 1);
    expect(cellWithOne?.intensity).toBe(0.5);
  });

  it("ignores activity outside the window", () => {
    const activity = [
      { createdAt: NOW - 100 * DAY, projectId: "p1" },
    ];
    const h = buildHeatmap(activity, "p1", 4, NOW);
    expect(h.total).toBe(0);
  });

  it("dates cells with ISO YYYY-MM-DD strings", () => {
    const h = buildHeatmap([], "p1", 4, NOW);
    for (const row of h.cells) {
      for (const cell of row) {
        expect(cell.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});
