/**
 * Multi-step palette chains.
 *
 * A `Chain` is an ordered plan the palette walks the creator through.
 * "Create a skincare launch campaign with matching product photos" becomes
 * a plan of two steps: draft the campaign in Story Studio, then compose
 * matching product shots in Vision Studio. Each step is fully serialisable
 * so the plan survives navigation and page reloads.
 *
 * The React layer persists the active chain in localStorage under
 * `vv-palette-chain`. Everything else lives here as pure transitions.
 */

import { routeIntents, type PaletteIntent } from "./route-intent";
import type { Chain, ChainStep } from "./types";

const CHAIN_KEY_PREFILL: Record<string, string> = {
  vision: "vv-vision-prefill",
  story: "vv-story-prefill",
  vault: "vv-vault-prefill",
  assistant: "vv-assistant-prefill",
};

/**
 * Build a plan from an NL query by combining all intents that survive
 * routing. Returns null when the query is not chain-shaped (fewer than
 * two distinct studios). Ordering follows creative pipeline: Story first
 * (concept), Vision second (imagery), Vault last (save).
 */
export function planChain(query: string): Chain | null {
  const raw = query.trim();
  if (!raw) return null;
  const intents = routeIntents(raw);
  const byStudio = new Map<string, PaletteIntent>();
  for (const intent of intents) {
    if (!byStudio.has(intent.studio)) byStudio.set(intent.studio, intent);
  }
  if (byStudio.size < 2) return null;

  const ORDER = ["story", "vision", "vault", "projects", "assistant"] as const;
  const steps: ChainStep[] = [];
  for (const studio of ORDER) {
    const intent = byStudio.get(studio);
    if (!intent) continue;
    const key = CHAIN_KEY_PREFILL[studio];
    steps.push({
      id: `${studio}-${steps.length}`,
      title: intent.label,
      hint: intent.subject
        ? `${intent.hint} — “${intent.subject}”`
        : intent.hint,
      href: intent.href,
      prefill:
        key && intent.subject ? { key, value: intent.subject } : undefined,
    });
  }
  if (steps.length < 2) return null;

  return {
    id: `chain-${Date.now().toString(36)}`,
    label: raw,
    createdAt: Date.now(),
    steps,
    cursor: 0,
  };
}

export function currentStep(chain: Chain | null): ChainStep | null {
  if (!chain) return null;
  return chain.steps[chain.cursor] ?? null;
}

export function nextStep(chain: Chain | null): ChainStep | null {
  if (!chain) return null;
  return chain.steps[chain.cursor + 1] ?? null;
}

/**
 * Advance a chain past the current step. Returns null when the plan is
 * complete so the caller can clear it.
 */
export function advanceChain(chain: Chain): Chain | null {
  const nextCursor = chain.cursor + 1;
  if (nextCursor >= chain.steps.length) return null;
  return { ...chain, cursor: nextCursor };
}

/**
 * Drop the current step without executing it. Used when the creator wants
 * to skip a suggested action but keep the rest of the plan.
 */
export function skipStep(chain: Chain): Chain | null {
  const nextSteps = chain.steps.filter((_, i) => i !== chain.cursor);
  if (nextSteps.length === 0) return null;
  const cursor = Math.min(chain.cursor, nextSteps.length - 1);
  return { ...chain, steps: nextSteps, cursor };
}

export function isChainComplete(chain: Chain | null): boolean {
  if (!chain) return true;
  return chain.cursor >= chain.steps.length;
}

export function chainProgress(chain: Chain | null): {
  index: number;
  total: number;
  percent: number;
} {
  if (!chain) return { index: 0, total: 0, percent: 0 };
  return {
    index: chain.cursor + 1,
    total: chain.steps.length,
    percent: Math.round(((chain.cursor + 1) / chain.steps.length) * 100),
  };
}
