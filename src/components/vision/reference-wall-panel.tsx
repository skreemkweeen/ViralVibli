"use client";

/**
 * Reference Wall modal — typed references (image / URL / palette / gradient
 * / typography / texture / material / motion / note) with a live analysis
 * strip and an "Influence prompt" proposal you accept or ignore.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLineRight,
  Books,
  MagicWand,
  Plus,
  Trash,
  X,
} from "@phosphor-icons/react";
import { useVision } from "@/lib/vision/vision-store";
import type {
  ReferenceAnalysis,
  ReferenceItem,
  ReferenceKind,
} from "@/lib/vision/reference-wall";

const KINDS: { id: ReferenceKind; label: string; hint: string }[] = [
  { id: "image", label: "Image", hint: "A saved image reference or screenshot" },
  { id: "url", label: "URL", hint: "A link to an external reference" },
  { id: "palette", label: "Palette", hint: "5-6 hex swatches that define the mood" },
  { id: "gradient", label: "Gradient", hint: "Two colours you want blended" },
  { id: "typography", label: "Typography", hint: "Typeface direction and voice" },
  { id: "texture", label: "Texture", hint: "Surface behaviour — matte, grain, weave" },
  { id: "material", label: "Material", hint: "Physical substrate — ceramic, linen…" },
  { id: "motion", label: "Motion", hint: "Movement language for animation" },
  { id: "note", label: "Note", hint: "Freeform reference note" },
];

export function ReferenceWallPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    referenceWall,
    addReference,
    removeReferenceItem,
    updateReferenceItem,
    referenceAnalyses,
    referenceProposal,
    applyReferenceProposal,
  } = useVision();
  const reduce = useReducedMotion();
  const [kind, setKind] = useState<ReferenceKind>("image");
  const [draft, setDraft] = useState<{
    title: string;
    url: string;
    note: string;
    swatchInput: string;
    tagInput: string;
  }>({
    title: "",
    url: "",
    note: "",
    swatchInput: "",
    tagInput: "",
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const analysisMap = useMemo(() => {
    const map = new Map(referenceAnalyses.map((a) => [a.id, a]));
    return map;
  }, [referenceAnalyses]);

  const handleAdd = () => {
    const title = draft.title.trim();
    if (!title) return;
    const swatches = draft.swatchInput
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter((s) => /^#?[0-9a-f]{6}$/i.test(s))
      .map((s) => (s.startsWith("#") ? s : `#${s}`));
    const tags = draft.tagInput
      .split(/[,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    addReference({
      kind,
      title,
      url: draft.url.trim() || undefined,
      note: draft.note.trim() || undefined,
      swatches: swatches.length ? swatches : undefined,
      tags: tags.length ? tags : undefined,
    });
    setDraft({ title: "", url: "", note: "", swatchInput: "", tagInput: "" });
  };

  const proposalCount = Object.keys(referenceProposal.patch).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto px-4 py-[6vh]"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            aria-label="Close Reference Wall"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Reference Wall"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-[85vh] w-full max-w-[1120px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <div className="mb-1 inline-flex items-center gap-2">
                  <Books className="size-4 text-accent-fg" weight="fill" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                    Reference
                  </p>
                </div>
                <h2 className="text-[18px] font-semibold text-ink">
                  Reference Wall
                </h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  Typed references analysed for mood, colour, composition, and
                  brand — with a live proposal that can influence the prompt.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="cursor-pointer rounded-full p-1.5 text-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <X className="size-4" weight="bold" />
              </button>
            </header>

            {/* Add row */}
            <div className="grid gap-3 border-b border-line bg-bg/40 px-6 py-4">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
                  Kind
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {KINDS.map((k) => {
                    const active = kind === k.id;
                    return (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => setKind(k.id)}
                        aria-pressed={active}
                        title={k.hint}
                        className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                          active
                            ? "border-accent/60 bg-accent/10 text-ink"
                            : "border-line text-muted hover:border-faint hover:text-ink"
                        }`}
                      >
                        {k.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Title"
                  className="h-8 rounded-md border border-line bg-surface px-2 text-[12px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                  aria-label="Reference title"
                />
                <input
                  value={draft.url}
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                  placeholder="URL (optional)"
                  className="h-8 rounded-md border border-line bg-surface px-2 text-[12px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                  aria-label="Reference URL"
                />
                <input
                  value={draft.swatchInput}
                  onChange={(e) =>
                    setDraft({ ...draft, swatchInput: e.target.value })
                  }
                  placeholder="Swatches: #111 #eee (up to 6)"
                  className="h-8 rounded-md border border-line bg-surface px-2 text-[12px] tabular-nums text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                  aria-label="Swatch hex values"
                />
                <input
                  value={draft.tagInput}
                  onChange={(e) => setDraft({ ...draft, tagInput: e.target.value })}
                  placeholder="Tags: warm, editorial, softbox"
                  className="h-8 rounded-md border border-line bg-surface px-2 text-[12px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                  aria-label="Tags"
                />
              </div>
              <textarea
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                placeholder="Note (optional)"
                rows={2}
                className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-[12px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                aria-label="Reference note"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 text-[12px] font-medium text-ink hover:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <Plus className="size-3" weight="bold" />
                  Add reference
                </button>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[11.5px] text-faint">
                    {referenceWall.length} on the wall
                  </span>
                  {proposalCount > 0 && (
                    <button
                      type="button"
                      onClick={applyReferenceProposal}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 text-[12px] font-medium text-ink hover:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    >
                      <MagicWand className="size-3" weight="fill" />
                      Influence prompt ({proposalCount})
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Proposal reasoning */}
            {referenceProposal.reasoning.length > 0 && (
              <div className="border-b border-line bg-accent/[0.04] px-6 py-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
                  Proposal
                </p>
                <ul className="grid gap-1 text-[11.5px]">
                  {referenceProposal.reasoning.map((r) => (
                    <li
                      key={r.field}
                      className="flex items-center gap-2 text-ink"
                    >
                      <ArrowLineRight className="size-3 text-accent" weight="bold" />
                      <span className="w-24 text-faint">{r.field}</span>
                      <span>{r.value}</span>
                      <span className="ml-auto text-faint">{r.source}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Grid */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {referenceWall.length === 0 ? (
                <div className="flex h-full min-h-[240px] items-center justify-center rounded-xl border border-dashed border-line bg-bg text-[12.5px] text-muted">
                  Add a reference above to seed the wall.
                </div>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {referenceWall.map((r) => (
                    <ReferenceCard
                      key={r.id}
                      ref={r}
                      analysis={analysisMap.get(r.id)}
                      onRemove={() => removeReferenceItem(r.id)}
                      onNoteChange={(note) =>
                        updateReferenceItem(r.id, { note })
                      }
                    />
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ReferenceCard({
  ref: item,
  analysis,
  onRemove,
  onNoteChange,
}: {
  ref: ReferenceItem;
  analysis?: ReferenceAnalysis;
  onRemove: () => void;
  onNoteChange: (note: string) => void;
}) {
  return (
    <li className="rounded-xl border border-line bg-bg p-3">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="truncate text-[13px] font-medium text-ink">
          {item.title}
        </p>
        <span className="rounded-full border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-faint">
          {item.kind}
        </span>
      </div>
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="mb-1 block truncate text-[11.5px] text-muted underline-offset-2 hover:underline"
        >
          {item.url}
        </a>
      )}
      {/* Swatches */}
      {item.swatches && item.swatches.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {item.swatches.map((c) => (
            <span
              key={c}
              className="size-5 rounded border border-line/60"
              style={{ background: c }}
              title={c}
              aria-label={c}
            />
          ))}
        </div>
      )}
      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {item.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-line px-1.5 py-0.5 text-[10px] text-muted"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      {/* Analysis strip */}
      {analysis && (
        <div className="mb-2 grid grid-cols-2 gap-1 text-[10.5px] text-muted">
          <span className="rounded-md border border-line bg-surface px-1.5 py-0.5">
            {analysis.luminance}
          </span>
          <span className="rounded-md border border-line bg-surface px-1.5 py-0.5">
            {analysis.temperature}
          </span>
          <span className="rounded-md border border-line bg-surface px-1.5 py-0.5">
            {analysis.saturation}
          </span>
          <span className="rounded-md border border-line bg-surface px-1.5 py-0.5">
            {analysis.visualDensity}
          </span>
          {analysis.lightingHint && (
            <span className="col-span-2 rounded-md border border-line bg-surface px-1.5 py-0.5">
              light · {analysis.lightingHint}
            </span>
          )}
          {analysis.compositionHint && (
            <span className="col-span-2 rounded-md border border-line bg-surface px-1.5 py-0.5">
              comp · {analysis.compositionHint}
            </span>
          )}
          {analysis.mood && (
            <span className="col-span-2 rounded-md border border-line bg-surface px-1.5 py-0.5">
              mood · {analysis.mood}
            </span>
          )}
          {analysis.brandSimilarity > 0 && (
            <span className="col-span-2 rounded-md border border-accent/40 bg-accent/[0.06] px-1.5 py-0.5 text-ink">
              brand match {analysis.brandSimilarity}%
            </span>
          )}
        </div>
      )}
      <textarea
        value={item.note ?? ""}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Add a note…"
        rows={2}
        className="w-full rounded-md border border-line bg-surface px-2 py-1 text-[11.5px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
        aria-label={`Note for ${item.title}`}
      />
      <div className="mt-2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${item.title}`}
          className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <Trash className="size-3" weight="bold" />
          Remove
        </button>
      </div>
    </li>
  );
}

