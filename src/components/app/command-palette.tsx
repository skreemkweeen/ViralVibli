"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  MagnifyingGlass,
  House,
  Gear,
  ArrowRight,
  Sparkle,
  FolderSimple,
  Vault,
  ArrowUp,
} from "@phosphor-icons/react";
import { appModules, type Icon } from "@/lib/modules/registry";
import { useTheme } from "./theme-provider";
import { useWorkspace } from "@/lib/workspace/store";
import type { ProjectColor } from "@/lib/workspace/types";
import { PROJECT_COLORS } from "@/lib/workspace/types";

type SearchItem = {
  id: string;
  label: string;
  sublabel?: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
};

type SearchSection = {
  id: string;
  label: string;
  items: SearchItem[];
};

function fuzzy(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (!q) return true;
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

function ProjectDot({ color }: { color: ProjectColor }) {
  return (
    <span
      className={`size-2 rounded-full ${PROJECT_COLORS[color].dot} opacity-80`}
    />
  );
}

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { projects, activity } = useWorkspace();
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [vaultPrompts, setVaultPrompts] = useState<
    Array<{ id: string; title: string; content: string }>
  >([]);

  // Refresh vault prompts each time palette opens
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem("vv-vault-prompts");
      if (raw)
        setVaultPrompts(
          JSON.parse(raw) as Array<{
            id: string;
            title: string;
            content: string;
          }>,
        );
    } catch {
      // storage unavailable
    }
  }, [open]);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  const sections = useMemo<SearchSection[]>(() => {
    const go = (href: string) => () => {
      router.push(href);
      onClose();
    };

    const q = query.trim();

    const navItems: SearchItem[] = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <House className="size-[18px]" />,
        run: go("/dashboard"),
      },
      {
        id: "projects",
        label: "Projects",
        icon: <FolderSimple className="size-[18px]" />,
        run: go("/projects"),
      },
      ...appModules.map((m) => {
        const Icon = m.icon as Icon;
        return {
          id: `module-${m.id}`,
          label: m.name,
          sublabel: m.blurb,
          hint: m.status === "soon" ? "Soon" : undefined,
          icon: <Icon className="size-[18px]" />,
          run: go(m.href),
        };
      }),
      {
        id: "settings",
        label: "Settings",
        icon: <Gear className="size-[18px]" />,
        run: go("/settings"),
      },
      {
        id: "theme-dark",
        label: "Switch to dark theme",
        icon: <span className="size-4 rounded-full border border-line bg-bg" />,
        run: () => { setTheme("dark"); onClose(); },
      },
      {
        id: "theme-light",
        label: "Switch to light theme",
        icon: <span className="size-4 rounded-full border border-line bg-ink" />,
        run: () => { setTheme("light"); onClose(); },
      },
    ];

    const projectItems: SearchItem[] = projects.map((p) => ({
      id: `proj-${p.id}`,
      label: p.name,
      sublabel: p.description ?? `${p.items.length} items`,
      icon: <ProjectDot color={p.color} />,
      run: go("/projects"),
    }));

    const vaultItems: SearchItem[] = vaultPrompts
      .slice(0, q ? 100 : 5)
      .map((p) => ({
        id: `prompt-${p.id}`,
        label: p.title,
        sublabel: p.content.slice(0, 80) + (p.content.length > 80 ? "…" : ""),
        icon: <Vault className="size-[18px]" />,
        run: go("/vault"),
      }));

    const recentItems: SearchItem[] = activity.slice(0, 5).map((a) => ({
      id: `act-${a.id}`,
      label: a.title,
      icon: <span className="size-1.5 rounded-full bg-faint" />,
      run: a.href ? go(a.href) : onClose,
    }));

    const filter = (items: SearchItem[]) =>
      q ? items.filter((i) => fuzzy(i.label + " " + (i.sublabel ?? ""), q)) : items;

    const build: SearchSection[] = [
      { id: "nav", label: "Navigate", items: filter(navItems) },
    ];

    if (projectItems.length > 0) {
      const filtered = filter(projectItems);
      if (!q || filtered.length > 0)
        build.push({ id: "projects", label: "Projects", items: q ? filtered : projectItems.slice(0, 4) });
    }

    if (vaultItems.length > 0) {
      const filtered = filter(vaultItems);
      if (!q || filtered.length > 0)
        build.push({ id: "vault", label: "Vault Prompts", items: q ? filtered.slice(0, 5) : vaultItems.slice(0, 3) });
    }

    if (recentItems.length > 0 && !q) {
      build.push({ id: "recent", label: "Recent", items: recentItems });
    }

    // Ask AI option — shown when query looks like a phrase/command
    if (q.split(" ").length >= 2) {
      build.push({
        id: "ai",
        label: "Ask AI",
        items: [
          {
            id: "ask-ai",
            label: `"${q}"`,
            sublabel: "Send to AI Assistant",
            icon: <Sparkle className="size-[18px]" weight="fill" />,
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
  }, [query, projects, vaultPrompts, activity, setTheme, onClose, router]);

  // Flatten all items for keyboard navigation
  const allItems = useMemo(
    () => sections.flatMap((s) => s.items),
    [sections],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      allItems[activeIndex]?.run();
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  // Map item id → flat index for active highlight
  const itemIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    allItems.forEach((item, i) => map.set(item.id, i));
    return map;
  }, [allItems]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]"
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
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-line px-4">
              <MagnifyingGlass className="size-5 shrink-0 text-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search modules, projects, prompts, or ask AI..."
                className="h-14 flex-1 bg-transparent text-[15px] text-ink placeholder:text-faint focus:outline-none"
              />
              <kbd className="hidden rounded border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-faint sm:inline">
                Esc
              </kbd>
            </div>

            {/* Sectioned results */}
            <div className="max-h-[56vh] overflow-y-auto p-2">
              {allItems.length === 0 && (
                <div className="flex flex-col items-center gap-3 px-4 py-10">
                  <p className="text-[14px] text-faint">
                    No results for &ldquo;{query}&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      try { localStorage.setItem("vv-assistant-prefill", query); } catch { /* storage unavailable */ }
                      router.push("/assistant");
                      onClose();
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-[13px] text-muted transition-colors hover:border-faint hover:text-ink active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    <Sparkle className="size-4" weight="fill" />
                    Ask AI instead
                    <ArrowUp className="size-3.5 rotate-45" weight="bold" />
                  </button>
                </div>
              )}

              {sections.map((section) => {
                if (section.items.length === 0) return null;
                return (
                  <div key={section.id} className="mb-1">
                    <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-faint">
                      {section.label}
                    </p>
                    {section.items.map((item) => {
                      const idx = itemIndexMap.get(item.id) ?? -1;
                      const active = idx === activeIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseMove={() => setActiveIndex(idx)}
                          onClick={item.run}
                          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
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
                            <span className="block truncate text-[14px] text-ink">
                              {item.label}
                            </span>
                            {item.sublabel && (
                              <span className="block truncate text-[12px] text-faint">
                                {item.sublabel}
                              </span>
                            )}
                          </span>
                          {item.hint && (
                            <span className="rounded-full border border-line px-1.5 py-0.5 text-[10px] text-faint">
                              {item.hint}
                            </span>
                          )}
                          {active && (
                            <ArrowRight className="size-4 shrink-0 text-faint" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-line px-4 py-2">
              <p className="text-[11px] text-faint">
                ↑↓ navigate · ↵ open · Esc close
              </p>
              {query.split(" ").length >= 2 && (
                <p className="text-[11px] text-faint">
                  <Sparkle className="mr-1 inline size-3" weight="fill" />
                  Enter to ask AI
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
