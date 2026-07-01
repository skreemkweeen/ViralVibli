"use client";

import { useState, useCallback } from "react";
import {
  Vault,
  Heart,
  PushPin,
  GridFour,
  Plus,
  FolderSimplePlus,
  FolderSimple,
  Trash,
  Image,
  Megaphone,
  PenNib,
  FilmSlate,
  MagnifyingGlass,
  ChartBar,
  CodeBlock,
  Lightbulb,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { useVault } from "@/lib/vault/store";
import { categories } from "@/lib/vault/data";
import type { PromptCategory } from "@/lib/vault/types";

const CATEGORY_ICONS: Record<PromptCategory, Icon> = {
  "image-gen": Image,
  "social": Megaphone,
  "copywriting": PenNib,
  "video": FilmSlate,
  "research": MagnifyingGlass,
  "analysis": ChartBar,
  "code": CodeBlock,
  "creative": Lightbulb,
};

export function VaultControls() {
  const {
    prompts,
    filter,
    categoryCounts,
    setFilter,
    addPrompt,
    selectPrompt,
    collections,
    createCollection,
    removeCollection,
  } = useVault();

  const [quickText, setQuickText] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [addingCollection, setAddingCollection] = useState(false);

  const handleQuickAdd = useCallback(() => {
    const content = quickText.trim();
    if (!content) return;
    const id = addPrompt({
      title: content.slice(0, 60).replace(/\n/g, " ").trim(),
      content,
      category: "creative",
      tags: [],
    });
    selectPrompt(id);
    setQuickText("");
  }, [quickText, addPrompt, selectPrompt]);

  const handleCreateCollection = useCallback(() => {
    const name = newCollectionName.trim();
    if (!name) return;
    createCollection(name);
    setNewCollectionName("");
    setAddingCollection(false);
  }, [newCollectionName, createCollection]);

  const favCount = prompts.filter((p) => p.favorite).length;
  const pinnedCount = prompts.filter((p) => p.pinned).length;

  const navItem = (
    label: string,
    icon: React.ReactNode,
    count: number,
    active: boolean,
    onClick: () => void,
  ) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
        active
          ? "bg-accent/[0.08] text-accent-fg"
          : "text-muted hover:bg-surface-2 hover:text-ink"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className={active ? "text-accent-fg" : "text-faint"}>{icon}</span>
        <span className="text-[13px] font-medium">{label}</span>
      </div>
      {count > 0 && (
        <span className="min-w-[1.25rem] rounded-full bg-surface-2 px-1.5 py-0.5 text-center text-[11px] tabular-nums text-faint">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Quick add */}
      <div className="border-b border-line p-3">
        <textarea
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleQuickAdd();
          }}
          placeholder="Paste a prompt to save..."
          rows={3}
          className="w-full resize-none rounded-xl border border-line bg-bg px-3 py-2.5 text-[13px] text-ink placeholder:text-faint focus:border-accent/40 focus:outline-none"
          aria-label="Quick add prompt"
        />
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={!quickText.trim()}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent py-2 text-[13px] font-semibold text-black transition-opacity disabled:opacity-40"
        >
          <Plus className="size-3.5" weight="bold" />
          Save to Vault
        </button>
      </div>

      {/* Navigation */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {/* Library */}
        <div className="mb-1">
          <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-widest text-faint">
            Library
          </p>
          <div className="space-y-0.5">
            {navItem(
              "All Prompts",
              <GridFour className="size-4" />,
              prompts.length,
              filter.scope === "all" && !filter.category,
              () => setFilter({ scope: "all", category: null }),
            )}
            {navItem(
              "Favorites",
              <Heart className="size-4" />,
              favCount,
              filter.scope === "favorites",
              () => setFilter({ scope: "favorites", category: null }),
            )}
            {navItem(
              "Pinned",
              <PushPin className="size-4" />,
              pinnedCount,
              filter.scope === "pinned",
              () => setFilter({ scope: "pinned", category: null }),
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-1 mt-3">
          <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-widest text-faint">
            Categories
          </p>
          <div className="space-y-0.5">
            {categories.map((cat) => {
              const count = categoryCounts[cat.id] ?? 0;
              const active = filter.category === cat.id;
              const CatIcon = CATEGORY_ICONS[cat.id as PromptCategory];
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setFilter({
                      category: active ? null : (cat.id as PromptCategory),
                      scope: "all",
                    })
                  }
                  aria-pressed={active}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    active
                      ? "bg-accent/[0.08] text-accent-fg"
                      : "text-muted hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {CatIcon && <CatIcon className="size-4 shrink-0" />}
                    <span className="text-[13px] font-medium">{cat.label}</span>
                  </div>
                  {count > 0 && (
                    <span className="min-w-[1.25rem] rounded-full bg-surface-2 px-1.5 py-0.5 text-center text-[11px] tabular-nums text-faint">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Collections */}
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between px-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
              Collections
            </p>
            <button
              type="button"
              onClick={() => setAddingCollection((v) => !v)}
              aria-label="New collection"
              className="rounded-lg p-0.5 text-faint transition-colors hover:text-muted"
            >
              <FolderSimplePlus className="size-3.5" />
            </button>
          </div>

          {addingCollection && (
            <div className="mb-2 flex gap-1.5 px-1">
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateCollection();
                  if (e.key === "Escape") setAddingCollection(false);
                }}
                placeholder="Collection name"
                autoFocus
                className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-2.5 py-1.5 text-[12px] text-ink placeholder:text-faint focus:border-accent/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
                className="shrink-0 rounded-lg bg-accent px-2.5 py-1.5 text-[12px] font-semibold text-black disabled:opacity-40"
              >
                Add
              </button>
            </div>
          )}

          <div className="space-y-0.5">
            {collections.length === 0 && !addingCollection && (
              <p className="px-3 py-1 text-[12px] text-faint">No collections yet</p>
            )}
            {collections.map((col) => {
              const count = prompts.filter((p) => p.collectionId === col.id).length;
              return (
                <div key={col.id} className="group/col flex items-center justify-between rounded-xl px-3 py-2 hover:bg-surface-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <FolderSimple className="size-4 shrink-0 text-faint" />
                    <span className="truncate text-[13px] font-medium text-muted">
                      {col.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {count > 0 && (
                      <span className="min-w-[1.25rem] rounded-full bg-surface-2 px-1.5 py-0.5 text-center text-[11px] tabular-nums text-faint">
                        {count}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeCollection(col.id)}
                      aria-label={`Remove ${col.name} collection`}
                      className="ml-0.5 hidden rounded-lg p-0.5 text-faint transition-colors hover:text-red-400 group-hover/col:block"
                    >
                      <Trash className="size-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer — vault icon + prompt count */}
      <div className="border-t border-line px-4 py-3">
        <div className="flex items-center gap-2 text-faint">
          <Vault className="size-3.5" />
          <span className="text-[12px]">
            {prompts.length} {prompts.length === 1 ? "prompt" : "prompts"} saved
          </span>
        </div>
      </div>
    </div>
  );
}
