"use client";

/**
 * Storyboard Canvas — the center-of-workspace surface where a creator
 * drafts a story visually. Rich slide cards support inline title / body
 * edits, quick status + color labels, expand / collapse, and the six
 * documented slide operations (add / duplicate / split / merge / move
 * up / move down / remove).
 */

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CaretDown,
  CaretRight,
  ChatCircle,
  Copy,
  DotsSixVertical,
  ArrowsMerge,
  Plus,
  Scissors,
  Trash,
} from "@phosphor-icons/react";
import { useStory } from "@/lib/story/store";
import { SLIDE_COLORS, statusCounts, totalDurationSeconds, type RichSlide, type SlideColor } from "@/lib/story/story-slides";

export function StoryboardCanvas({
  onOpenSlide,
}: {
  onOpenSlide: (id: string) => void;
}) {
  const {
    workingSlides,
    addSlide,
    updateSlide,
    removeSlideById,
    moveSlideById,
    duplicateSlideById,
    splitSlideById,
    mergeSlideById,
  } = useStory();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const durationTotal = useMemo(() => totalDurationSeconds(workingSlides), [workingSlides]);
  const status = useMemo(() => statusCounts(workingSlides), [workingSlides]);

  return (
    <section className="flex h-full flex-col">
      {/* Toolbar */}
      <header className="flex items-center gap-2 border-b border-line px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">Storyboard</p>
        <span className="text-[12px] text-muted">
          {workingSlides.length} slide{workingSlides.length === 1 ? "" : "s"} · {durationTotal}s
        </span>
        <span className="hidden text-[11px] text-faint sm:inline">
          {status.ready} ready · {status.shot} shot · {status.published} published
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const id = addSlide();
              setSelectedId(id);
            }}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 text-[12px] font-medium text-ink hover:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <Plus className="size-3" weight="bold" />
            Add slide
          </button>
          {selectedId && workingSlides.length > 1 && (
            <button
              type="button"
              onClick={() => {
                const idx = workingSlides.findIndex((s) => s.id === selectedId);
                if (idx === -1 || idx === workingSlides.length - 1) return;
                mergeSlideById(selectedId, workingSlides[idx + 1]!.id);
              }}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[12px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <ArrowsMerge className="size-3" weight="bold" />
              Merge with next
            </button>
          )}
        </div>
      </header>

      {/* Canvas */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {workingSlides.length === 0 ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-line bg-bg text-center">
            <p className="text-[13px] text-muted">Empty storyboard.</p>
            <p className="mt-0.5 text-[11px] text-faint">
              Add a slide, load a generated concept, or pick a campaign template from the tool rail.
            </p>
            <button
              type="button"
              onClick={() => {
                const id = addSlide();
                setSelectedId(id);
              }}
              className="mt-3 inline-flex cursor-pointer items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 text-[12px] font-medium text-ink hover:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <Plus className="size-3" weight="bold" />
              Add first slide
            </button>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {workingSlides.map((slide) => (
              <SlideCard
                key={slide.id}
                slide={slide}
                active={slide.id === selectedId}
                onSelect={() => setSelectedId(slide.id)}
                onChangeTitle={(v) => updateSlide(slide.id, { title: v })}
                onChangeBody={(v) => updateSlide(slide.id, { body: v })}
                onToggleCollapse={() => updateSlide(slide.id, { collapsed: !slide.collapsed })}
                onCycleColor={() => {
                  const idx = SLIDE_COLORS.indexOf(slide.color);
                  const next = SLIDE_COLORS[(idx + 1) % SLIDE_COLORS.length] as SlideColor;
                  updateSlide(slide.id, { color: next });
                }}
                onMoveUp={() => moveSlideById(slide.id, slide.index - 1)}
                onMoveDown={() => moveSlideById(slide.id, slide.index + 1)}
                onDuplicate={() => duplicateSlideById(slide.id)}
                onSplit={() => splitSlideById(slide.id)}
                onRemove={() => removeSlideById(slide.id)}
                onOpen={() => onOpenSlide(slide.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ─── Slide card ───────────────────────────────────────────────────────────

const COLOR_BG: Record<SlideColor, string> = {
  none: "bg-bg",
  red: "bg-rose-500/[0.06]",
  amber: "bg-amber-500/[0.06]",
  lime: "bg-lime-500/[0.06]",
  emerald: "bg-emerald-500/[0.06]",
  cyan: "bg-cyan-500/[0.06]",
  violet: "bg-violet-500/[0.06]",
  pink: "bg-pink-500/[0.06]",
};

const COLOR_DOT: Record<SlideColor, string> = {
  none: "bg-line",
  red: "bg-rose-400",
  amber: "bg-amber-400",
  lime: "bg-lime-400",
  emerald: "bg-emerald-400",
  cyan: "bg-cyan-400",
  violet: "bg-violet-400",
  pink: "bg-pink-400",
};

function SlideCard({
  slide,
  active,
  onSelect,
  onChangeTitle,
  onChangeBody,
  onToggleCollapse,
  onCycleColor,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onSplit,
  onRemove,
  onOpen,
}: {
  slide: RichSlide;
  active: boolean;
  onSelect: () => void;
  onChangeTitle: (v: string) => void;
  onChangeBody: (v: string) => void;
  onToggleCollapse: () => void;
  onCycleColor: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onSplit: () => void;
  onRemove: () => void;
  onOpen: () => void;
}) {
  return (
    <li
      className={`rounded-xl border transition-colors ${COLOR_BG[slide.color]} ${
        active ? "border-accent/70 shadow-[0_0_0_1px_var(--accent)]" : "border-line hover:border-faint"
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect();
      }}
    >
      <header className="flex items-center gap-1 border-b border-line/60 px-3 py-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCycleColor();
          }}
          aria-label={`Change color label (currently ${slide.color})`}
          className={`size-3 shrink-0 cursor-pointer rounded-full border border-line ${COLOR_DOT[slide.color]}`}
        />
        <DotsSixVertical className="size-3 text-faint" />
        <span className="text-[11px] uppercase tracking-widest text-faint">#{slide.index + 1}</span>
        <span className="ml-1 text-[10px] tabular-nums text-faint">{slide.duration}s</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="ml-auto cursor-pointer rounded-md p-0.5 text-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label={slide.collapsed ? "Expand slide" : "Collapse slide"}
        >
          {slide.collapsed ? <CaretRight className="size-3" weight="bold" /> : <CaretDown className="size-3" weight="bold" />}
        </button>
      </header>
      <div className="grid gap-2 px-3 py-3">
        <input
          value={slide.title}
          onChange={(e) => onChangeTitle(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="Title / hook…"
          className="w-full border-0 bg-transparent p-0 text-[14px] font-semibold text-ink placeholder:text-faint focus:outline-none focus:ring-0"
          aria-label={`Slide ${slide.index + 1} title`}
        />
        {!slide.collapsed && (
          <textarea
            value={slide.body}
            onChange={(e) => onChangeBody(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Body copy…"
            rows={3}
            className="w-full resize-none border-0 bg-transparent p-0 text-[12.5px] leading-relaxed text-ink placeholder:text-faint focus:outline-none focus:ring-0"
            aria-label={`Slide ${slide.index + 1} body`}
          />
        )}
        <div className="flex items-center gap-1 text-[10.5px] text-faint">
          <span className="rounded-full border border-line px-1.5 py-0.5 uppercase tracking-widest">{slide.goal}</span>
          <span className="rounded-full border border-line px-1.5 py-0.5 uppercase tracking-widest">{slide.emotion}</span>
          <span className="rounded-full border border-line px-1.5 py-0.5">{slide.status}</span>
          {slide.comments.length > 0 && (
            <span className="ml-auto inline-flex items-center gap-0.5">
              <ChatCircle className="size-2.5" weight="bold" />
              {slide.comments.length}
            </span>
          )}
        </div>
      </div>
      <footer className="flex items-center gap-1 border-t border-line/60 px-2 py-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          aria-label="Move slide up"
          className="cursor-pointer rounded-md p-1 text-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <ArrowUp className="size-3" weight="bold" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          aria-label="Move slide down"
          className="cursor-pointer rounded-md p-1 text-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <ArrowDown className="size-3" weight="bold" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          aria-label="Duplicate slide"
          className="cursor-pointer rounded-md p-1 text-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <Copy className="size-3" weight="bold" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSplit();
          }}
          aria-label="Split slide"
          className="cursor-pointer rounded-md p-1 text-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <Scissors className="size-3" weight="bold" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="ml-auto rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          Inspect
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Remove this slide?")) onRemove();
          }}
          aria-label="Remove slide"
          className="cursor-pointer rounded-md p-1 text-faint hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <Trash className="size-3" weight="bold" />
        </button>
      </footer>
    </li>
  );
}
