"use client";

/**
 * Export & Memory modal — two tabs.
 *
 *   • Export — per-model prompt bundle previews + campaign package
 *     downloader (JSON / Markdown / CSV).
 *   • Memory — 8 preference categories the creator explicitly curates
 *     (cameras / lenses / lighting / palettes / compositions /
 *     aesthetics / brand inspirations / export formats). Every entry
 *     is added by a deliberate action and can be bumped, renamed, or
 *     removed.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Bookmark,
  Copy,
  DownloadSimple,
  Export,
  Plus,
  Trash,
  X,
} from "@phosphor-icons/react";
import { useVision } from "@/lib/vision/vision-store";
import type { ExportFormat } from "@/lib/vision/export-center";
import {
  CATEGORY_META,
  type PreferenceCategory,
  type PreferenceEntry,
} from "@/lib/vision/creative-memory";

type Tab = "export" | "memory";

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: "json", label: "JSON" },
  { id: "markdown", label: "Markdown" },
  { id: "csv", label: "CSV (shots)" },
];

const MEMORY_CATEGORIES = Object.keys(CATEGORY_META) as PreferenceCategory[];

export function ExportMemoryPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    promptBundle,
    exportProject,
    memory,
    addMemory,
    bumpMemory,
    updateMemory,
    removeMemory,
  } = useVision();
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("export");
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [preview, setPreview] = useState("");
  const [category, setCategory] = useState<PreferenceCategory>("cameras");
  const [draftLabel, setDraftLabel] = useState("");
  const [draftNote, setDraftNote] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || tab !== "export") return;
    const artifact = exportProject(format);
    setPreview(artifact.content);
  }, [open, tab, format, exportProject]);

  const download = () => {
    const artifact = exportProject(format);
    const blob = new Blob([artifact.content], { type: artifact.mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = artifact.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyPreview = async () => {
    try {
      await navigator.clipboard.writeText(preview);
    } catch {
      // clipboard unavailable
    }
  };

  const categoryEntries = memory[category];
  const meta = CATEGORY_META[category];

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
            aria-label="Close Export & Memory"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Export & Memory"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-[85vh] w-full max-w-[1120px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <div className="mb-1 inline-flex items-center gap-2">
                  <Export className="size-4 text-accent-fg" weight="fill" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                    Delivery
                  </p>
                </div>
                <h2 className="text-[18px] font-semibold text-ink">
                  Export & Memory
                </h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  Ship prompts to any of the 8 target models and curate your
                  own creative preferences.
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

            {/* Tab bar */}
            <div className="flex items-center gap-1 border-b border-line bg-bg/40 px-6 py-2">
              {[
                { id: "export" as const, label: "Export", icon: Export },
                { id: "memory" as const, label: "Memory", icon: Bookmark },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  aria-pressed={tab === id}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    tab === id
                      ? "border-accent/60 bg-accent/10 text-ink"
                      : "border-transparent text-muted hover:border-line hover:text-ink"
                  }`}
                >
                  <Icon className="size-3.5" weight="bold" />
                  {label}
                </button>
              ))}
            </div>

            {tab === "export" ? (
              <ExportTab
                format={format}
                setFormat={setFormat}
                preview={preview}
                onDownload={download}
                onCopy={copyPreview}
                promptBundle={promptBundle}
              />
            ) : (
              <MemoryTab
                categories={MEMORY_CATEGORIES}
                category={category}
                setCategory={setCategory}
                entries={categoryEntries}
                meta={meta}
                draftLabel={draftLabel}
                setDraftLabel={setDraftLabel}
                draftNote={draftNote}
                setDraftNote={setDraftNote}
                onAdd={() => {
                  const label = draftLabel.trim();
                  if (!label) return;
                  addMemory(category, { label, note: draftNote.trim() || undefined });
                  setDraftLabel("");
                  setDraftNote("");
                }}
                onBump={(id) => bumpMemory(category, id)}
                onDemote={(id) => bumpMemory(category, id, -5)}
                onUpdate={(id, patch) => updateMemory(category, id, patch)}
                onRemove={(id) => removeMemory(category, id)}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Export tab ───────────────────────────────────────────────────────────

function ExportTab({
  format,
  setFormat,
  preview,
  onDownload,
  onCopy,
  promptBundle,
}: {
  format: ExportFormat;
  setFormat: (v: ExportFormat) => void;
  preview: string;
  onDownload: () => void;
  onCopy: () => void;
  promptBundle: ReturnType<typeof useVision>["promptBundle"];
}) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)]">
      {/* Left: bundle + format */}
      <aside className="min-h-0 overflow-y-auto border-r border-line px-4 py-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-faint">
          Per-model bundle
        </p>
        <ul className="grid gap-1">
          {promptBundle.map((b) => (
            <li
              key={b.modelId}
              className="rounded-lg border border-line bg-bg px-3 py-2"
            >
              <p className="text-[12.5px] font-semibold text-ink">{b.label}</p>
              <p className="mt-0.5 line-clamp-3 text-[11px] leading-snug text-muted">
                {b.text}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-faint">
          Format
        </p>
        <div className="flex flex-wrap gap-1.5">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormat(f.id)}
              aria-pressed={format === f.id}
              className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                format === f.id
                  ? "border-accent/60 bg-accent/10 text-ink"
                  : "border-line text-muted hover:border-faint hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 text-[12px] font-medium text-ink hover:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <DownloadSimple className="size-3" weight="bold" />
            Download
          </button>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[12px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <Copy className="size-3" weight="bold" />
            Copy preview
          </button>
        </div>
      </aside>

      {/* Right: preview */}
      <section className="min-h-0 overflow-hidden">
        <pre className="h-full overflow-auto whitespace-pre-wrap break-words px-6 py-5 text-[12px] leading-relaxed text-ink">
          {preview}
        </pre>
      </section>
    </div>
  );
}

// ─── Memory tab ───────────────────────────────────────────────────────────

function MemoryTab({
  categories,
  category,
  setCategory,
  entries,
  meta,
  draftLabel,
  setDraftLabel,
  draftNote,
  setDraftNote,
  onAdd,
  onBump,
  onDemote,
  onUpdate,
  onRemove,
}: {
  categories: PreferenceCategory[];
  category: PreferenceCategory;
  setCategory: (v: PreferenceCategory) => void;
  entries: PreferenceEntry[];
  meta: (typeof CATEGORY_META)[PreferenceCategory];
  draftLabel: string;
  setDraftLabel: (v: string) => void;
  draftNote: string;
  setDraftNote: (v: string) => void;
  onAdd: () => void;
  onBump: (id: string) => void;
  onDemote: (id: string) => void;
  onUpdate: (id: string, patch: Partial<PreferenceEntry>) => void;
  onRemove: (id: string) => void;
}) {
  const sorted = useMemo(() => [...entries], [entries]);
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)]">
      {/* Category rail */}
      <aside className="min-h-0 overflow-y-auto border-r border-line py-3">
        <ul className="grid gap-0.5">
          {categories.map((c) => {
            const active = c === category;
            const label = CATEGORY_META[c].label;
            return (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={active}
                  className={`w-full cursor-pointer px-4 py-2 text-left text-[13px] transition-colors ${
                    active
                      ? "bg-accent/[0.06] text-ink"
                      : "text-muted hover:bg-bg/60 hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="min-h-0 overflow-y-auto px-6 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
          {meta.label}
        </p>
        <p className="mt-0.5 text-[12.5px] text-muted">{meta.hint}</p>

        <div className="mt-3 grid gap-2 rounded-xl border border-line bg-bg p-3">
          <input
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            placeholder={meta.placeholder}
            className="h-8 w-full rounded-md border border-line bg-surface px-2 text-[12px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
            aria-label={`Add ${meta.label} label`}
          />
          <input
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="Note (optional)"
            className="h-8 w-full rounded-md border border-line bg-surface px-2 text-[12px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
            aria-label={`${meta.label} note`}
          />
          <button
            type="button"
            onClick={onAdd}
            className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 text-[12px] font-medium text-ink hover:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <Plus className="size-3" weight="bold" />
            Add
          </button>
        </div>

        <ul className="mt-3 grid gap-2">
          {sorted.length === 0 ? (
            <li className="rounded-xl border border-dashed border-line bg-bg p-4 text-center text-[12.5px] text-muted">
              Add your first {meta.label.toLowerCase()} preference above.
            </li>
          ) : (
            sorted.map((e) => (
              <li
                key={e.id}
                className="rounded-xl border border-line bg-bg p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <input
                    value={e.label}
                    onChange={(ev) =>
                      onUpdate(e.id, { label: ev.target.value })
                    }
                    className="flex-1 border-0 bg-transparent p-0 text-[13.5px] font-semibold text-ink focus:outline-none focus:ring-0"
                    aria-label={`Rename ${e.label}`}
                  />
                  <span className="text-[10.5px] tabular-nums text-faint">
                    weight {e.weight}
                  </span>
                </div>
                <div
                  className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={e.weight}
                >
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${e.weight}%` }}
                  />
                </div>
                {e.note && (
                  <p className="mt-1 text-[11.5px] text-muted">{e.note}</p>
                )}
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onBump(e.id)}
                    aria-label={`Increase ${e.label} preference`}
                    className="cursor-pointer rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => onDemote(e.id)}
                    aria-label={`Decrease ${e.label} preference`}
                    className="cursor-pointer rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    −5
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(e.id)}
                    aria-label={`Remove ${e.label}`}
                    className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    <Trash className="size-3" weight="bold" />
                    Remove
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
