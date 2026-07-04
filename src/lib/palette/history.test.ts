import { describe, expect, it } from "vitest";
import {
  EMPTY_HISTORY,
  isPinned,
  mostUsedIds,
  recentIds,
  recordUse,
  togglePin,
} from "./history";

describe("palette history", () => {
  it("records a use, moving id to the front of recent and incrementing count", () => {
    const h = recordUse(EMPTY_HISTORY, "cmd.a");
    expect(h.recent[0]).toBe("cmd.a");
    expect(h.counts["cmd.a"]).toBe(1);
  });

  it("deduplicates recent (bringing an existing id to the front)", () => {
    let h = recordUse(EMPTY_HISTORY, "cmd.a");
    h = recordUse(h, "cmd.b");
    h = recordUse(h, "cmd.a");
    expect(h.recent).toEqual(["cmd.a", "cmd.b"]);
    expect(h.counts).toEqual({ "cmd.a": 2, "cmd.b": 1 });
  });

  it("caps recent at 24 entries", () => {
    let h = EMPTY_HISTORY;
    for (let i = 0; i < 40; i++) h = recordUse(h, `cmd.${i}`);
    expect(h.recent).toHaveLength(24);
    expect(h.recent[0]).toBe("cmd.39");
  });

  it("toggles a pin on and off", () => {
    let h = togglePin(EMPTY_HISTORY, "cmd.a");
    expect(isPinned(h, "cmd.a")).toBe(true);
    h = togglePin(h, "cmd.a");
    expect(isPinned(h, "cmd.a")).toBe(false);
  });

  it("caps pins at 12", () => {
    let h = EMPTY_HISTORY;
    for (let i = 0; i < 20; i++) h = togglePin(h, `cmd.${i}`);
    expect(h.pinned).toHaveLength(12);
    expect(h.pinned[0]).toBe("cmd.19");
  });

  it("ranks most-used by count, ties broken by recency", () => {
    let h = EMPTY_HISTORY;
    h = recordUse(h, "cmd.a");
    h = recordUse(h, "cmd.a");
    h = recordUse(h, "cmd.b");
    h = recordUse(h, "cmd.b");
    h = recordUse(h, "cmd.c");
    // b was used more recently than a among tied counts of 2
    expect(mostUsedIds(h, 3)).toEqual(["cmd.b", "cmd.a", "cmd.c"]);
  });

  it("returns recent ids capped by limit", () => {
    let h = EMPTY_HISTORY;
    for (let i = 0; i < 6; i++) h = recordUse(h, `cmd.${i}`);
    expect(recentIds(h, 3)).toEqual(["cmd.5", "cmd.4", "cmd.3"]);
  });

  it("no-op on empty command id", () => {
    const h = recordUse(EMPTY_HISTORY, "");
    expect(h).toBe(EMPTY_HISTORY);
    const h2 = togglePin(EMPTY_HISTORY, "");
    expect(h2).toBe(EMPTY_HISTORY);
  });
});
