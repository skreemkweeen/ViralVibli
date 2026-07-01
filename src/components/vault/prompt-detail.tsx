"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  X,
  Copy,
  Trash,
  CheckCircle,
  Sparkle,
  Check,
  CaretDown,
  ClockCounterClockwise,
  ArrowCounterClockwise,
  Plus,
  Code,
  LinkSimple,
} from "@phosphor-icons/react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useVault } from "@/lib/vault/store";
import { categories, platforms, transformOps } from "@/lib/vault/data";
import type {
  PromptCategory,
  PromptEntry,
  PromptPlatform,
  TransformOp,
} from "@/lib/vault/types";
import { extractVariables } from "@/lib/vault/variables";

export function VaultPromptDetail() {
  const {
    prompts,
    selectedId,
    transforming,
    transformError,
    transformResult,
    selectPrompt,
    updatePrompt,
    removePrompt,
    toggleFavorite,
    togglePinned,
    incrementUsage,
    transformPrompt,
    cancelTransform,
    acceptTransform,
    rejectTransform,
    clearTransformError,
  } = useVault();

  const reduce = useReducedMotion();
  const prompt = prompts.find((p) => p.id === selectedId) ?? null;

  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState<PromptCategory>("creative");
  const [editPlatform, setEditPlatform] = useState<PromptPlatform | "">("");
  const [selectedOp, setSelectedOp] = useState<TransformOp>("improve");
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [tagDraft, setTagDraft] = useState("");

  // Sync local edit state when selection changes
  useEffect(() => {
    if (!prompt) return;
    setEditTitle(prompt.title);
    setEditContent(prompt.content);
    setEditDescription(prompt.description ?? "");
    setEditCategory(prompt.category);
    setEditPlatform(prompt.platform ?? "");
    setDirty(false);
    setShowHistory(false);
    setTagDraft("");
  }, [prompt?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(() => {
    if (!prompt) return;
    updatePrompt(prompt.id, {
      title: editTitle.trim() || editContent.slice(0, 60),
      content: editContent,
      description: editDescription.trim() || undefined,
      category: editCategory,
      platform: editPlatform || undefined,
    });
    setDirty(false);
  }, [
    prompt,
    editTitle,
    editContent,
    editDescription,
    editCategory,
    editPlatform,
    updatePrompt,
  ]);

  // Variables extracted from the live editor content so the list updates as
  // the user types (no store round-trip).
  const variables = useMemo(() => extractVariables(editContent), [editContent]);

  // Related prompts: highest tag overlap, exclude the current one, cap at 4.
  const related = useMemo<PromptEntry[]>(() => {
    if (!prompt || prompt.tags.length === 0) return [];
    const mine = new Set(prompt.tags);
    return prompts
      .filter((p) => p.id !== prompt.id && p.tags.some((t) => mine.has(t)))
      .map((p) => ({
        entry: p,
        score: p.tags.filter((t) => mine.has(t)).length,
      }))
      .sort((a, b) => b.score - a.score || b.entry.updatedAt - a.entry.updatedAt)
      .slice(0, 4)
      .map((x) => x.entry);
  }, [prompt, prompts]);

  const addTag = useCallback(
    (raw: string) => {
      if (!prompt) return;
      const tag = raw.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 40);
      if (!tag) return;
      if (prompt.tags.includes(tag)) return;
      updatePrompt(prompt.id, { tags: [...prompt.tags, tag] });
    },
    [prompt, updatePrompt],
  );

  const removeTag = useCallback(
    (tag: string) => {
      if (!prompt) return;
      updatePrompt(prompt.id, { tags: prompt.tags.filter((t) => t !== tag) });
    },
    [prompt, updatePrompt],
  );

  const handleCopy = useCallback(() => {
    if (!prompt) return;
    void navigator.clipboard.writeText(prompt.content);
    incrementUsage(prompt.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [prompt, incrementUsage]);

  const handleDelete = useCallback(() => {
    if (!prompt) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), 3000);
      return;
    }
    removePrompt(prompt.id);
  }, [prompt, confirmingDelete, removePrompt]);

  const handleTransform = useCallback(() => {
    if (!prompt) return;
    transformPrompt(prompt.id, selectedOp);
  }, [prompt, selectedOp, transformPrompt]);

  const handleRestoreVersion = useCallback(
    (content: string) => {
      setEditContent(content);
      setDirty(true);
    },
    [],
  );

  if (!prompt) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => {
              setEditTitle(e.target.value);
              setDirty(true);
            }}
            className="w-full bg-transparent text-[14px] font-semibold text-ink placeholder:text-faint focus:outline-none"
            placeholder="Untitled prompt"
            aria-label="Prompt title"
          />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy prompt"
            className="grid min-h-[44px] min-w-[44px] place-items-center rounded-lg border border-line text-faint transition-colors hover:text-muted"
          >
            {copied ? (
              <CheckCircle className="size-3.5 text-accent-fg" weight="fill" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => selectPrompt(null)}
            aria-label="Close detail panel"
            className="grid min-h-[44px] min-w-[44px] place-items-center rounded-lg border border-line text-faint transition-colors hover:text-muted"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {/* Category + Platform row */}
        <div className="mb-4 flex flex-wrap gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-faint">
              Category
            </label>
            <div className="relative">
              <select
                value={editCategory}
                onChange={(e) => {
                  setEditCategory(e.target.value as PromptCategory);
                  setDirty(true);
                }}
                className="appearance-none rounded-xl border border-line bg-bg py-1.5 pl-3 pr-7 text-[13px] text-ink focus:border-accent/40 focus:outline-none"
                aria-label="Category"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
              <CaretDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-faint" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-faint">
              Platform
            </label>
            <div className="relative">
              <select
                value={editPlatform}
                onChange={(e) => {
                  setEditPlatform(e.target.value as PromptPlatform | "");
                  setDirty(true);
                }}
                className="appearance-none rounded-xl border border-line bg-bg py-1.5 pl-3 pr-7 text-[13px] text-ink focus:border-accent/40 focus:outline-none"
                aria-label="Platform"
              >
                <option value="">Any</option>
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <CaretDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-faint" />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-faint">
            Description
          </label>
          <textarea
            value={editDescription}
            onChange={(e) => {
              setEditDescription(e.target.value);
              setDirty(true);
            }}
            rows={2}
            placeholder="What is this prompt for? One-liner is fine."
            className="w-full resize-none rounded-xl border border-line bg-bg px-3.5 py-2 text-[12.5px] italic leading-relaxed text-muted placeholder:text-faint focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            aria-label="Prompt description"
          />
        </div>

        {/* Content editor */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-faint">
            Prompt
          </label>
          <textarea
            value={editContent}
            onChange={(e) => {
              setEditContent(e.target.value);
              setDirty(true);
            }}
            rows={8}
            className="w-full resize-none rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[13px] leading-relaxed text-ink placeholder:text-faint focus:border-accent/40 focus:outline-none"
            aria-label="Prompt content"
          />
          {dirty && (
            <button
              type="button"
              onClick={handleSave}
              className="mt-2 flex cursor-pointer items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-[13px] font-semibold text-accent-ink transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <Check className="size-3.5" weight="bold" />
              Save changes
            </button>
          )}
        </div>

        {/* Variables — surfaces {token} placeholders live from the editor */}
        {variables.length > 0 && (
          <div className="mb-4">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Code className="size-3 text-faint" weight="bold" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                Variables
              </p>
              <span className="ml-1 rounded-full border border-line-soft bg-bg px-1.5 py-0 text-[10px] tabular-nums text-faint">
                {variables.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {variables.map((v) => (
                <span
                  key={v}
                  className="rounded-md border border-accent/30 bg-accent/[0.06] px-2 py-0.5 font-mono text-[11.5px] text-accent-fg"
                >
                  {`{${v}}`}
                </span>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-faint">
              Use these tokens as slots the AI fills at runtime.
            </p>
          </div>
        )}

        {/* Tags editor */}
        <div className="mb-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {prompt.tags.map((tag) => (
              <span
                key={tag}
                className="group inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 py-0.5 pl-2.5 pr-1 text-[12px] text-muted"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                  className="grid size-4 cursor-pointer place-items-center rounded-full text-faint transition-colors hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                >
                  <X className="size-2.5" weight="bold" />
                </button>
              </span>
            ))}
            <div className="inline-flex items-center gap-1">
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(tagDraft);
                    setTagDraft("");
                  } else if (e.key === "Backspace" && !tagDraft && prompt.tags.length) {
                    removeTag(prompt.tags[prompt.tags.length - 1]);
                  }
                }}
                placeholder="Add tag"
                className="w-24 rounded-full border border-line bg-bg px-2.5 py-0.5 text-[12px] text-ink placeholder:text-faint focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                aria-label="Add tag"
              />
              {tagDraft && (
                <button
                  type="button"
                  onClick={() => {
                    addTag(tagDraft);
                    setTagDraft("");
                  }}
                  aria-label="Add tag"
                  className="grid size-6 cursor-pointer place-items-center rounded-full bg-accent text-accent-ink transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  <Plus className="size-3" weight="bold" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Related prompts by tag overlap */}
        {related.length > 0 && (
          <div className="mb-4">
            <div className="mb-2 flex items-center gap-1.5">
              <LinkSimple className="size-3 text-faint" weight="bold" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                Related prompts
              </p>
            </div>
            <ul className="space-y-1">
              {related.map((r) => {
                const shared = r.tags.filter((t) => prompt.tags.includes(t));
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => selectPrompt(r.id)}
                      className="flex w-full cursor-pointer items-start gap-2 rounded-lg border border-line-soft bg-bg px-3 py-2 text-left transition-colors hover:border-faint hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium text-ink">
                          {r.title}
                        </span>
                        <span className="mt-0.5 flex flex-wrap gap-1">
                          {shared.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="rounded-full border border-accent/30 bg-accent/[0.06] px-1.5 py-0 text-[9.5px] text-accent-fg"
                            >
                              {t}
                            </span>
                          ))}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-md border border-line/60 bg-bg px-1.5 py-0.5 text-[10px] tabular-nums text-faint">
                        {r.usageCount}×
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* AI Transform */}
        <div className="mb-4 rounded-2xl border border-line bg-surface-2 p-3.5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkle className="size-4 text-accent-fg" weight="fill" />
            <p className="text-[13px] font-semibold text-ink">Transform</p>
          </div>

          {/* Op selector */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {transformOps.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => setSelectedOp(op.id)}
                aria-pressed={selectedOp === op.id}
                title={op.description}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  selectedOp === op.id
                    ? "bg-accent/[0.12] text-accent-fg ring-1 ring-accent/30"
                    : "bg-bg text-muted hover:text-ink"
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>

          {/* Run / cancel */}
          <button
            type="button"
            onClick={transforming ? cancelTransform : handleTransform}
            className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-2 text-[13px] font-semibold transition-colors active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
              transforming
                ? "border border-line text-muted hover:text-ink"
                : "bg-accent text-accent-ink hover:opacity-90"
            }`}
          >
            {transforming ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Transforming...
              </>
            ) : (
              <>
                <Sparkle className="size-3.5" weight="fill" />
                {transformOps.find((o) => o.id === selectedOp)?.label ?? "Transform"}
              </>
            )}
          </button>

          {/* Error */}
          <AnimatePresence>
            {transformError && (
              <motion.div
                initial={reduce ? undefined : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex items-start justify-between gap-2 rounded-xl border border-red-900/40 bg-red-950/30 p-3">
                  <p className="text-[12.5px] text-red-400">{transformError}</p>
                  <button
                    type="button"
                    onClick={clearTransformError}
                    className="shrink-0 cursor-pointer rounded text-red-400/60 transition-colors hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                    aria-label="Dismiss error"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {transformResult && transformResult.promptId === prompt.id && (
              <motion.div
                initial={reduce ? undefined : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-3 rounded-xl border border-accent/30 bg-accent/[0.05] p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-accent-fg">
                    Result
                  </p>

                  {/* Single result or variations */}
                  {transformResult.variations && transformResult.variations.length > 0 ? (
                    <div className="space-y-2">
                      {transformResult.variations.map((v, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-line/60 bg-bg p-2.5 text-[12.5px] leading-relaxed text-ink"
                        >
                          {v}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12.5px] leading-relaxed text-ink">
                      {transformResult.content}
                    </p>
                  )}

                  {/* Accept / Reject */}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={acceptTransform}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-accent py-2 text-[13px] font-semibold text-accent-ink transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                    >
                      <Check className="size-3.5" weight="bold" />
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={rejectTransform}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-line py-2 text-[13px] font-medium text-muted transition-colors hover:text-ink active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line"
                    >
                      <X className="size-3.5" />
                      Discard
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Version history */}
        {prompt.versions.length > 0 && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              aria-expanded={showHistory}
              className="flex w-full items-center justify-between rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-left text-faint transition-colors hover:text-muted"
            >
              <div className="flex items-center gap-2">
                <ClockCounterClockwise className="size-3.5" />
                <span className="text-[13px] font-medium">
                  Version history ({prompt.versions.length})
                </span>
              </div>
              <CaretDown
                className={`size-3.5 transition-transform ${showHistory ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {showHistory && (
                <motion.div
                  initial={reduce ? undefined : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 space-y-2 rounded-xl border border-line bg-bg p-2.5">
                    {prompt.versions.map((ver, idx) => (
                      <div key={ver.id} className="group/ver rounded-lg border border-line p-2.5">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-faint">
                            v{prompt.versions.length - idx}
                            {ver.note && ` — ${ver.note}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRestoreVersion(ver.content)}
                            aria-label="Restore this version"
                            className="hidden items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] text-faint hover:text-accent-fg group-hover/ver:flex"
                          >
                            <ArrowCounterClockwise className="size-3" />
                            Restore
                          </button>
                        </div>
                        <p className="line-clamp-2 text-[12px] leading-relaxed text-muted">
                          {ver.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Meta */}
        <div className="mb-4 space-y-1">
          <p className="text-[12px] text-faint">
            Used {prompt.usageCount} {prompt.usageCount === 1 ? "time" : "times"}
          </p>
          <p className="text-[12px] text-faint">
            Source: {prompt.source === "seed" ? "Built-in" : "Your prompt"}
          </p>
        </div>
      </div>

      {/* Footer — favorite, pin, delete */}
      <div className="flex shrink-0 items-center justify-between border-t border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleFavorite(prompt.id)}
            aria-pressed={prompt.favorite}
            aria-label={prompt.favorite ? "Remove from favorites" : "Add to favorites"}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-medium transition-colors ${
              prompt.favorite
                ? "border-accent/40 bg-accent/[0.08] text-accent-fg"
                : "border-line text-faint hover:text-muted"
            }`}
          >
            {prompt.favorite ? "Favorited" : "Favorite"}
          </button>
          <button
            type="button"
            onClick={() => togglePinned(prompt.id)}
            aria-pressed={prompt.pinned}
            aria-label={prompt.pinned ? "Unpin" : "Pin prompt"}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-medium transition-colors ${
              prompt.pinned
                ? "border-accent/40 bg-accent/[0.08] text-accent-fg"
                : "border-line text-faint hover:text-muted"
            }`}
          >
            {prompt.pinned ? "Pinned" : "Pin"}
          </button>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          aria-label={confirmingDelete ? "Confirm delete" : "Delete prompt"}
          className={`flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-medium transition-colors ${
            confirmingDelete
              ? "border-red-900/50 bg-red-950/20 text-red-400"
              : "border-line text-faint hover:border-red-900/50 hover:text-red-400"
          }`}
        >
          <Trash className="size-3.5" />
          {confirmingDelete ? "Confirm?" : "Delete"}
        </button>
      </div>
    </div>
  );
}
