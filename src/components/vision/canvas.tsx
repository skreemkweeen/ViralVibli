"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  BookmarkSimple,
  MagicWand,
  SquaresFour,
  Tag,
} from "@phosphor-icons/react";
import { useVision } from "@/lib/vision/vision-store";
import { enhancePrompt } from "@/lib/vision/enhance";
import { ConceptCard } from "./concept-card";

type Tab = "canvas" | "saved" | "history" | "collections" | "favorites";

const tabs: { id: Tab; label: string; icon: typeof Copy }[] = [
  { id: "canvas", label: "Canvas", icon: Sparkle },
  { id: "saved", label: "Saved", icon: BookmarkSimple },
  { id: "history", label: "History", icon: ClockCounterClockwise },
  { id: "collections", label: "Collections", icon: FolderSimple },
  { id: "favorites", label: "Favorites", icon: Heart },
];

export function Canvas({ onBrowsePresets }: { onBrowsePresets: () => void }) {
  const {
    prompt,
    generate,
    generating,
    concepts,
    history,
    restore,
    clearHistory,
    collections,
    saved,
    savePrompt,
    removeSaved,
    restoreSaved,
    allTags,
  } = useVision();
  const [tab, setTab] = useState<Tab>("canvas");
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");

  // enhancement
  const [enhancing, setEnhancing] = useState(false);
  const [enhanced, setEnhanced] = useState<string | null>(null);
  const [enhancedCopied, setEnhancedCopied] = useState(false);

  // save-with-tags popover
  const [saveOpen, setSaveOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const saveRef = useRef<HTMLDivElement>(null);

  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const favorites = concepts.filter((c) => c.favorite);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return concepts;
    return concepts.filter((c) => c.prompt.toLowerCase().includes(q));
  }, [concepts, query]);

  const filteredSaved = tagFilter
    ? saved.filter((s) => s.tags.includes(tagFilter))
    : saved;

  // a fresh direction invalidates a stale enhancement
  useEffect(() => setEnhanced(null), [prompt]);

  useEffect(() => {
    if (!saveOpen) return;
    const onDown = (e: MouseEvent) => {
      if (saveRef.current && !saveRef.current.contains(e.target as Node))
        setSaveOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [saveOpen]);

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

  async function copy(text: string, which: "base" | "enhanced") {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "base") {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      } else {
        setEnhancedCopied(true);
        setTimeout(() => setEnhancedCopied(false), 1600);
      }
    } catch {
      /* unavailable */
    }
  }

  function exportPrompt() {
    const blob = new Blob([enhanced ?? prompt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vision-direction.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function enhance() {
    setEnhancing(true);
    const result = await enhancePrompt(prompt);
    setEnhanced(result);
    setEnhancing(false);
  }

  function doSave(tags: string[]) {
    savePrompt(tags);
    setSaveOpen(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
  }

  return (
    <div className="flex h-full flex-col">
      {/* tabs */}
      <div
        role="tablist"
        aria-label="Vision Studio views"
        className="flex items-center gap-1 overflow-x-auto border-b border-line px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          const count =
            t.id === "favorites"
              ? favorites.length
              : t.id === "history"
                ? history.length
                : t.id === "saved"
                  ? saved.length
                  : 0;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
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
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-faint">
                  Composed direction
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copy(prompt, "base")}
                    className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] text-muted transition-colors hover:border-faint hover:text-ink"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-accent-fg" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <div ref={saveRef} className="relative">
                    <button
                      onClick={() => setSaveOpen((v) => !v)}
                      aria-label="Save prompt"
                      className="grid size-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-faint hover:text-ink"
                    >
                      {justSaved ? (
                        <Check className="size-4 text-accent-fg" />
                      ) : (
                        <BookmarkSimple className="size-4" />
                      )}
                    </button>
                    {saveOpen && <SavePopover onSave={doSave} />}
                  </div>
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

              {/* enhancement */}
              <div className="mt-3">
                {!enhanced && (
                  <button
                    onClick={enhance}
                    disabled={enhancing}
                    className="inline-flex items-center gap-1.5 text-[13px] text-accent-fg transition-opacity hover:opacity-80 disabled:opacity-60"
                  >
                    <MagicWand
                      className={`size-4 ${enhancing ? "animate-pulse" : ""}`}
                    />
                    {enhancing ? "Enhancing..." : "Enhance with detail"}
                  </button>
                )}
                {enhanced && (
                  <div className="rounded-xl border border-accent/25 bg-accent/[0.05] p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-accent-fg">
                        <MagicWand className="size-3.5" />
                        Enhanced
                      </span>
                      <button
                        onClick={() => copy(enhanced, "enhanced")}
                        className="flex items-center gap-1.5 text-[12.5px] text-muted hover:text-ink"
                      >
                        {enhancedCopied ? (
                          <Check className="size-3.5 text-accent-fg" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                        {enhancedCopied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="mt-2 text-[14px] leading-relaxed text-ink">
                      {enhanced}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={generate}
                disabled={generating}
                className="relative mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[14px] font-medium text-accent-ink transition-colors hover:bg-[#d6f56b] disabled:opacity-80"
              >
                <Sparkle
                  weight="fill"
                  className={`size-4 ${generating ? "animate-pulse" : ""}`}
                />
                {generating ? "Generating..." : "Generate concepts"}
                {!generating && (
                  <kbd className="absolute right-3 hidden rounded bg-accent-ink/10 px-1.5 py-0.5 font-mono text-[11px] text-accent-ink/70 sm:inline">
                    ⌘⏎
                  </kbd>
                )}
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

              {generating && concepts.length === 0 ? (
                <SkeletonGrid />
              ) : concepts.length === 0 ? (
                <Onboarding onBrowsePresets={onBrowsePresets} />
              ) : filtered.length === 0 ? (
                <Empty
                  icon={<MagnifyingGlass className="size-6" />}
                  title="No matches"
                  body={`Nothing matches "${query}".`}
                />
              ) : (
                <Grid>
                  {generating && <SkeletonCards count={3} />}
                  {filtered.map((c) => (
                    <ConceptCard key={c.id} concept={c} />
                  ))}
                </Grid>
              )}
            </div>
          </div>
        )}

        {tab === "saved" &&
          (saved.length === 0 ? (
            <Empty
              icon={<BookmarkSimple className="size-6" />}
              title="No saved prompts"
              body="Save a composed direction from the bookmark above to reuse it later."
            />
          ) : (
            <div className="space-y-4">
              {allTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag className="size-3.5 text-faint" />
                  <FilterChip
                    label="All"
                    active={tagFilter === null}
                    onClick={() => setTagFilter(null)}
                  />
                  {allTags.map((t) => (
                    <FilterChip
                      key={t}
                      label={t}
                      active={tagFilter === t}
                      onClick={() => setTagFilter(t)}
                    />
                  ))}
                </div>
              )}
              <ul className="space-y-2.5">
                {filteredSaved.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-2xl border border-line bg-surface p-4"
                  >
                    <p className="text-[13px] leading-snug text-muted">
                      {s.prompt}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {s.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] text-accent-fg"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => {
                            restoreSaved(s);
                            setTab("canvas");
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] text-muted transition-colors hover:border-faint hover:text-ink"
                        >
                          <ArrowClockwise className="size-3.5" />
                          Load
                        </button>
                        <button
                          onClick={() => removeSaved(s.id)}
                          aria-label="Remove saved prompt"
                          className="grid size-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-faint hover:text-ink"
                        >
                          <Trash className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

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
                const items = concepts.filter((c) => c.collectionId === col.id);
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
                  <li key={h.id} className="flex items-start gap-3 p-4">
                    <p className="line-clamp-2 flex-1 text-[13px] leading-snug text-muted">
                      {h.prompt}
                    </p>
                    <button
                      onClick={() => {
                        restore(h);
                        setTab("canvas");
                      }}
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

function SavePopover({ onSave }: { onSave: (tags: string[]) => void }) {
  const [value, setValue] = useState("");
  function submit() {
    const tags = value
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    onSave(tags);
  }
  return (
    <div className="absolute right-0 top-10 z-20 w-64 rounded-xl border border-line bg-surface p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)]">
      <p className="mb-2 text-[12px] text-muted">Save prompt with tags</p>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="launch, hero, q4"
        className="h-9 w-full rounded-lg border border-line bg-bg px-3 text-[13px] text-ink placeholder:text-faint focus:border-faint focus:outline-none"
      />
      <button
        onClick={submit}
        className="mt-2 h-9 w-full rounded-lg bg-accent text-[13px] font-medium text-accent-ink hover:bg-[#d6f56b]"
      >
        Save
      </button>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md px-2 py-0.5 text-[12px] transition-colors ${
        active
          ? "bg-accent/[0.12] text-ink"
          : "text-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{children}</div>;
}

function SkeletonGrid() {
  return (
    <Grid>
      <SkeletonCards count={6} />
    </Grid>
  );
}

function SkeletonCards({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-line bg-surface"
        >
          <div className="aspect-[4/5] w-full animate-pulse bg-surface-2" />
          <div className="space-y-2 p-3.5">
            <div className="h-3 w-full animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-surface-2" />
          </div>
        </div>
      ))}
    </>
  );
}

function Onboarding({ onBrowsePresets }: { onBrowsePresets: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-14 text-center">
      <span className="grid size-12 place-items-center rounded-xl border border-line-soft bg-surface text-accent-fg">
        <Sparkle className="size-6" />
      </span>
      <p className="mt-4 text-[15px] font-medium text-ink">
        Start your first vision
      </p>
      <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-muted">
        Begin from a curated preset, or tune the controls on the left, then
        generate concepts.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={onBrowsePresets}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-accent-ink hover:bg-[#d6f56b]"
        >
          <SquaresFour className="size-4" />
          Browse presets
        </button>
      </div>
    </div>
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
