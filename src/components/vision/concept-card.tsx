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
  CopySimple,
  DownloadSimple,
  PencilSimple,
  X,
  MagicWand,
  Note,
  PushPin,
} from "@phosphor-icons/react";
import { useVision, type Concept } from "@/lib/vision/vision-store";
import { conceptGradient } from "@/lib/vision/prompt";
import { categories, aspects, styles, optionLabel } from "@/lib/vision/data";

export function ConceptCard({ concept }: { concept: Concept }) {
  const {
    toggleFavorite,
    removeConcept,
    assignCollection,
    collections,
    createCollection,
    duplicateConcept,
    renameConcept,
    remixConcept,
    setConceptNotes,
    pinConceptToMoodboard,
    isConceptOnMoodboard,
  } = useVision();
  const pinnedToMoodboard = isConceptOnMoodboard(concept.id);
  const [copied, setCopied] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(concept.label ?? "");
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState(concept.notes ?? "");
  const pickerRef = useRef<HTMLDivElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const reduce = useReducedMotion();

  const cat = categories.find((c) => c.id === concept.categoryId);
  const aspect = aspects.find((a) => a.id === concept.aspectId);
  const styleLabel = optionLabel(styles, concept.styleId);
  const collection = collections.find((c) => c.id === concept.collectionId);

  const displayPrompt = concept.enhancedPrompt ?? concept.prompt;

  useEffect(() => {
    if (!pickerOpen) return;
    const onDown = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setPickerOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [pickerOpen]);

  useEffect(() => {
    if (renaming) renameRef.current?.focus();
  }, [renaming]);

  useEffect(() => {
    if (notesOpen) notesRef.current?.focus();
  }, [notesOpen]);

  function commitNotes() {
    setConceptNotes(concept.id, notesDraft);
    setNotesOpen(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(displayPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  function exportAsset() {
    if (concept.imageUrl) {
      // Open real image in new tab for download
      window.open(concept.imageUrl, "_blank", "noopener,noreferrer");
    } else {
      // Export prompt as text
      const blob = new Blob([displayPrompt], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `concept-${concept.seed.slice(-6)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  function commitRename() {
    renameConcept(concept.id, renameValue);
    setRenaming(false);
  }

  return (
    <motion.figure
      initial={reduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group overflow-hidden rounded-2xl border border-line bg-surface"
    >
      {/* ── Visual area ─────────────────────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: aspect ? `${aspect.w} / ${aspect.h}` : "4 / 5",
          background: conceptGradient(concept.seed),
        }}
      >
        {/* Real image when available */}
        {concept.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={concept.imageUrl}
            alt={concept.label ?? displayPrompt}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Accent bloom (placeholder-only) */}
        {!concept.imageUrl && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full opacity-20 blur-2xl"
              style={{ background: "var(--color-accent)" }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/45">
                {cat?.label}
              </span>
            </div>
          </>
        )}

        {/* Aspect badge */}
        <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-ink/70 backdrop-blur-sm">
          {aspect?.label}
        </span>

        {/* Provider badge */}
        {concept.provider !== "local-image" && (
          <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-ink/50 backdrop-blur-sm">
            {concept.provider}
          </span>
        )}

        {/* Actions overlay */}
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
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
          <IconBtn label="Duplicate" onClick={() => duplicateConcept(concept.id)}>
            <CopySimple className="size-4" />
          </IconBtn>
          {concept.direction && (
            <IconBtn
              label="Remix — load direction into builder"
              onClick={() => remixConcept(concept.id)}
            >
              <MagicWand className="size-4" />
            </IconBtn>
          )}
          <IconBtn
            label={pinnedToMoodboard ? "Pinned to moodboard" : "Pin to moodboard"}
            onClick={() => pinConceptToMoodboard(concept.id)}
            active={pinnedToMoodboard}
          >
            <PushPin className="size-4" weight={pinnedToMoodboard ? "fill" : "regular"} />
          </IconBtn>
          <IconBtn
            label={concept.notes ? "Edit note" : "Add note"}
            onClick={() => {
              setNotesDraft(concept.notes ?? "");
              setNotesOpen(true);
            }}
            active={Boolean(concept.notes)}
          >
            <Note className="size-4" weight={concept.notes ? "fill" : "regular"} />
          </IconBtn>
          <IconBtn label={concept.imageUrl ? "Open image" : "Export prompt"} onClick={exportAsset}>
            <DownloadSimple className="size-4" />
          </IconBtn>
          <div ref={pickerRef} className="relative">
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
          <IconBtn label="Delete" onClick={() => removeConcept(concept.id)}>
            <Trash className="size-4" />
          </IconBtn>
        </div>
      </div>

      {/* ── Caption ──────────────────────────────────────────────────── */}
      <figcaption className="p-3.5">
        {renaming ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={renameRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setRenaming(false);
              }}
              onBlur={commitRename}
              placeholder="Name this concept"
              className="h-7 min-w-0 flex-1 rounded-md border border-line bg-bg px-2 text-[12.5px] text-ink placeholder:text-faint focus:border-faint focus:outline-none"
            />
            <button
              onClick={() => setRenaming(false)}
              aria-label="Cancel rename"
              className="text-faint hover:text-muted"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-1.5">
            <p className="line-clamp-2 flex-1 text-[12.5px] leading-snug text-muted">
              {concept.label ?? displayPrompt}
            </p>
            <button
              onClick={() => {
                setRenameValue(concept.label ?? "");
                setRenaming(true);
              }}
              aria-label="Rename concept"
              className="mt-0.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <PencilSimple className="size-3" />
            </button>
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-faint">
          {styleLabel && <span>{styleLabel}</span>}
          {concept.enhancedPrompt && (
            <>
              {styleLabel && <span aria-hidden="true">&middot;</span>}
              <span className="text-accent-fg/70">AI enhanced</span>
            </>
          )}
          {collection && (
            <>
              <span aria-hidden="true">&middot;</span>
              <span className="text-accent-fg">{collection.name}</span>
            </>
          )}
        </div>

        {/* Notes surface — visible whenever a note exists so it's part of
            the visual language, not hidden behind a hover state. */}
        {concept.notes && !notesOpen && (
          <button
            type="button"
            onClick={() => {
              setNotesDraft(concept.notes ?? "");
              setNotesOpen(true);
            }}
            aria-label="Edit note"
            className="mt-2 flex w-full cursor-pointer items-start gap-2 rounded-lg border border-accent/30 bg-accent/[0.06] px-2.5 py-1.5 text-left transition-colors hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <Note weight="fill" className="mt-0.5 size-3 shrink-0 text-accent-fg" />
            <span className="min-w-0 flex-1 text-[11.5px] italic leading-snug text-muted line-clamp-2">
              {concept.notes}
            </span>
          </button>
        )}

        {notesOpen && (
          <div className="mt-2 rounded-lg border border-line bg-bg p-2">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-faint">
              Note
            </label>
            <textarea
              ref={notesRef}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setNotesOpen(false);
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commitNotes();
              }}
              rows={3}
              placeholder="What worked. What to adjust next time."
              className="w-full resize-none rounded-md border border-line bg-surface px-2 py-1.5 text-[12px] text-ink placeholder:text-faint focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            />
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="text-[10px] text-faint">⌘↵ save · Esc cancel</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setNotesOpen(false)}
                  className="cursor-pointer rounded-md border border-line px-2 py-0.5 text-[11px] text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={commitNotes}
                  className="cursor-pointer rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-ink transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
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
