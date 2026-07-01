/**
 * Shared types for the command palette runtime.
 *
 * The palette treats every user-facing operation as a `PaletteCommand`. Some
 * commands run directly (jump routes, toggle theme, create a project). Others
 * push a chained plan — a sequence of steps the palette resumes across pages.
 *
 * Deliberately no React or router types here — this module is imported by
 * pure engines that must stay testable.
 */

export type CommandKind =
  | "action" // fires a side effect (create, save, open dock, …)
  | "route" // navigates without executing anything
  | "search" // opens a listing/search view
  | "chain"; // pushes a multi-step plan

export type CommandGroup =
  | "chain" // a multi-step chain currently in flight
  | "route" // NL routing intents
  | "pinned" // user-pinned commands
  | "action" // quick actions (create, save, …)
  | "recent" // recently executed
  | "most-used" // usage-count top items
  | "search" // global search results
  | "navigate" // straightforward module nav
  | "settings"
  | "ai"; // ask AI fallback

export type SearchHit = {
  kind: "project" | "prompt" | "story" | "concept" | "activity" | "moodboard";
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
  score: number;
  raw?: unknown; // for the preview panel
};

/**
 * A step in a multi-step plan. The palette resumes plans on page load and
 * across studio jumps until the queue is empty. Chain steps intentionally
 * carry a `commandId` OR an `href` — never mutable closures — so the plan
 * survives serialisation to localStorage.
 */
export type ChainStep = {
  id: string;
  title: string;
  hint: string;
  /** Command to dispatch by id when this step is executed. */
  commandId?: string;
  /** Or: navigate here and drop a prefill for the target studio. */
  href?: string;
  prefill?: { key: string; value: string };
};

export type Chain = {
  id: string;
  label: string;
  createdAt: number;
  steps: ChainStep[];
  cursor: number; // index of the current step
};
