"use client";

import { useState, useCallback } from "react";
import {
  Copy,
  Heart,
  Trash,
  CopySimple,
  Eye,
  EyeSlash,
  ArrowsOutCardinal,
  FilmSlate,
  CheckCircle,
  Sparkle,
} from "@phosphor-icons/react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import type { StorySlide } from "@/lib/ai/types";
import { SlideTransformer } from "./slide-transformer";

type SlideCardProps = {
  slide: StorySlide;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
  draggable?: boolean;
  /**
   * When both are provided, per-slide AI actions become available. Without
   * them the slide is read-only (e.g. inside phone preview mode).
   */
  conceptId?: string;
  slideIndex?: number;
};

function copyToClipboard(text: string) {
  void navigator.clipboard.writeText(text);
}

export function SlideCard({
  slide,
  favorite = false,
  onToggleFavorite,
  onDuplicate,
  onRemove,
  draggable = false,
  conceptId,
  slideIndex,
}: SlideCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [copied, setCopied] = useState(false);
  const [transformerOpen, setTransformerOpen] = useState(false);
  const reduce = useReducedMotion();
  const canTransform = Boolean(conceptId && slideIndex !== undefined);

  const handleCopy = useCallback(() => {
    copyToClipboard(slide.copy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [slide.copy]);

  const hasStickerOrCta = slide.stickerRecommendation || slide.cta;

  return (
    <motion.article
      layout={!reduce}
      initial={reduce ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-line bg-surface"
      aria-label={`Slide ${slide.slide}`}
    >
      {/* Slide number badge */}
      <div className="absolute left-3.5 top-3.5 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-black/30 px-2 text-[11px] font-semibold tabular-nums text-white/80 backdrop-blur-sm">
        {slide.slide}
      </div>

      {/* Actions bar — appears on hover */}
      <div className="absolute right-2.5 top-2.5 flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        {draggable && (
          <button
            type="button"
            aria-label="Drag to reorder"
            className="grid size-7 cursor-grab place-items-center rounded-lg border border-line/60 bg-surface/80 text-faint backdrop-blur-sm transition-colors hover:text-muted active:cursor-grabbing"
          >
            <ArrowsOutCardinal className="size-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy slide copy"
          className="grid size-7 place-items-center rounded-lg border border-line/60 bg-surface/80 text-faint backdrop-blur-sm transition-colors hover:text-muted"
        >
          {copied ? (
            <motion.span
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              className="text-accent-fg"
            >
              <CheckCircle className="size-3.5" weight="fill" />
            </motion.span>
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
        {canTransform && (
          <button
            type="button"
            onClick={() => setTransformerOpen((v) => !v)}
            aria-label={transformerOpen ? "Hide AI actions" : "Open AI actions"}
            aria-pressed={transformerOpen}
            title="AI actions"
            className={`grid size-7 cursor-pointer place-items-center rounded-lg border backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
              transformerOpen
                ? "border-accent/50 bg-accent/10 text-accent-fg"
                : "border-line/60 bg-surface/80 text-faint hover:text-accent-fg"
            }`}
          >
            <Sparkle className="size-3.5" weight={transformerOpen ? "fill" : "regular"} />
          </button>
        )}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={favorite}
            className={`grid size-7 place-items-center rounded-lg border border-line/60 bg-surface/80 backdrop-blur-sm transition-colors ${
              favorite ? "text-accent-fg" : "text-faint hover:text-muted"
            }`}
          >
            <Heart className="size-3.5" weight={favorite ? "fill" : "regular"} />
          </button>
        )}
        {onDuplicate && (
          <button
            type="button"
            onClick={onDuplicate}
            aria-label="Duplicate slide"
            className="grid size-7 place-items-center rounded-lg border border-line/60 bg-surface/80 text-faint backdrop-blur-sm transition-colors hover:text-muted"
          >
            <CopySimple className="size-3.5" />
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove slide"
            className="grid size-7 place-items-center rounded-lg border border-line/60 bg-surface/80 text-faint backdrop-blur-sm transition-colors hover:text-red-400"
          >
            <Trash className="size-3.5" />
          </button>
        )}
      </div>

      {/* Main copy */}
      <div className="px-4 pb-3 pt-10">
        <p className="text-[15px] font-medium leading-snug text-ink">{slide.copy}</p>
      </div>

      {/* Visual suggestion */}
      <div className="mx-4 mb-3 rounded-xl border border-line/60 bg-bg px-3 py-2.5">
        <div className="mb-1 flex items-center gap-1.5">
          <FilmSlate className="size-3.5 shrink-0 text-faint" weight="fill" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-faint">
            Visual
          </span>
        </div>
        <p className="text-[13px] leading-relaxed text-muted">{slide.visualSuggestion}</p>
      </div>

      {/* Sticker + CTA row */}
      {hasStickerOrCta && (
        <div className="mx-4 mb-3 flex flex-wrap gap-2">
          {slide.stickerRecommendation && (
            <div className="flex items-center gap-1.5 rounded-lg border border-accent/20 bg-accent/[0.07] px-2.5 py-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-accent-fg">
                Sticker
              </span>
              <span className="text-[12.5px] text-ink">{slide.stickerRecommendation}</span>
            </div>
          )}
          {slide.cta && (
            <div className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-faint">
                CTA
              </span>
              <span className="text-[12.5px] font-medium text-ink">{slide.cta}</span>
            </div>
          )}
        </div>
      )}

      {/* Speaker notes — collapsible */}
      {slide.speakerNotes && (
        <div className="border-t border-line/50">
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            aria-expanded={showNotes}
            className="flex w-full items-center gap-1.5 px-4 py-2.5 text-left text-faint transition-colors hover:text-muted"
          >
            {showNotes ? (
              <EyeSlash className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
            <span className="text-[12px] font-medium">Creator notes</span>
          </button>
          <AnimatePresence initial={false}>
            {showNotes && (
              <motion.div
                initial={reduce ? undefined : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <p className="px-4 pb-3 text-[12.5px] italic leading-relaxed text-muted">
                  {slide.speakerNotes}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Slide-level AI transformer — mounted only when the parent supplies
          a concept ID + slide index (Sequence view). Read-only surfaces
          like phone preview never opt in. */}
      {canTransform && (
        <SlideTransformer
          conceptId={conceptId!}
          slideIndex={slideIndex!}
          currentCopy={slide.copy}
          open={transformerOpen}
          onOpenChange={setTransformerOpen}
        />
      )}
    </motion.article>
  );
}
