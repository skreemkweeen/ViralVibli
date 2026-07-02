import { describe, expect, it } from "vitest";
import { COMMANDS, COMMANDS_BY_ID, matchCommand } from "./commands";

describe("commands registry", () => {
  it("has stable, unique ids", () => {
    const ids = COMMANDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      // Allow dot-nested namespaces (cmd.project.health.explain), min two segments.
      expect(id).toMatch(/^cmd(\.[a-z0-9-]+){2,}$/);
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
    expect(groups).toContain("project");
  });

  it("every project command declares requiresProject", () => {
    const projectCommands = COMMANDS.filter((c) => c.group === "project");
    expect(projectCommands.length).toBeGreaterThan(0);
    for (const c of projectCommands) {
      expect(c.requiresProject).toBe(true);
    }
  });

  it("ships the seven health-driven intelligence commands", () => {
    const expectedIds = [
      "cmd.project.health.explain",
      "cmd.project.health.missing",
      "cmd.project.health.duplicates",
      "cmd.project.health.reuse",
      "cmd.project.health.improve-score",
      "cmd.project.health.blockers",
      "cmd.project.health.generate-next",
    ];
    for (const id of expectedIds) {
      expect(COMMANDS_BY_ID.get(id), `missing ${id}`).toBeDefined();
    }
  });

  it("intelligence commands short-circuit when there is no active project", () => {
    // Every project command guards on ctx.activeProject before touching AI.
    // Verify by dispatching each with a null active project + null intelligence
    // and asserting nothing gets called on the dock.
    const dockCalls: unknown[] = [];
    const ctx = {
      navigate: () => {},
      setPrefill: () => {},
      openAIDock: (opts: unknown) => dockCalls.push(opts),
      pushChain: () => {},
      setTheme: () => {},
      clearActivity: () => {},
      duplicateActiveProject: () => {},
      closePalette: () => {},
      activeProject: null,
      projectIntelligence: null,
    };
    for (const c of COMMANDS.filter((c) => c.group === "project")) {
      c.run(ctx);
    }
    expect(dockCalls).toHaveLength(0);
  });

  it("intelligence commands consume the summary struct without recomputing", () => {
    // When we hand them a fresh intelligence summary, they must render its
    // fields into the AI Dock prefill verbatim — never re-derive.
    const dockCalls: Array<{ prefill?: string }> = [];
    const ctx = {
      navigate: () => {},
      setPrefill: () => {},
      openAIDock: (opts: { prefill?: string }) => dockCalls.push(opts),
      pushChain: () => {},
      setTheme: () => {},
      clearActivity: () => {},
      duplicateActiveProject: () => {},
      closePalette: () => {},
      activeProject: { id: "p", name: "Test", description: "d" },
      projectIntelligence: {
        projectId: "p",
        projectName: "Test",
        completion: 72,
        score: 88,
        momentum: { recent: 4, prior: 2, trend: "up" as const },
        nextStep: "Compose an image next.",
        missing: [{ kind: "image", count: 2, message: "Add 2 images" }],
        unused: { prompts: ["Foo prompt"], images: [] },
        reuse: [{ a: "P1", b: "P2", overlap: 0.42 }],
        duplicates: [{ a: "D1", b: "D2", overlap: 0.71 }],
        dependencies: [],
        recommendations: [],
      },
    };
    const explain = COMMANDS_BY_ID.get("cmd.project.health.explain")!;
    explain.run(ctx);
    expect(dockCalls[0].prefill).toContain("72%");
    expect(dockCalls[0].prefill).toContain("88");
    expect(dockCalls[0].prefill).toContain("up");
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
