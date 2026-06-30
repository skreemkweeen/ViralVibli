"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Check,
  Export,
  Sparkle,
  MagnifyingGlass,
  ClockCounterClockwise,
  ArrowClockwise,
  Trash,
  Heart,
  FolderSimple,
} from "@phosphor-icons/react";
import { useVision } from "@/lib/vision/vision-store";
import { ConceptCard } from "./concept-card";

type Tab = "canvas" | "history" | "collections" | "favorites";

const tabs: { id: Tab; label: string; icon: typeof Copy }[] = [
  { id: "canvas", label: "Canvas", icon: Sparkle },
  { id: "history", label: "History", icon: ClockCounterClockwise },
  { id: "collections", label: "Collections", icon: FolderSimple },
  { id: "favorites", label: "Favorites", icon: Heart },
];

export function Canvas() {
  const {
    prompt,
    generate,
    concepts,
    history,
    restore,
    clearHistory,
    collections,
  } = useVision();
  const [tab, setTab] = useState<Tab>("canvas");
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");

  // power-user shortcut: Cmd/Ctrl+Enter generates from anywhere in the studio
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        setTab("canvas");
        generate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [generate]);

  const favorites = concepts.filter((c) => c.favorite);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return concepts;
    return concepts.filter((c) => c.prompt.toLowerCase().includes(q));
  }, [concepts, query]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* unavailable */
    }
  }

  function exportPrompt() {
    const blob = new Blob([prompt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vision-direction.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full flex-col">
      {/* tabs */}
      <div
        role="tablist"
        aria-label="Vision Studio views"
        className="flex items-center gap-1 border-b border-line px-4 py-2.5"
      >
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          const count =
            t.id === "favorites"
              ? favorites.length
              : t.id === "history"
                ? history.length
                : 0;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
                active
                  ? "bg-surface-2 font-medium text-ink"
                  : "text-muted hover:text-ink"
              }`}
            >
              <Icon className="size-4" weight={active ? "fill" : "regular"} />
              {t.label}
              {count > 0 && (
                <span className="ml-0.5 rounded-full bg-bg px-1.5 text-[10px] text-faint">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === "canvas" && (
          <div className="space-y-7">
            {/* live prompt */}
            <div className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.14em] text-faint">
                  Composed direction
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={copy}
                    className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] text-muted transition-colors hover:border-faint hover:text-ink"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-accent-fg" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={exportPrompt}
                    aria-label="Export as text"
                    className="grid size-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-faint hover:text-ink"
                  >
                    <Export className="size-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-ink">
                {prompt}
              </p>
              <button
                onClick={generate}
                className="group/gen relative mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[14px] font-medium text-accent-ink transition-colors hover:bg-[#d6f56b]"
              >
                <Sparkle weight="fill" className="size-4" />
                Generate concepts
                <kbd className="absolute right-3 hidden rounded bg-accent-ink/10 px-1.5 py-0.5 font-mono text-[11px] text-accent-ink/70 sm:inline">
                  ⌘⏎
                </kbd>
              </button>
            </div>

            {/* recent generations */}
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-[14px] font-medium text-ink">
                  Recent generations
                </h3>
                {concepts.length > 0 && (
                  <div className="relative w-44">
                    <MagnifyingGlass className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Filter"
                      className="h-9 w-full rounded-lg border border-line bg-bg pl-8 pr-3 text-[13px] text-ink placeholder:text-faint focus:border-faint focus:outline-none"
                    />
                  </div>
                )}
              </div>
              {concepts.length === 0 ? (
                <Empty
                  icon={<Sparkle className="size-6" />}
                  title="Nothing generated yet"
                  body="Compose a direction on the left, then generate your first concepts."
                />
              ) : filtered.length === 0 ? (
                <Empty
                  icon={<MagnifyingGlass className="size-6" />}
                  title="No matches"
                  body={`Nothing matches "${query}".`}
                />
              ) : (
                <Grid>
                  {filtered.map((c) => (
                    <ConceptCard key={c.id} concept={c} />
                  ))}
                </Grid>
              )}
            </div>
          </div>
        )}

        {tab === "favorites" &&
          (favorites.length === 0 ? (
            <Empty
              icon={<Heart className="size-6" />}
              title="No favorites yet"
              body="Tap the heart on any concept to keep it here."
            />
          ) : (
            <Grid>
              {favorites.map((c) => (
                <ConceptCard key={c.id} concept={c} />
              ))}
            </Grid>
          ))}

        {tab === "collections" &&
          (collections.every(
            (col) => !concepts.some((c) => c.collectionId === col.id),
          ) ? (
            <Empty
              icon={<FolderSimple className="size-6" />}
              title="Collections are empty"
              body="Save concepts into a collection from the bookmark action."
            />
          ) : (
            <div className="space-y-8">
              {collections.map((col) => {
                const items = concepts.filter(
                  (c) => c.collectionId === col.id,
                );
                if (items.length === 0) return null;
                return (
                  <div key={col.id}>
                    <h3 className="mb-3 text-[14px] font-medium text-ink">
                      {col.name}{" "}
                      <span className="text-faint">{items.length}</span>
                    </h3>
                    <Grid>
                      {items.map((c) => (
                        <ConceptCard key={c.id} concept={c} />
                      ))}
                    </Grid>
                  </div>
                );
              })}
            </div>
          ))}

        {tab === "history" &&
          (history.length === 0 ? (
            <Empty
              icon={<ClockCounterClockwise className="size-6" />}
              title="No history yet"
              body="Every generation is recorded here so you can return to it."
            />
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[14px] font-medium text-ink">
                  Prompt history
                </h3>
                <button
                  onClick={clearHistory}
                  className="flex items-center gap-1.5 text-[12.5px] text-muted transition-colors hover:text-ink"
                >
                  <Trash className="size-3.5" />
                  Clear
                </button>
              </div>
              <ul className="divide-y divide-line-soft rounded-2xl border border-line bg-surface">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-start gap-3 p-4"
                  >
                    <p className="line-clamp-2 flex-1 text-[13px] leading-snug text-muted">
                      {h.prompt}
                    </p>
                    <button
                      onClick={() => restore(h)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] text-muted transition-colors hover:border-faint hover:text-ink"
                    >
                      <ArrowClockwise className="size-3.5" />
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{children}</div>
  );
}

function Empty({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-16 text-center">
      <span className="grid size-12 place-items-center rounded-xl border border-line-soft bg-surface text-faint">
        {icon}
      </span>
      <p className="mt-4 text-[14px] font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-xs text-[13px] text-muted">{body}</p>
    </div>
  );
}
