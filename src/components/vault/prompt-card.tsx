"use client";

import { useState, useCallback } from "react";
import {
  Copy,
  Heart,
  PushPin,
  ArrowSquareOut,
  CheckCircle,
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
import { motion, useReducedMotion } from "motion/react";
import type { PromptEntry, PromptCategory } from "@/lib/vault/types";
import { categories } from "@/lib/vault/data";

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

type PromptCardProps = {
  prompt: PromptEntry;
  selected?: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onTogglePinned: () => void;
};

export function PromptCard({
  prompt,
  selected = false,
  onSelect,
  onToggleFavorite,
  onTogglePinned,
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const reduce = useReducedMotion();

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      void navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    },
    [prompt.content],
  );

  const handleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFavorite();
    },
    [onToggleFavorite],
  );

  const handlePin = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onTogglePinned();
    },
    [onTogglePinned],
  );

  const category = categories.find((c) => c.id === prompt.category);
  const CategoryIcon = CATEGORY_ICONS[prompt.category];

  return (
    <motion.article
      layout={!reduce}
      initial={reduce ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      aria-pressed={selected}
      aria-label={prompt.title}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
        selected
          ? "border-accent/50 bg-surface ring-1 ring-accent/20"
          : "border-line bg-surface hover:border-line/80 hover:bg-surface"
      }`}
    >
      {/* Pin indicator */}
      {prompt.pinned && (
        <div className="absolute left-3 top-3 text-accent-fg">
          <PushPin className="size-3" weight="fill" />
        </div>
      )}

      {/* Hover action bar */}
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy prompt"
          className="grid size-7 place-items-center rounded-lg border border-line/60 bg-surface/90 text-faint backdrop-blur-sm transition-colors hover:text-muted"
        >
          {copied ? (
            <motion.span
              initial={reduce ? undefined : { scale: 0.6 }}
              animate={{ scale: 1 }}
              className="text-accent-fg"
            >
              <CheckCircle className="size-3.5" weight="fill" />
            </motion.span>
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={handleFavorite}
          aria-label={prompt.favorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={prompt.favorite}
          className={`grid size-7 place-items-center rounded-lg border border-line/60 bg-surface/90 backdrop-blur-sm transition-colors ${
            prompt.favorite ? "text-accent-fg" : "text-faint hover:text-muted"
          }`}
        >
          <Heart className="size-3.5" weight={prompt.favorite ? "fill" : "regular"} />
        </button>
        <button
          type="button"
          onClick={handlePin}
          aria-label={prompt.pinned ? "Unpin" : "Pin prompt"}
          aria-pressed={prompt.pinned}
          className={`grid size-7 place-items-center rounded-lg border border-line/60 bg-surface/90 backdrop-blur-sm transition-colors ${
            prompt.pinned ? "text-accent-fg" : "text-faint hover:text-muted"
          }`}
        >
          <PushPin className="size-3.5" weight={prompt.pinned ? "fill" : "regular"} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          aria-label="Open prompt"
          className="grid size-7 place-items-center rounded-lg border border-line/60 bg-surface/90 text-faint backdrop-blur-sm transition-colors hover:text-muted"
        >
          <ArrowSquareOut className="size-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className={`px-3.5 pb-3 ${prompt.pinned ? "pt-7" : "pt-3.5"}`}>
        <h3 className="mb-1.5 line-clamp-1 text-[13px] font-semibold text-ink">
          {prompt.title}
        </h3>
        <p className="line-clamp-3 text-[12px] leading-relaxed text-muted">
          {prompt.content}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-line/50 px-3.5 py-2">
        <div className="flex items-center gap-1.5">
          {category && (
            <span className="flex items-center gap-1 rounded-md border border-line/60 bg-bg px-1.5 py-0.5 text-[11px] font-medium text-faint">
              {CategoryIcon && <CategoryIcon className="size-3 shrink-0" />}
              {category.label}
            </span>
          )}
          {prompt.platform && (
            <span className="rounded-md border border-line/60 bg-bg px-1.5 py-0.5 text-[11px] text-faint">
              {prompt.platform}
            </span>
          )}
        </div>
        {prompt.usageCount > 0 && (
          <span className="text-[11px] tabular-nums text-faint">
            {prompt.usageCount}×
          </span>
        )}
      </div>
    </motion.article>
  );
}
