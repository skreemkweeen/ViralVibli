/**
 * Command registry — the single source of truth for palette actions.
 *
 * Every user-facing operation the palette can perform lives here. The palette
 * runtime consumes the registry to render lists, feed the fuzzy matcher,
 * label recent/pinned sections, and dispatch execution.
 *
 * Design principles:
 *  - Commands are declarative data (id + metadata) plus a single `run`
 *    function that takes a `CommandContext`. Runtime concerns (router,
 *    workspace, closers) enter through context so the module has no React
 *    or Next dependency.
 *  - Every command must round-trip through the LRU history and pinning
 *    system, so an id must be stable across renders.
 *  - Commands returning a Chain push a multi-step plan; the palette layer
 *    handles chain persistence.
 */

import type { ReactNode } from "react";
import type { Chain } from "./types";
import type { ProjectIntelligenceSummary } from "@/hooks/use-project-intelligence";

export type StudioSlug =
  | "vision"
  | "story"
  | "vault"
  | "projects"
  | "assistant"
  | "settings";

export type CommandContext = {
  navigate: (href: string) => void;
  setPrefill: (studio: StudioSlug, value: string) => void;
  openAIDock: (opts: { prefill?: string; autoSend?: boolean }) => void;
  pushChain: (chain: Chain) => void;
  setTheme: (mode: "dark" | "light") => void;
  clearActivity: () => void;
  duplicateActiveProject: () => void;
  closePalette: () => void;
  /**
   * The project currently in focus. Project-aware commands short-circuit
   * when this is null and get filtered out of the palette instead of
   * silently misfiring.
   */
  activeProject: { id: string; name: string; description?: string } | null;
  /**
   * Deterministic intelligence for the active project — completion %,
   * missing deliverables, duplicates, reuse, next step, etc. Commands
   * that reason about health read from here instead of re-deriving.
   */
  projectIntelligence: ProjectIntelligenceSummary | null;
};

export type CommandGroupKey =
  | "create"
  | "navigate"
  | "workspace"
  | "search"
  | "system"
  | "project";

export type PaletteCommand = {
  id: string;
  title: string;
  subtitle?: string;
  keywords: string[];
  group: CommandGroupKey;
  icon?: ReactNode; // supplied by the palette shell
  shortcut?: string[]; // ["G", "V"] shows as `G V`
  /** When true, the palette only surfaces this command while a project is
   * active. Prevents dead options like "Summarize this project" when there's
   * no project to summarize. */
  requiresProject?: boolean;
  run: (ctx: CommandContext) => void;
};

/**
 * Data-only descriptor — icons + palette-side wiring get attached in the
 * React layer via `attachIcons()` so this module stays SSR/pure.
 */
export const COMMANDS: PaletteCommand[] = [
  // ─── Create ───────────────────────────────────────────────────────────
  {
    id: "cmd.create.caption",
    title: "New caption",
    subtitle: "Draft in Story Studio",
    keywords: ["caption", "post", "hook", "story", "create", "generate"],
    group: "create",
    shortcut: ["G", "C"],
    run: (ctx) => {
      ctx.navigate("/story");
      ctx.closePalette();
    },
  },
  {
    id: "cmd.create.campaign",
    title: "New campaign",
    subtitle: "Plan a multi-slide launch in Story Studio",
    keywords: ["campaign", "launch", "series", "plan", "create"],
    group: "create",
    shortcut: ["G", "L"],
    run: (ctx) => {
      ctx.setPrefill("story", "campaign");
      ctx.navigate("/story");
      ctx.closePalette();
    },
  },
  {
    id: "cmd.create.image",
    title: "New image",
    subtitle: "Compose a brief in Vision Studio",
    keywords: ["image", "photo", "shot", "vision", "compose", "generate"],
    group: "create",
    shortcut: ["G", "I"],
    run: (ctx) => {
      ctx.navigate("/vision");
      ctx.closePalette();
    },
  },
  {
    id: "cmd.create.moodboard",
    title: "New moodboard reference",
    subtitle: "Open Vision moodboard",
    keywords: ["moodboard", "reference", "inspiration", "pin"],
    group: "create",
    shortcut: ["G", "M"],
    run: (ctx) => {
      ctx.navigate("/vision?moodboard=1");
      ctx.closePalette();
    },
  },
  {
    id: "cmd.create.prompt",
    title: "New prompt",
    subtitle: "Save to Prompt Vault",
    keywords: ["prompt", "vault", "save", "template", "create"],
    group: "create",
    shortcut: ["G", "P"],
    run: (ctx) => {
      ctx.navigate("/vault?new=1");
      ctx.closePalette();
    },
  },
  {
    id: "cmd.create.project",
    title: "New project",
    subtitle: "Group stories, prompts, assets",
    keywords: ["project", "workspace", "folder", "create"],
    group: "create",
    shortcut: ["G", "N"],
    run: (ctx) => {
      ctx.navigate("/projects?new=1");
      ctx.closePalette();
    },
  },

  // ─── Search ──────────────────────────────────────────────────────────
  {
    id: "cmd.search.prompts",
    title: "Search prompts",
    subtitle: "Filter the vault",
    keywords: ["search", "find", "prompt", "vault"],
    group: "search",
    run: (ctx) => {
      ctx.navigate("/vault");
      ctx.closePalette();
    },
  },
  {
    id: "cmd.search.stories",
    title: "Search stories",
    subtitle: "Browse Story history",
    keywords: ["search", "find", "story", "history"],
    group: "search",
    run: (ctx) => {
      ctx.navigate("/story");
      ctx.closePalette();
    },
  },
  {
    id: "cmd.search.images",
    title: "Search images",
    subtitle: "Browse Vision concepts",
    keywords: ["search", "find", "image", "concept", "vision"],
    group: "search",
    run: (ctx) => {
      ctx.navigate("/vision");
      ctx.closePalette();
    },
  },

  // ─── Navigate ────────────────────────────────────────────────────────
  {
    id: "cmd.nav.dashboard",
    title: "Go to Dashboard",
    keywords: ["dashboard", "home", "overview"],
    group: "navigate",
    shortcut: ["G", "D"],
    run: (ctx) => {
      ctx.navigate("/dashboard");
      ctx.closePalette();
    },
  },
  {
    id: "cmd.nav.projects",
    title: "Go to Projects",
    keywords: ["projects", "workspace"],
    group: "navigate",
    run: (ctx) => {
      ctx.navigate("/projects");
      ctx.closePalette();
    },
  },
  {
    id: "cmd.nav.story",
    title: "Go to Story Studio",
    keywords: ["story", "studio", "captions", "sequence"],
    group: "navigate",
    run: (ctx) => {
      ctx.navigate("/story");
      ctx.closePalette();
    },
  },
  {
    id: "cmd.nav.vision",
    title: "Go to Vision Studio",
    keywords: ["vision", "studio", "image", "photo"],
    group: "navigate",
    run: (ctx) => {
      ctx.navigate("/vision");
      ctx.closePalette();
    },
  },
  {
    id: "cmd.nav.vault",
    title: "Go to Prompt Vault",
    keywords: ["vault", "prompt", "library"],
    group: "navigate",
    run: (ctx) => {
      ctx.navigate("/vault");
      ctx.closePalette();
    },
  },
  {
    id: "cmd.nav.assistant",
    title: "Go to AI Assistant",
    keywords: ["assistant", "chat", "ai"],
    group: "navigate",
    run: (ctx) => {
      ctx.navigate("/assistant");
      ctx.closePalette();
    },
  },

  // ─── Workspace ───────────────────────────────────────────────────────
  {
    id: "cmd.ws.ai-dock",
    title: "Ask AI Dock",
    subtitle: "Open the inline AI panel · ⌘J",
    keywords: ["ai", "dock", "assistant", "ask"],
    group: "workspace",
    run: (ctx) => {
      ctx.openAIDock({});
      ctx.closePalette();
    },
  },
  {
    id: "cmd.ws.duplicate-project",
    title: "Duplicate current project",
    keywords: ["duplicate", "copy", "project", "clone"],
    group: "workspace",
    run: (ctx) => {
      ctx.duplicateActiveProject();
      ctx.closePalette();
    },
  },
  {
    id: "cmd.ws.clear-activity",
    title: "Clear activity feed",
    subtitle: "Reset workspace history",
    keywords: ["clear", "activity", "history", "reset"],
    group: "workspace",
    run: (ctx) => {
      ctx.clearActivity();
      ctx.closePalette();
    },
  },

  // ─── Project (only shown when a project is active) ──────────────────
  {
    id: "cmd.project.open",
    title: "Open current project",
    subtitle: "Jump to the active Project Workspace",
    keywords: ["project", "workspace", "open", "goto"],
    group: "project",
    requiresProject: true,
    run: (ctx) => {
      if (!ctx.activeProject) return;
      ctx.navigate(`/projects/${ctx.activeProject.id}`);
      ctx.closePalette();
    },
  },
  {
    id: "cmd.project.timeline",
    title: "Show project timeline",
    subtitle: "Every event scoped to this project",
    keywords: ["timeline", "history", "activity", "project"],
    group: "project",
    requiresProject: true,
    run: (ctx) => {
      if (!ctx.activeProject) return;
      ctx.navigate(`/projects/${ctx.activeProject.id}?tab=timeline`);
      ctx.closePalette();
    },
  },
  {
    id: "cmd.project.graph",
    title: "Show project graph",
    subtitle: "See relationships across every asset",
    keywords: ["graph", "map", "relationships", "project"],
    group: "project",
    requiresProject: true,
    run: (ctx) => {
      if (!ctx.activeProject) return;
      ctx.navigate(`/projects/${ctx.activeProject.id}?tab=graph`);
      ctx.closePalette();
    },
  },
  {
    id: "cmd.project.summarize",
    title: "Summarize this project",
    subtitle: "Ask AI what's been made and what's missing",
    keywords: ["summarize", "recap", "review", "project"],
    group: "project",
    requiresProject: true,
    run: (ctx) => {
      if (!ctx.activeProject) return;
      ctx.openAIDock({
        prefill: `Summarise the “${ctx.activeProject.name}” project so far. What's the shape, what's missing, and what's a strong next asset to make?`,
        autoSend: true,
      });
      ctx.closePalette();
    },
  },
  {
    id: "cmd.project.next-deliverable",
    title: "Generate next deliverable",
    subtitle: "Ask AI to propose the highest-leverage next asset",
    keywords: ["next", "propose", "suggest", "deliverable", "project"],
    group: "project",
    requiresProject: true,
    run: (ctx) => {
      if (!ctx.activeProject) return;
      ctx.openAIDock({
        prefill: `Given the project “${ctx.activeProject.name}”, propose the single most valuable next asset to create. Be specific about type, medium, and brief.`,
        autoSend: true,
      });
      ctx.closePalette();
    },
  },
  {
    id: "cmd.project.find-unused",
    title: "Find unused assets",
    subtitle: "Prompts and images this project hasn't shipped",
    keywords: ["unused", "orphan", "reuse", "project"],
    group: "project",
    requiresProject: true,
    run: (ctx) => {
      if (!ctx.activeProject) return;
      ctx.openAIDock({
        prefill: `Look at project “${ctx.activeProject.name}” and identify any unused prompts or images that could be repurposed.`,
        autoSend: true,
      });
      ctx.closePalette();
    },
  },

  // ─── Project Intelligence — deterministic health-driven commands.
  //     Every one of these reads from the shared ProjectIntelligenceSummary
  //     so the numbers match whatever the workspace UI is showing.
  {
    id: "cmd.project.health.explain",
    title: "Explain project health",
    subtitle: "Why the completion % + creative score are what they are",
    keywords: ["health", "completion", "score", "explain", "why", "status"],
    group: "project",
    requiresProject: true,
    run: (ctx) => {
      const p = ctx.activeProject;
      const pi = ctx.projectIntelligence;
      if (!p) return;
      const nums = pi
        ? `Current numbers: ${pi.completion}% completion, ${pi.score} creative score, momentum ${pi.momentum.trend} (${pi.momentum.recent} vs ${pi.momentum.prior}).`
        : "";
      ctx.openAIDock({
        prefill:
          `Walk me through the health of “${p.name}”. Explain what's driving completion, creative score, and momentum. Point to specific missing pieces, duplicate assets, or reuse opportunities. Keep it grounded in the numbers.\n\n${nums}`.trim(),
        autoSend: true,
      });
      ctx.closePalette();
    },
  },
  {
    id: "cmd.project.health.missing",
    title: "Show missing deliverables",
    subtitle: "Baseline gaps to close before shipping",
    keywords: ["missing", "gap", "deliverable", "baseline", "todo"],
    group: "project",
    requiresProject: true,
    run: (ctx) => {
      const p = ctx.activeProject;
      const pi = ctx.projectIntelligence;
      if (!p) return;
      const list =
        pi && pi.missing.length > 0
          ? pi.missing.map((m) => `- ${m.message}`).join("\n")
          : "- (Baseline is already covered — suggest 3 stretch deliverables instead)";
      ctx.openAIDock({
        prefill:
          `For “${p.name}”, here are the baseline gaps I need to close:\n${list}\n\nFor each gap, suggest one concrete next asset to make (concept, brief, and platform). If the baseline is covered, propose 3 strong stretch deliverables.`,
        autoSend: true,
      });
      ctx.closePalette();
    },
  },
  {
    id: "cmd.project.health.duplicates",
    title: "Show duplicate prompts",
    subtitle: "Vault entries that overlap ≥65%",
    keywords: ["duplicate", "dedupe", "merge", "prompt", "vault"],
    group: "project",
    requiresProject: true,
    run: (ctx) => {
      const p = ctx.activeProject;
      const pi = ctx.projectIntelligence;
      if (!p) return;
      const list =
        pi && pi.duplicates.length > 0
          ? pi.duplicates
              .map(
                (d) =>
                  `- "${d.a}" ↔ "${d.b}" (${Math.round(d.overlap * 100)}% overlap)`,
              )
              .join("\n")
          : "- (No duplicates over 65% overlap. Great.)";
      ctx.openAIDock({
        prefill:
          `In “${p.name}”, these prompt pairs are duplicates:\n${list}\n\nProduce one canonical merged prompt for each pair, keeping the strongest phrasing from both. If there are no duplicates, tell me and suggest what to Vault next.`,
        autoSend: true,
      });
      ctx.closePalette();
    },
  },
  {
    id: "cmd.project.health.reuse",
    title: "Show reuse opportunities",
    subtitle: "Vault entries that share 35–65% of tokens",
    keywords: ["reuse", "similar", "prompt", "consolidate"],
    group: "project",
    requiresProject: true,
    run: (ctx) => {
      const p = ctx.activeProject;
      const pi = ctx.projectIntelligence;
      if (!p) return;
      const list =
        pi && pi.reuse.length > 0
          ? pi.reuse
              .map(
                (r) =>
                  `- "${r.a}" ↔ "${r.b}" (${Math.round(r.overlap * 100)}% overlap)`,
              )
              .join("\n")
          : "- (Nothing overlaps enough to consolidate right now.)";
      ctx.openAIDock({
        prefill:
          `In “${p.name}”, these prompt pairs are close enough to share a block:\n${list}\n\nFor each pair, propose one shared block that could be reused, plus a differentiator sentence per prompt. If there's nothing to share, tell me.`,
        autoSend: true,
      });
      ctx.closePalette();
    },
  },
  {
    id: "cmd.project.health.improve-score",
    title: "Improve creative score",
    subtitle: "AI-picked plays to raise the score",
    keywords: ["score", "improve", "raise", "quality"],
    group: "project",
    requiresProject: true,
    run: (ctx) => {
      const p = ctx.activeProject;
      const pi = ctx.projectIntelligence;
      if (!p) return;
      const state = pi
        ? `Current: ${pi.completion}% complete, score ${pi.score}, momentum ${pi.momentum.trend}. Missing: ${pi.missing.map((m) => m.kind).join(", ") || "nothing"}. Duplicates: ${pi.duplicates.length}. Unused prompts: ${pi.unused.prompts.length}. Unused images: ${pi.unused.images.length}.`
        : "";
      ctx.openAIDock({
        prefill:
          `For “${p.name}”, give me 3 concrete plays I can run this week to raise the creative score. Each should be small enough to finish in under an hour and target a specific weakness.\n\n${state}`.trim(),
        autoSend: true,
      });
      ctx.closePalette();
    },
  },
  {
    id: "cmd.project.health.blockers",
    title: "Find blockers",
    subtitle: "What's actually stopping progress",
    keywords: ["blocker", "stuck", "problem", "issue", "friction"],
    group: "project",
    requiresProject: true,
    run: (ctx) => {
      const p = ctx.activeProject;
      const pi = ctx.projectIntelligence;
      if (!p) return;
      const state = pi
        ? `Signals: momentum is ${pi.momentum.trend} (${pi.momentum.recent} this week vs ${pi.momentum.prior} last). Missing: ${pi.missing.map((m) => m.message).join("; ") || "none"}. Duplicates: ${pi.duplicates.length}. Warnings: ${pi.recommendations.filter((r) => r.severity === "warning").length}.`
        : "";
      ctx.openAIDock({
        prefill:
          `In “${p.name}”, what's blocking progress right now? Reason from the signals below and name the single most important friction to remove first.\n\n${state}`.trim(),
        autoSend: true,
      });
      ctx.closePalette();
    },
  },
  {
    id: "cmd.project.health.generate-next",
    title: "Generate next deliverable",
    subtitle: "Rule-picked next step, then AI expands it into a brief",
    keywords: ["next", "generate", "brief", "produce", "deliverable"],
    group: "project",
    requiresProject: true,
    run: (ctx) => {
      const p = ctx.activeProject;
      const pi = ctx.projectIntelligence;
      if (!p) return;
      const step = pi?.nextStep ?? "the next logical asset";
      ctx.openAIDock({
        prefill:
          `The rule-picked next step for “${p.name}” is: ${step}\n\nExpand it into a full brief I can execute — objective, deliverable, platform, tone, and a 3-bullet outline. Reference existing assets when relevant.`,
        autoSend: true,
      });
      ctx.closePalette();
    },
  },

  // ─── System ──────────────────────────────────────────────────────────
  {
    id: "cmd.sys.settings",
    title: "Open Settings",
    keywords: ["settings", "preferences", "config"],
    group: "system",
    shortcut: ["G", "S"],
    run: (ctx) => {
      ctx.navigate("/settings");
      ctx.closePalette();
    },
  },
  {
    id: "cmd.sys.theme-dark",
    title: "Switch to dark theme",
    keywords: ["theme", "dark", "night"],
    group: "system",
    run: (ctx) => {
      ctx.setTheme("dark");
      ctx.closePalette();
    },
  },
  {
    id: "cmd.sys.theme-light",
    title: "Switch to light theme",
    keywords: ["theme", "light", "day"],
    group: "system",
    run: (ctx) => {
      ctx.setTheme("light");
      ctx.closePalette();
    },
  },
];

export const COMMANDS_BY_ID = new Map(COMMANDS.map((c) => [c.id, c]));

/**
 * Fuzzy match a command against a query. Score = max(title, subtitle,
 * keywords). 0 means no match. The palette layer uses this to filter the
 * registry when the input is non-empty.
 */
export function matchCommand(command: PaletteCommand, q: string): number {
  const query = q.toLowerCase().trim();
  if (!query) return 1; // any is fine when the input is empty
  const haystacks = [
    command.title.toLowerCase(),
    command.subtitle?.toLowerCase() ?? "",
    command.keywords.join(" ").toLowerCase(),
  ];
  let best = 0;
  for (const h of haystacks) {
    if (h === query) best = Math.max(best, 100);
    else if (h.startsWith(query)) best = Math.max(best, 80);
    else if (h.includes(query)) best = Math.max(best, 55);
  }
  if (best === 0) {
    // subsequence
    for (const h of haystacks) {
      let qi = 0;
      for (let i = 0; i < h.length && qi < query.length; i++) {
        if (h[i] === query[qi]) qi++;
      }
      if (qi === query.length) return 20;
    }
  }
  return best;
}
