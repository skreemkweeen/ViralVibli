"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Heart,
  Copy,
  Check,
  BookmarkSimple,
  Trash,
  Plus,
} from "@phosphor-icons/react";
import { useVision, type Concept } from "@/lib/vision/vision-store";
import { conceptGradient } from "@/lib/vision/prompt";
import { categories, aspects, styles, optionLabel } from "@/lib/vision/data";

export function ConceptCard({ concept }: { concept: Concept }) {
  const { toggleFavorite, removeConcept, assignCollection, collections, createCollection } =
    useVision();
  const [copied, setCopied] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const cat = categories.find((c) => c.id === concept.categoryId);
  const aspect = aspects.find((a) => a.id === concept.aspectId);
  const styleLabel = optionLabel(styles, concept.styleId);
  const collection = collections.find((c) => c.id === concept.collectionId);

  useEffect(() => {
    if (!pickerOpen) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setPickerOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [pickerOpen]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(concept.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <motion.figure
      initial={reduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group overflow-hidden rounded-2xl border border-line bg-surface"
    >
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: aspect ? `${aspect.w} / ${aspect.h}` : "4 / 5",
          background: conceptGradient(concept.seed),
        }}
      >
        {/* subtle accent bloom */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full opacity-20 blur-2xl"
          style={{ background: "var(--color-accent)" }}
        />
        {/* category label, centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/45">
            {cat?.label}
          </span>
        </div>
        {/* aspect badge */}
        <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-ink/70 backdrop-blur-sm">
          {aspect?.label}
        </span>

        {/* actions: always visible on touch, hover-revealed on desktop */}
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          <IconBtn
            label={concept.favorite ? "Unfavorite" : "Favorite"}
            onClick={() => toggleFavorite(concept.id)}
            active={concept.favorite}
          >
            <Heart weight={concept.favorite ? "fill" : "regular"} className="size-4" />
          </IconBtn>
          <IconBtn label="Copy prompt" onClick={copy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </IconBtn>
          <div ref={ref} className="relative">
            <IconBtn
              label="Save to collection"
              onClick={() => setPickerOpen((v) => !v)}
              active={!!collection}
            >
              <BookmarkSimple
                weight={collection ? "fill" : "regular"}
                className="size-4"
              />
            </IconBtn>
            {pickerOpen && (
              <div className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-xl border border-line bg-surface shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)]">
                <p className="px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-faint">
                  Collections
                </p>
                {collections.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      assignCollection(
                        concept.id,
                        concept.collectionId === c.id ? null : c.id,
                      );
                      setPickerOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] text-muted hover:bg-surface-2 hover:text-ink"
                  >
                    {c.name}
                    {concept.collectionId === c.id && (
                      <Check className="size-3.5 text-accent-fg" />
                    )}
                  </button>
                ))}
                <button
                  onClick={() => {
                    const id = createCollection(`Collection ${collections.length + 1}`);
                    assignCollection(concept.id, id);
                    setPickerOpen(false);
                  }}
                  className="flex w-full items-center gap-2 border-t border-line-soft px-3 py-2 text-left text-[13px] text-accent-fg hover:bg-surface-2"
                >
                  <Plus className="size-3.5" />
                  New collection
                </button>
              </div>
            )}
          </div>
          <IconBtn label="Remove" onClick={() => removeConcept(concept.id)}>
            <Trash className="size-4" />
          </IconBtn>
        </div>
      </div>

      <figcaption className="p-3.5">
        <p className="line-clamp-2 text-[12.5px] leading-snug text-muted">
          {concept.prompt}
        </p>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-faint">
          {styleLabel && <span>{styleLabel}</span>}
          {collection && (
            <>
              <span aria-hidden="true">&middot;</span>
              <span className="text-accent-fg">{collection.name}</span>
            </>
          )}
        </div>
      </figcaption>
    </motion.figure>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`grid size-8 place-items-center rounded-lg border backdrop-blur-md transition-colors ${
        active
          ? "border-accent/40 bg-accent/20 text-accent-fg"
          : "border-white/10 bg-black/40 text-ink/80 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
