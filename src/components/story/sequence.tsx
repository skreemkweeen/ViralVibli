"use client";

import { useState, useMemo } from "react";
import {
  FilmSlate,
  Heart,
  MagnifyingGlass,
  X,
  Play,
} from "@phosphor-icons/react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { SlideCard } from "./slide-card";
import type { StoryConcept } from "@/lib/story/types";
import { StudioEmptyState, StudioLoadingState, StudioErrorState } from "@/components/studio";
import { useStory } from "@/lib/story/store";
import { getFramework } from "@/lib/story/frameworks";
import { platforms, optionLabel } from "@/lib/story/data";
import { StoryPhonePreview } from "./phone-preview";

type ConceptHeaderProps = {
  concept: StoryConcept;
  isOpen: boolean;
  onToggle: () => void;
  onFavorite: () => void;
  onRemove: () => void;
  onPreview: () => void;
};

function ConceptHeader({ concept, isOpen, onToggle, onFavorite, onRemove, onPreview }: ConceptHeaderProps) {
  const fw = getFramework(concept.direction.framework);
  const platform = optionLabel(platforms, concept.direction.platform) ?? concept.direction.platform;
  const date = new Date(concept.createdAt);
  const label =
    concept.label ??
    `${fw?.name ?? "Story"} - ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10">
          <FilmSlate className="size-4 text-accent-fg" weight="fill" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-medium text-ink">{label}</div>
          <div className="flex items-center gap-1.5 text-[12px] text-faint">
            <span>{platform}</span>
            <span>·</span>
            <span>{concept.slides.length} slides</span>
          </div>
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onPreview}
          aria-label="Open phone preview"
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-2.5 text-[12px] font-medium text-muted transition-colors hover:border-accent/40 hover:text-accent-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <Play className="size-3" weight="fill" />
          Preview
        </button>
        <button
          type="button"
          onClick={onFavorite}
          aria-label={concept.favorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={concept.favorite}
          className={`grid size-8 cursor-pointer place-items-center rounded-lg border border-line transition-colors hover:border-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
            concept.favorite ? "text-accent-fg" : "text-faint"
          }`}
        >
          <Heart className="size-3.5" weight={concept.favorite ? "fill" : "regular"} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Delete sequence"
          className="grid size-8 cursor-pointer place-items-center rounded-lg border border-line text-faint transition-colors hover:border-faint hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function ConceptBlock({ concept }: { concept: StoryConcept }) {
  const [open, setOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { toggleFavorite, removeConcept } = useStory();
  const reduce = useReducedMotion();

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <ConceptHeader
        concept={concept}
        isOpen={open}
        onToggle={() => setOpen((v) => !v)}
        onFavorite={() => toggleFavorite(concept.id)}
        onRemove={() => removeConcept(concept.id)}
        onPreview={() => setPreviewOpen(true)}
      />
      <StoryPhonePreview
        concept={concept}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? undefined : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-line/50 px-4 pb-4 pt-3">
              <div className="flex flex-col gap-3">
                {concept.slides.map((slide, i) => (
                  <SlideCard
                    key={i}
                    slide={slide}
                    draggable
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type FilterMode = "all" | "favorites";

export function StorySequence() {
  const { concepts, generating, generateError, cancelGeneration } = useStory();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
  const reduce = useReducedMotion();

  const filtered = useMemo(() => {
    let result = concepts;
    if (filter === "favorites") result = result.filter((c) => c.favorite);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.brief.toLowerCase().includes(q) ||
          c.label?.toLowerCase().includes(q) ||
          c.direction.framework.toLowerCase().includes(q),
      );
    }
    return result;
  }, [concepts, filter, search]);

  if (generating) {
    return (
      <div className="p-5">
        <StudioLoadingState
          count={3}
          aspect="unset"
        />
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={cancelGeneration}
            className="cursor-pointer rounded-lg border border-line bg-surface px-4 py-2 text-[13px] text-muted transition-colors hover:border-faint hover:text-ink active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (generateError) {
    return (
      <div className="p-5">
        <StudioErrorState message={generateError.message} hint="Check your connection and try again." />
      </div>
    );
  }

  if (concepts.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <StudioEmptyState
          icon={<FilmSlate className="size-8 text-faint" />}
          title="No stories yet"
          body="Configure your direction in the panel and hit Build story."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-1 rounded-xl border border-line bg-surface px-1 py-1">
          {(["all", "favorites"] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilter(mode)}
              className={`rounded-lg px-3 py-1 text-[13px] font-medium capitalize transition-colors ${
                filter === mode
                  ? "bg-accent/10 text-accent-fg"
                  : "text-faint hover:text-muted"
              }`}
            >
              {mode === "favorites" ? <Heart className="inline size-3.5 mr-1" />: null}{mode}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[160px]">
          <MagnifyingGlass className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stories…"
            className="h-8 w-full rounded-xl border border-line bg-surface pl-8 pr-3 text-[13px] text-ink placeholder:text-faint focus:border-accent/40 focus:outline-none"
          />
        </div>

        <div className="text-[12px] text-faint">
          {filtered.length} {filtered.length === 1 ? "story" : "stories"}
        </div>
      </div>

      {/* Results */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {filtered.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-[14px] text-faint">No stories match this filter.</p>
          </div>
        ) : (
          <motion.div
            layout={!reduce}
            className="flex flex-col gap-4"
          >
            {filtered.map((concept) => (
              <ConceptBlock key={concept.id} concept={concept} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
