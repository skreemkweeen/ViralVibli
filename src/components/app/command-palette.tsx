"use client";

/**
 * ViralVibli Command Palette — the primary keyboard-first surface.
 *
 * Not a search box: a full palette. Layers:
 *  1. Chain queue — when a multi-step plan is in flight it takes priority
 *  2. Route to — NL intent parser matches (routeIntents)
 *  3. Multi-step plan — planChain() when the query names two studios
 *  4. Actions — matched commands from the registry
 *  5. Pinned / Recent / Most Used — surfaces the creator's own patterns
 *  6. Search — global scored hits across projects, prompts, stories,
 *     concepts, moodboard, activity
 *  7. Modules — familiar sidebar destinations
 *  8. Ask AI — fallback path to the AI Dock or Assistant
 *
 * Layout is Raycast/Linear-style two-pane: list on the left, preview on
 * the right. Every command carries a stable id, a shortcut hint, and
 * flows through the LRU history + pin system so it can be re-summoned
 * instantly next time.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  MagnifyingGlass,
  ArrowRight,
  Sparkle,
  Vault,
  Clock,
  PushPin,
  Star,
  ArrowUp,
  Path,
  X,
  Command,
} from "@phosphor-icons/react";
import { appModules, type Icon } from "@/lib/modules/registry";
import { useTheme } from "./theme-provider";
import { openAIDock } from "./app-shell";
import { useWorkspace } from "@/lib/workspace/store";
import { routeIntents, type StudioId } from "@/lib/palette/route-intent";
import {
  COMMANDS,
  COMMANDS_BY_ID,
  matchCommand,
  type CommandContext,
  type PaletteCommand,
  type StudioSlug,
} from "@/lib/palette/commands";
import {
  EMPTY_HISTORY,
  isPinned,
  mostUsedIds,
  recentIds,
  recordUse,
  togglePin,
  type PaletteHistory,
} from "@/lib/palette/history";
import {
  advanceChain,
  chainProgress,
  currentStep,
  isChainComplete,
  planChain,
  skipStep,
} from "@/lib/palette/chain";
import type { Chain } from "@/lib/palette/types";
import { search as globalSearch, type SearchSources } from "@/lib/palette/search";
import type { SearchHit } from "@/lib/palette/types";
import {
  PalettePreview,
  type PalettePreviewItem,
} from "./palette-preview";

const HISTORY_KEY = "vv-palette-history";
const CHAIN_KEY = "vv-palette-chain";

const STUDIO_PREFILL_KEY: Record<StudioId, string | null> = {
  story: "vv-story-prefill",
  vision: "vv-vision-prefill",
  vault: "vv-vault-prefill",
  assistant: "vv-assistant-prefill",
  projects: null,
};

// ─── Item types ────────────────────────────────────────────────────────

type PaletteItemKind =
  | "chain-step"
  | "chain-plan"
  | "route"
  | "command"
  | "search"
  | "module"
  | "ai-dock"
  | "ai-assistant";

type PaletteItem = {
  id: string;
  kind: PaletteItemKind;
  label: string;
  sublabel?: string;
  hint?: string;
  icon: React.ReactNode;
  shortcut?: string[];
  commandId?: string; // if this item is a command
  preview: PalettePreviewItem;
  run: () => void;
};

type PaletteSection = {
  id: string;
  label: string;
  items: PaletteItem[];
  /** Extra icon shown to the left of the section label. */
  icon?: React.ReactNode;
};

// ─── Icons for lookup ─────────────────────────────────────────────────

function studioIconElement(studio: StudioId): React.ReactNode {
  const map: Record<StudioId, string> = {
    story: "story",
    vision: "vision",
    vault: "prompts",
    assistant: "assistant",
    projects: "assistant",
  };
  const mod = appModules.find((m) => m.id === map[studio]);
  if (!mod) return <Sparkle className="size-[18px]" weight="fill" />;
  const I = mod.icon as Icon;
  return <I className="size-[18px]" weight="fill" />;
}

function moduleIconElement(id: string, weight: "fill" | "regular" = "regular"): React.ReactNode {
  const mod = appModules.find((m) => m.id === id);
  if (!mod) return <Sparkle className="size-[18px]" />;
  const I = mod.icon as Icon;
  return <I className="size-[18px]" weight={weight} />;
}

function commandIcon(cmd: PaletteCommand): React.ReactNode {
  // Map command → module icon when the command targets a studio.
  if (cmd.id.includes("story") || cmd.id.includes("caption") || cmd.id.includes("campaign"))
    return moduleIconElement("story");
  if (cmd.id.includes("vision") || cmd.id.includes("image") || cmd.id.includes("moodboard"))
    return moduleIconElement("vision");
  if (cmd.id.includes("vault") || cmd.id.includes("prompt"))
    return moduleIconElement("prompts");
  if (cmd.id.includes("assistant") || cmd.id.includes("ai-dock"))
    return <Sparkle className="size-[18px]" weight="fill" />;
  if (cmd.id.includes("theme"))
    return (
      <span
        className={`size-4 rounded-full border border-line ${
          cmd.id.includes("dark") ? "bg-bg" : "bg-ink"
        }`}
      />
    );
  if (cmd.id.includes("clear")) return <X className="size-[18px]" />;
  if (cmd.id.includes("dashboard") || cmd.id.includes("projects"))
    return moduleIconElement("assistant");
  return <Command className="size-[18px]" />;
}

// ─── History + chain persistence (React hooks) ───────────────────────

function useHistoryPersist(): [
  PaletteHistory,
  (next: PaletteHistory | ((prev: PaletteHistory) => PaletteHistory)) => void,
] {
  const [history, setHistoryState] = useState<PaletteHistory>(EMPTY_HISTORY);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistoryState(JSON.parse(raw) as PaletteHistory);
    } catch {
      // storage unavailable
    }
  }, []);
  const setHistory = useCallback(
    (next: PaletteHistory | ((prev: PaletteHistory) => PaletteHistory)) => {
      setHistoryState((prev) => {
        const resolved =
          typeof next === "function"
            ? (next as (p: PaletteHistory) => PaletteHistory)(prev)
            : next;
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(resolved));
        } catch {
          // storage unavailable
        }
        return resolved;
      });
    },
    [],
  );
  return [history, setHistory];
}

function useChainPersist(): [
  Chain | null,
  (next: Chain | null) => void,
] {
  const [chain, setChainState] = useState<Chain | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHAIN_KEY);
      if (raw) setChainState(JSON.parse(raw) as Chain);
    } catch {
      // storage unavailable
    }
  }, []);
  const setChain = useCallback((next: Chain | null) => {
    setChainState(next);
    try {
      if (next && !isChainComplete(next)) {
        localStorage.setItem(CHAIN_KEY, JSON.stringify(next));
      } else {
        localStorage.removeItem(CHAIN_KEY);
      }
    } catch {
      // storage unavailable
    }
  }, []);
  return [chain, setChain];
}

// ─── Search sources hook ─────────────────────────────────────────────

type VaultPrompt = { id: string; title: string; content: string };
type StoryEntry = {
  id: string;
  brief?: string;
  direction?: { subject?: string; platform?: string };
  slides?: Array<{ title?: string; caption?: string }>;
};
type VisionConcept = {
  id: string;
  brief?: string;
  title?: string;
  notes?: string;
  provider?: string;
};
type MoodboardItem = {
  id: string;
  title?: string;
  note?: string;
  kind: "manual" | "concept";
};

function useSearchSources(open: boolean, workspaceSources: SearchSources): SearchSources {
  const [prompts, setPrompts] = useState<VaultPrompt[]>([]);
  const [stories, setStories] = useState<StoryEntry[]>([]);
  const [concepts, setConcepts] = useState<VisionConcept[]>([]);
  const [moodboard, setMoodboard] = useState<MoodboardItem[]>([]);

  useEffect(() => {
    if (!open) return;
    const readJson = <T,>(key: string, fallback: T): T => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
      } catch {
        return fallback;
      }
    };
    setPrompts(readJson<VaultPrompt[]>("vv-vault-prompts", []));
    setStories(readJson<StoryEntry[]>("vv-story-concepts", []));
    setConcepts(readJson<VisionConcept[]>("vv-vision-concepts", []));
    setMoodboard(readJson<MoodboardItem[]>("vv-vision-moodboard", []));
  }, [open]);

  return useMemo(
    () => ({ ...workspaceSources, prompts, stories, concepts, moodboard }),
    [workspaceSources, prompts, stories, concepts, moodboard],
  );
}

// ─── Component ────────────────────────────────────────────────────────

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { projects, activity, clearActivity, duplicateProject } =
    useWorkspace();
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [history, setHistory] = useHistoryPersist();
  const [chain, setChain] = useChainPersist();

  // ── Search sources ──
  const workspaceSources: SearchSources = useMemo(
    () => ({ projects, activity }),
    [projects, activity],
  );
  const sources = useSearchSources(open, workspaceSources);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  // ── Command dispatch context ──
  const setPrefill = useCallback((studio: StudioSlug, value: string) => {
    const key =
      STUDIO_PREFILL_KEY[studio as StudioId] ??
      (studio === "settings" ? null : null);
    if (!key || !value) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // storage unavailable
    }
  }, []);

  const dispatch = useCallback(
    (cmd: PaletteCommand) => {
      const ctx: CommandContext = {
        navigate: (href) => router.push(href),
        setPrefill,
        openAIDock: (opts) => openAIDock(opts),
        pushChain: (next) => setChain(next),
        setTheme,
        clearActivity,
        duplicateActiveProject: () => duplicateProject(),
        closePalette: onClose,
      };
      cmd.run(ctx);
      setHistory((h) => recordUse(h, cmd.id));
    },
    [
      router,
      setPrefill,
      setChain,
      setTheme,
      clearActivity,
      duplicateProject,
      onClose,
      setHistory,
    ],
  );

  // ── Section assembly ──
  const sections = useMemo<PaletteSection[]>(() => {
    const q = query.trim();
    const build: PaletteSection[] = [];

    // 1. Chain queue — always at top when active
    const step = currentStep(chain);
    if (step) {
      const p = chainProgress(chain);
      const nextChain = chain ? advanceChain(chain) : null;
      build.push({
        id: "chain",
        label: `Continue chain · step ${p.index} of ${p.total}`,
        icon: <Path className="size-3.5 text-accent-fg" weight="fill" />,
        items: [
          {
            id: `chain-step-${step.id}`,
            kind: "chain-step",
            label: step.title,
            sublabel: step.hint,
            icon: <Path className="size-[18px] text-accent-fg" weight="fill" />,
            shortcut: ["Enter"],
            preview: {
              kind: "chain",
              title: chain?.label ?? "Chain",
              steps: (chain?.steps ?? []).map((s, i) => ({
                title: s.title,
                hint: s.hint,
                active: i === (chain?.cursor ?? 0),
              })),
            },
            run: () => {
              if (step.href) {
                if (step.prefill) {
                  try {
                    localStorage.setItem(step.prefill.key, step.prefill.value);
                  } catch {
                    // storage unavailable
                  }
                }
                router.push(step.href);
              } else if (step.commandId) {
                const cmd = COMMANDS_BY_ID.get(step.commandId);
                if (cmd) dispatch(cmd);
              }
              setChain(nextChain);
              onClose();
            },
          },
          {
            id: `chain-skip`,
            kind: "chain-step",
            label: `Skip “${step.title}”`,
            sublabel: "Drop this step, keep the rest of the plan",
            icon: <X className="size-[18px]" />,
            shortcut: ["⌫"],
            preview: {
              kind: "chain",
              title: chain?.label ?? "Chain",
              steps: (chain?.steps ?? []).map((s, i) => ({
                title: s.title,
                hint: s.hint,
                active: i === (chain?.cursor ?? 0),
              })),
            },
            run: () => {
              const next = chain ? skipStep(chain) : null;
              setChain(next);
            },
          },
        ],
      });
    }

    // 2. Chain plan — proactively offer to combine when the query hints
    //    at more than one studio.
    if (q) {
      const plan = planChain(q);
      if (plan) {
        build.push({
          id: "chain-plan",
          label: `Multi-step plan · ${plan.steps.length} steps`,
          icon: <Path className="size-3.5 text-accent-fg" weight="fill" />,
          items: [
            {
              id: "chain-plan-run",
              kind: "chain-plan",
              label: `Run “${plan.label}”`,
              sublabel: plan.steps
                .map((s, i) => `${i + 1}. ${s.title.replace("Draft in ", "").replace("Compose in ", "").replace("Save in ", "")}`)
                .join(" · "),
              icon: <Sparkle className="size-[18px] text-accent-fg" weight="fill" />,
              shortcut: ["Enter"],
              preview: {
                kind: "chain",
                title: plan.label,
                steps: plan.steps.map((s, i) => ({
                  title: s.title,
                  hint: s.hint,
                  active: i === 0,
                })),
              },
              run: () => {
                setChain(plan);
                const first = plan.steps[0];
                if (first?.prefill) {
                  try {
                    localStorage.setItem(
                      first.prefill.key,
                      first.prefill.value,
                    );
                  } catch {
                    // storage unavailable
                  }
                }
                if (first?.href) router.push(first.href);
                const next = advanceChain(plan);
                setChain(next);
                onClose();
              },
            },
          ],
        });
      }
    }

    // 3. Route intents
    const intents = q ? routeIntents(q) : [];
    if (intents.length > 0) {
      build.push({
        id: "routes",
        label: "Route to",
        icon: <ArrowRight className="size-3.5 text-accent-fg" weight="bold" />,
        items: intents.map((intent, i) => ({
          id: `intent-${intent.studio}-${i}`,
          kind: "route",
          label: intent.label,
          sublabel: intent.subject
            ? `${intent.hint} — subject: “${intent.subject}”`
            : intent.hint,
          icon: studioIconElement(intent.studio),
          preview: {
            kind: "route",
            title: intent.label,
            hint: intent.hint,
            subject: intent.subject,
            confidence: intent.confidence,
            studio: intent.studio,
          },
          run: () => {
            const key = STUDIO_PREFILL_KEY[intent.studio];
            if (key && intent.subject) {
              try {
                localStorage.setItem(key, intent.subject);
              } catch {
                // storage unavailable
              }
            }
            router.push(intent.href);
            onClose();
          },
        })),
      });
    }

    // 4. Actions — commands, filtered by q if non-empty
    const matchedCommands = COMMANDS.map((c) => ({ cmd: c, score: matchCommand(c, q) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);

    // Actions section: always show the top matches, capped
    const topActions = matchedCommands.slice(0, q ? 8 : 4);
    if (topActions.length > 0) {
      const grouped: Record<string, PaletteCommand[]> = {};
      for (const { cmd } of topActions) {
        (grouped[cmd.group] ??= []).push(cmd);
      }
      const groupOrder: Array<keyof typeof grouped> = [
        "create",
        "search",
        "workspace",
        "navigate",
        "system",
      ];
      for (const g of groupOrder) {
        const list = grouped[g];
        if (!list || list.length === 0) continue;
        build.push({
          id: `actions-${g}`,
          label:
            g === "create"
              ? "Quick create"
              : g === "search"
                ? "Search"
                : g === "workspace"
                  ? "Workspace"
                  : g === "navigate"
                    ? "Navigate"
                    : "System",
          items: list.map((cmd) => ({
            id: cmd.id,
            kind: "command",
            label: cmd.title,
            sublabel: cmd.subtitle,
            icon: commandIcon(cmd),
            shortcut: cmd.shortcut,
            commandId: cmd.id,
            preview: {
              kind: "command",
              title: cmd.title,
              subtitle: cmd.subtitle,
              keywords: cmd.keywords,
              shortcut: cmd.shortcut,
              group: cmd.group,
              pinned: isPinned(history, cmd.id),
            },
            run: () => dispatch(cmd),
          })),
        });
      }
    }

    // 5. Global search (only when q is non-empty)
    if (q) {
      const hits = globalSearch(q, sources, 4);
      if (hits.length > 0) {
        const groups: Record<string, SearchHit[]> = {};
        for (const h of hits) (groups[h.kind] ??= []).push(h);
        const nameFor: Record<string, string> = {
          project: "Projects",
          prompt: "Vault prompts",
          story: "Stories",
          concept: "Vision concepts",
          moodboard: "Moodboard",
          activity: "Activity",
        };
        for (const kind of Object.keys(groups)) {
          const list = groups[kind];
          const iconFor: Record<string, React.ReactNode> = {
            prompt: <Vault className="size-[18px]" />,
            project: moduleIconElement("assistant"),
            story: moduleIconElement("story"),
            concept: moduleIconElement("vision"),
            moodboard: <PushPin className="size-[18px]" weight="fill" />,
            activity: <Clock className="size-[18px]" />,
          };
          build.push({
            id: `search-${kind}`,
            label: nameFor[kind] ?? kind,
            items: list.map((h) => ({
              id: `hit-${kind}-${h.id}`,
              kind: "search",
              label: h.title,
              sublabel: h.subtitle,
              icon: iconFor[kind] ?? <MagnifyingGlass className="size-[18px]" />,
              preview: { kind: "search", hit: h },
              run: () => {
                if (h.href) router.push(h.href);
                onClose();
              },
            })),
          });
        }
      }
    }

    // 6. Pinned + Recent + Most used (only when q is empty)
    if (!q) {
      const pinnedCmds = history.pinned
        .map((id) => COMMANDS_BY_ID.get(id))
        .filter((c): c is PaletteCommand => Boolean(c));
      if (pinnedCmds.length > 0) {
        build.push({
          id: "pinned",
          label: "Pinned",
          icon: <PushPin className="size-3.5" weight="fill" />,
          items: pinnedCmds.map((cmd) => ({
            id: `pinned-${cmd.id}`,
            kind: "command",
            label: cmd.title,
            sublabel: cmd.subtitle,
            icon: commandIcon(cmd),
            shortcut: cmd.shortcut,
            commandId: cmd.id,
            preview: {
              kind: "command",
              title: cmd.title,
              subtitle: cmd.subtitle,
              keywords: cmd.keywords,
              shortcut: cmd.shortcut,
              group: cmd.group,
              pinned: true,
            },
            run: () => dispatch(cmd),
          })),
        });
      }

      const recent = recentIds(history, 5)
        .map((id) => COMMANDS_BY_ID.get(id))
        .filter((c): c is PaletteCommand => Boolean(c))
        .filter((c) => !history.pinned.includes(c.id));
      if (recent.length > 0) {
        build.push({
          id: "recent",
          label: "Recent",
          icon: <Clock className="size-3.5" />,
          items: recent.map((cmd) => ({
            id: `recent-${cmd.id}`,
            kind: "command",
            label: cmd.title,
            sublabel: cmd.subtitle,
            icon: commandIcon(cmd),
            shortcut: cmd.shortcut,
            commandId: cmd.id,
            preview: {
              kind: "command",
              title: cmd.title,
              subtitle: cmd.subtitle,
              keywords: cmd.keywords,
              shortcut: cmd.shortcut,
              group: cmd.group,
              pinned: isPinned(history, cmd.id),
            },
            run: () => dispatch(cmd),
          })),
        });
      }

      const mostUsed = mostUsedIds(history, 5)
        .map((id) => COMMANDS_BY_ID.get(id))
        .filter((c): c is PaletteCommand => Boolean(c))
        .filter(
          (c) =>
            !history.pinned.includes(c.id) &&
            !history.recent.slice(0, 5).includes(c.id),
        );
      if (mostUsed.length > 0) {
        build.push({
          id: "most-used",
          label: "Most used",
          icon: <Star className="size-3.5" weight="fill" />,
          items: mostUsed.map((cmd) => ({
            id: `most-${cmd.id}`,
            kind: "command",
            label: cmd.title,
            sublabel: cmd.subtitle,
            icon: commandIcon(cmd),
            shortcut: cmd.shortcut,
            commandId: cmd.id,
            preview: {
              kind: "command",
              title: cmd.title,
              subtitle: cmd.subtitle,
              keywords: cmd.keywords,
              shortcut: cmd.shortcut,
              group: cmd.group,
              pinned: false,
            },
            run: () => dispatch(cmd),
          })),
        });
      }

      // Live modules fallback
      build.push({
        id: "modules",
        label: "Modules",
        items: appModules
          .filter((m) => m.status === "live")
          .map((m) => ({
            id: `module-${m.id}`,
            kind: "module",
            label: m.name,
            sublabel: m.blurb,
            icon: moduleIconElement(m.id),
            preview: {
              kind: "command",
              title: m.name,
              subtitle: m.blurb,
              keywords: [m.id, m.group],
              group: "module",
              pinned: false,
            },
            run: () => {
              router.push(m.href);
              onClose();
            },
          })),
      });
    }

    // 7. Ask AI fallback — always available when the query is phrase-shaped
    if (q && q.split(/\s+/).length >= 2) {
      build.push({
        id: "ai",
        label: "Ask AI",
        icon: <Sparkle className="size-3.5 text-accent-fg" weight="fill" />,
        items: [
          {
            id: "ai-dock",
            kind: "ai-dock",
            label: `Ask “${q}”`,
            sublabel: "Ask the AI Dock in place · ⌘J",
            icon: <Sparkle className="size-[18px] text-accent-fg" weight="fill" />,
            shortcut: ["⌘", "J"],
            preview: { kind: "ai", query: q },
            run: () => {
              openAIDock({ prefill: q, autoSend: true });
              onClose();
            },
          },
          {
            id: "ai-assistant",
            kind: "ai-assistant",
            label: "Open in AI Assistant",
            sublabel: "Full-page conversation",
            icon: <ArrowRight className="size-[18px]" />,
            shortcut: ["⇧", "↵"],
            preview: { kind: "ai", query: q },
            run: () => {
              try {
                localStorage.setItem("vv-assistant-prefill", q);
              } catch {
                // storage unavailable
              }
              router.push("/assistant");
              onClose();
            },
          },
        ],
      });
    }

    return build;
  }, [query, chain, history, sources, router, onClose, dispatch, setChain]);

  const allItems = useMemo(
    () => sections.flatMap((s) => s.items),
    [sections],
  );
  const activeItem = allItems[activeIndex] ?? null;

  // ── Keyboard ──
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeItem?.kind === "ai-dock" && e.shiftKey) {
          // Shift+Enter on AI Dock item routes to full Assistant.
          try {
            localStorage.setItem("vv-assistant-prefill", query.trim());
          } catch {
            // storage unavailable
          }
          router.push("/assistant");
          onClose();
          return;
        }
        activeItem?.run();
      } else if (e.key === "Escape") {
        onClose();
      } else if (
        e.key === "Backspace" &&
        query.length === 0 &&
        chain &&
        currentStep(chain)
      ) {
        // Empty input + chain in flight → skip the current step
        e.preventDefault();
        const next = skipStep(chain);
        setChain(next);
      } else if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        if (activeItem?.commandId) {
          setHistory((h) => togglePin(h, activeItem.commandId!));
        }
      }
    },
    [
      activeItem,
      allItems.length,
      chain,
      onClose,
      query,
      router,
      setChain,
      setHistory,
    ],
  );

  const itemIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    allItems.forEach((item, i) => map.set(item.id, i));
    return map;
  }, [allItems]);

  const activeStep = currentStep(chain);
  const activeProgress = chainProgress(chain);
  const showChainBadge = Boolean(activeStep) && !query;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[10vh]"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            aria-label="Close command palette"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex w-full max-w-[820px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_50px_140px_-40px_rgba(0,0,0,0.85)]"
          >
            {/* Chain progress banner */}
            {showChainBadge && chain && activeStep && (
              <div className="flex items-center gap-3 border-b border-line bg-accent/[0.05] px-4 py-2.5">
                <Path className="size-4 text-accent-fg" weight="fill" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-ink">
                    Continue chain: {activeStep.title}
                  </p>
                  <p className="truncate text-[11px] text-faint">
                    Step {activeProgress.index} of {activeProgress.total} · Backspace to skip
                  </p>
                </div>
                <span className="h-1 w-24 overflow-hidden rounded-full bg-line">
                  <span
                    className="block h-full rounded-full bg-accent transition-[width]"
                    style={{ width: `${activeProgress.percent}%` }}
                  />
                </span>
                <button
                  type="button"
                  onClick={() => setChain(null)}
                  aria-label="Cancel chain"
                  className="cursor-pointer rounded-full p-1 text-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {/* Input */}
            <div className="flex items-center gap-3 border-b border-line px-4">
              <MagnifyingGlass className="size-5 shrink-0 text-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="What do you want to do?"
                aria-label="Command palette search"
                className="h-14 flex-1 bg-transparent text-[15px] text-ink placeholder:text-faint focus:outline-none"
              />
              <kbd className="hidden rounded border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-faint sm:inline">
                Esc
              </kbd>
            </div>

            {/* Body: list + preview */}
            <div className="grid min-h-0 grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px]">
              {/* Left: sectioned list */}
              <div className="max-h-[58vh] overflow-y-auto p-2">
                {allItems.length === 0 && (
                  <div className="flex flex-col items-center gap-3 px-4 py-10">
                    <p className="text-[14px] text-faint">
                      {query
                        ? `No results for “${query}”`
                        : "Nothing to show yet."}
                    </p>
                    {query && (
                      <button
                        type="button"
                        onClick={() => {
                          openAIDock({ prefill: query, autoSend: true });
                          onClose();
                        }}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-[13px] text-muted transition-colors hover:border-faint hover:text-ink active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        <Sparkle className="size-4" weight="fill" />
                        Ask AI instead
                        <ArrowUp className="size-3.5 rotate-45" weight="bold" />
                      </button>
                    )}
                  </div>
                )}

                {sections.map((section) => {
                  if (section.items.length === 0) return null;
                  return (
                    <div key={section.id} className="mb-1">
                      <div className="flex items-center gap-2 px-3 pb-1 pt-2">
                        {section.icon}
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                          {section.label}
                        </p>
                      </div>
                      {section.items.map((item) => {
                        const idx = itemIndexMap.get(item.id) ?? -1;
                        const active = idx === activeIndex;
                        const pinned =
                          item.commandId
                            ? isPinned(history, item.commandId)
                            : false;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            aria-selected={active}
                            onMouseMove={() => setActiveIndex(idx)}
                            onClick={item.run}
                            className={`group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                              active ? "bg-surface-2" : ""
                            }`}
                          >
                            <span
                              className={`grid size-8 shrink-0 place-items-center rounded-lg border border-line/60 bg-bg ${
                                active ? "text-accent-fg" : "text-faint"
                              }`}
                            >
                              {item.icon}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5">
                                <span className="block truncate text-[14px] text-ink">
                                  {item.label}
                                </span>
                                {pinned && (
                                  <PushPin
                                    className="size-3 shrink-0 text-accent-fg"
                                    weight="fill"
                                  />
                                )}
                              </span>
                              {item.sublabel && (
                                <span className="block truncate text-[12px] text-faint">
                                  {item.sublabel}
                                </span>
                              )}
                            </span>
                            {item.shortcut && item.shortcut.length > 0 && (
                              <span className="hidden items-center gap-1 md:inline-flex">
                                {item.shortcut.map((k, i) => (
                                  <kbd
                                    key={i}
                                    className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-line bg-bg px-1.5 font-mono text-[10px] text-faint"
                                  >
                                    {k}
                                  </kbd>
                                ))}
                              </span>
                            )}
                            {active && !item.shortcut && (
                              <ArrowRight className="size-4 shrink-0 text-faint" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Right: preview (md+) */}
              <div className="hidden max-h-[58vh] overflow-hidden border-l border-line bg-bg/40 md:block">
                <PalettePreview item={activeItem?.preview ?? null} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2">
              <p className="flex items-center gap-3 text-[11px] text-faint">
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded border border-line bg-bg px-1 py-0.5 font-mono text-[10px]">
                    ↑↓
                  </kbd>
                  navigate
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded border border-line bg-bg px-1 py-0.5 font-mono text-[10px]">
                    ↵
                  </kbd>
                  run
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded border border-line bg-bg px-1 py-0.5 font-mono text-[10px]">
                    ⌘.
                  </kbd>
                  pin
                </span>
                {chain && (
                  <span className="inline-flex items-center gap-1">
                    <kbd className="rounded border border-line bg-bg px-1 py-0.5 font-mono text-[10px]">
                      ⌫
                    </kbd>
                    skip step
                  </span>
                )}
              </p>
              {sections[0]?.id === "chain" ? (
                <p className="text-[11px] text-faint">
                  <Path className="mr-1 inline size-3 text-accent-fg" weight="fill" />
                  Continue chain
                </p>
              ) : sections[0]?.id === "chain-plan" ? (
                <p className="text-[11px] text-faint">
                  <Sparkle className="mr-1 inline size-3 text-accent-fg" weight="fill" />
                  Enter starts the plan
                </p>
              ) : sections[0]?.id === "routes" ? (
                <p className="text-[11px] text-faint">
                  <ArrowRight className="mr-1 inline size-3" weight="bold" />
                  Enter routes to studio with subject
                </p>
              ) : query.split(/\s+/).length >= 2 ? (
                <p className="text-[11px] text-faint">
                  <Sparkle className="mr-1 inline size-3" weight="fill" />
                  Enter to ask the AI Dock in place
                </p>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
