"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  MagnifyingGlass,
  House,
  Gear,
  ArrowRight,
  CornersOut,
} from "@phosphor-icons/react";
import { appModules, type Icon } from "@/lib/modules/registry";
import { useTheme } from "./theme-provider";

type Command = {
  id: string;
  label: string;
  hint?: string;
  icon: Icon;
  keywords: string;
  run: () => void;
};

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => {
      router.push(href);
      onClose();
    };
    const nav: Command[] = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: House,
        keywords: "home overview",
        run: go("/dashboard"),
      },
      ...appModules.map((m) => ({
        id: m.id,
        label: m.name,
        hint: m.status === "soon" ? "Soon" : undefined,
        icon: m.icon,
        keywords: m.blurb,
        run: go(m.href),
      })),
      {
        id: "settings",
        label: "Settings",
        icon: Gear,
        keywords: "account preferences profile",
        run: go("/settings"),
      },
    ];
    const actions: Command[] = [
      {
        id: "theme-light",
        label: "Switch to light theme",
        icon: CornersOut,
        keywords: "appearance bright",
        run: () => {
          setTheme("light");
          onClose();
        },
      },
      {
        id: "theme-dark",
        label: "Switch to dark theme",
        icon: CornersOut,
        keywords: "appearance dark night",
        run: () => {
          setTheme("dark");
          onClose();
        },
      },
    ];
    return [...nav, ...actions];
  }, [router, onClose, setTheme]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.keywords.toLowerCase().includes(q),
    );
  }, [query, commands]);

  // reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // keep active index in range
  useEffect(() => setActive(0), [query]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[active]?.run();
    } else if (e.key === "Escape") {
      onClose();
    }
  }

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
            <div className="flex items-center gap-3 border-b border-line-soft px-4">
              <MagnifyingGlass className="size-5 shrink-0 text-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search modules, actions, settings..."
                className="h-14 flex-1 bg-transparent text-[15px] text-ink placeholder:text-faint focus:outline-none"
              />
              <kbd className="hidden rounded border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-faint sm:inline">
                Esc
              </kbd>
            </div>

            <ul className="max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-3 py-8 text-center text-[14px] text-faint">
                  No matches for &ldquo;{query}&rdquo;
                </li>
              )}
              {results.map((c, i) => {
                const Icon = c.icon;
                return (
                  <li key={c.id}>
                    <button
                      onMouseMove={() => setActive(i)}
                      onClick={() => c.run()}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        i === active ? "bg-surface-2" : ""
                      }`}
                    >
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-lg border border-line-soft bg-bg ${
                          i === active ? "text-accent-fg" : "text-faint"
                        }`}
                      >
                        <Icon className="size-[18px]" />
                      </span>
                      <span className="flex-1 text-[14px] text-ink">
                        {c.label}
                      </span>
                      {c.hint && (
                        <span className="rounded-full border border-line px-1.5 py-0.5 text-[10px] text-faint">
                          {c.hint}
                        </span>
                      )}
                      {i === active && (
                        <ArrowRight className="size-4 text-faint" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
