"use client";

import { useRef } from "react";
import {
  MagnifyingGlass,
  SortAscending,
  X,
  Vault,
} from "@phosphor-icons/react";
import { AnimatePresence } from "motion/react";
import { useVault } from "@/lib/vault/store";
import { categories, platforms } from "@/lib/vault/data";
import { PromptCard } from "./prompt-card";
import type { SortMode } from "@/lib/vault/types";

const sortOptions: { id: SortMode; label: string }[] = [
  { id: "recent", label: "Recent" },
  { id: "popular", label: "Most used" },
  { id: "alphabetical", label: "A – Z" },
];

export function VaultPromptGrid() {
  const {
    filteredPrompts,
    selectedId,
    filter,
    sort,
    setFilter,
    setSort,
    selectPrompt,
    toggleFavorite,
    togglePinned,
  } = useVault();

  const searchRef = useRef<HTMLInputElement>(null);

  const hasActiveFilters =
    filter.category !== null || filter.platform !== null || filter.scope !== "all";

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
          <input
            ref={searchRef}
            type="text"
            value={filter.search}
            onChange={(e) => setFilter({ search: e.target.value })}
            placeholder="Search prompts..."
            className="w-full rounded-xl border border-line bg-bg py-2 pl-8 pr-3 text-[13px] text-ink placeholder:text-faint focus:border-accent/40 focus:outline-none"
            aria-label="Search prompts"
          />
          {filter.search && (
            <button
              type="button"
              onClick={() => setFilter({ search: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-faint hover:text-muted"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <label className="sr-only" htmlFor="vault-sort">Sort by</label>
          <div className="flex items-center gap-1.5 rounded-xl border border-line bg-bg px-3 py-2">
            <SortAscending className="size-3.5 shrink-0 text-faint" />
            <select
              id="vault-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="bg-transparent text-[13px] text-muted focus:outline-none"
            >
              {sortOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const active = filter.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setFilter({ category: active ? null : cat.id, scope: "all" })
                }
                aria-pressed={active}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  active
                    ? "bg-accent/[0.12] text-accent-fg ring-1 ring-accent/30"
                    : "bg-surface-2 text-muted hover:text-ink"
                }`}
              >
                <span className="text-[11px]">{cat.icon}</span>
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Platform filter */}
        <div className="ml-auto flex items-center gap-1.5">
          <label className="sr-only" htmlFor="vault-platform">Platform</label>
          <select
            id="vault-platform"
            value={filter.platform ?? ""}
            onChange={(e) =>
              setFilter({ platform: e.target.value ? (e.target.value as never) : null })
            }
            className="rounded-xl border border-line bg-bg px-2.5 py-1.5 text-[12px] text-muted focus:outline-none"
          >
            <option value="">All platforms</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => setFilter({ category: null, platform: null, scope: "all", search: "" })}
              className="flex items-center gap-1 rounded-xl border border-line bg-bg px-2.5 py-1.5 text-[12px] text-muted transition-colors hover:text-ink"
            >
              <X className="size-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 py-2">
        <p className="text-[12px] text-faint">
          {filteredPrompts.length} {filteredPrompts.length === 1 ? "prompt" : "prompts"}
          {filter.search && ` matching "${filter.search}"`}
        </p>
      </div>

      {/* Grid */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {filteredPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="grid size-14 place-items-center rounded-2xl border border-line bg-surface-2 text-faint">
              <Vault className="size-6" />
            </div>
            <div className="space-y-1.5">
              <p className="text-[14px] font-medium text-ink">
                {filter.search ? "No matching prompts" : "No prompts here yet"}
              </p>
              <p className="max-w-xs text-[13px] leading-relaxed text-muted">
                {filter.search
                  ? "Try a different search term or clear filters."
                  : "Paste a prompt in the left panel to get started."}
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredPrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  selected={selectedId === prompt.id}
                  onSelect={() => selectPrompt(selectedId === prompt.id ? null : prompt.id)}
                  onToggleFavorite={() => toggleFavorite(prompt.id)}
                  onTogglePinned={() => togglePinned(prompt.id)}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
