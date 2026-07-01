import { describe, expect, it } from "vitest";
import { COMMANDS, COMMANDS_BY_ID, matchCommand } from "./commands";

describe("commands registry", () => {
  it("has stable, unique ids", () => {
    const ids = COMMANDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^cmd\.[a-z0-9-]+\.[a-z0-9-]+$/);
    }
  });

  it("indexes every command by id", () => {
    for (const c of COMMANDS) {
      expect(COMMANDS_BY_ID.get(c.id)).toBe(c);
    }
  });

  it("covers every group", () => {
    const groups = new Set(COMMANDS.map((c) => c.group));
    expect(groups).toContain("create");
    expect(groups).toContain("navigate");
    expect(groups).toContain("workspace");
    expect(groups).toContain("search");
    expect(groups).toContain("system");
  });
});

describe("matchCommand", () => {
  const caption = COMMANDS.find((c) => c.id === "cmd.create.caption")!;
  const dashboard = COMMANDS.find((c) => c.id === "cmd.nav.dashboard")!;

  it("returns 1 (pass-through) when the query is empty", () => {
    expect(matchCommand(caption, "")).toBe(1);
  });

  it("matches a keyword whole-word hit", () => {
    expect(matchCommand(caption, "caption")).toBeGreaterThan(0);
  });

  it("scores prefix matches on title higher than substring", () => {
    const prefix = matchCommand(dashboard, "go to");
    const sub = matchCommand(dashboard, "dash");
    expect(prefix).toBeGreaterThanOrEqual(sub);
  });

  it("returns 0 for a totally unrelated query", () => {
    expect(matchCommand(caption, "zzzzz")).toBe(0);
  });

  it("supports subsequence fallback for typos", () => {
    // "cptn" is a subsequence of "caption"
    expect(matchCommand(caption, "cptn")).toBeGreaterThan(0);
  });
});
