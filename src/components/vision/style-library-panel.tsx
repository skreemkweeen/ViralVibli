"use client";

/**
 * Style Library modal — one-click visual signatures.
 *
 * Ships with 12 brand-inspired presets (Apple / Nike / Aesop / …). The
 * creator can also save the current Direction as a new style and apply
 * any tile to seed a shot with that look.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Palette, Plus, Trash, X } from "@phosphor-icons/react";
import { useVision } from "@/lib/vision/vision-store";
import { withPresets, type SavedStyle } from "@/lib/vision/style-library";

export function StyleLibraryPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    savedStyles,
    saveCurrentAsStyle,
    applyStyle,
    removeStyle,
  } = useVision();
  const reduce = useReducedMotion();
  const [name, setName] = useState("");
  const [vibe, setVibe] = useState("");
  const [error, setError] = useState<string | null>(null);

  const merged = withPresets(savedStyles);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = saveCurrentAsStyle(trimmed, {
      vibe: vibe.trim() || undefined,
    });
    if (id === null) {
      setError(`A style called "${trimmed}" already exists.`);
      return;
    }
    setName("");
    setVibe("");
    setError(null);
  };

  const handleApply = (id: string) => {
    applyStyle(id);
    onClose();
  };

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
            aria-label="Close Style Library"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Style Library"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[920px] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <div className="mb-1 inline-flex items-center gap-2">
                  <Palette className="size-4 text-accent-fg" weight="fill" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                    Visual signatures
                  </p>
                </div>
                <h2 className="text-[18px] font-semibold text-ink">
                  Style Library
                </h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  One-click looks. Click a tile to apply it to the current
                  direction; save the current tuning as a new style below.
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

            {/* Save current */}
            <div className="border-b border-line bg-bg/60 px-6 py-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-faint">
                Save current as a style
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex-1 min-w-[160px]">
                  <span className="mb-1 block text-[11px] text-faint">Name</span>
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    placeholder="e.g. Warm Editorial"
                    className="block h-9 w-full rounded-lg border border-line bg-bg px-2.5 text-[13px] text-ink placeholder:text-faint focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </label>
                <label className="flex-1 min-w-[160px]">
                  <span className="mb-1 block text-[11px] text-faint">
                    Vibe <span className="text-faint/60">(optional)</span>
                  </span>
                  <input
                    value={vibe}
                    onChange={(e) => setVibe(e.target.value)}
                    placeholder="e.g. Kinfolk · Refined"
                    className="block h-9 w-full rounded-lg border border-line bg-bg px-2.5 text-[13px] text-ink placeholder:text-faint focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!name.trim()}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-accent px-3 text-[13px] font-medium text-accent-ink transition-transform hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <Plus className="size-3.5" weight="bold" />
                  Save
                </button>
              </div>
              {error && (
                <p className="mt-2 text-[12px] text-red-400">{error}</p>
              )}
            </div>

            {/* Grid */}
            <div className="max-h-[52vh] overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {merged.map((s) => (
                  <StyleTile
                    key={s.id}
                    style={s}
                    onApply={() => handleApply(s.id)}
                    onDelete={s.preset ? undefined : () => removeStyle(s.id)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StyleTile({
  style,
  onApply,
  onDelete,
}: {
  style: SavedStyle;
  onApply: () => void;
  onDelete?: () => void;
}) {
  const swatch = style.swatch ?? "#334";
  return (
    <div className="group relative overflow-hidden rounded-xl border border-line bg-bg">
      <button
        type="button"
        onClick={onApply}
        className="block w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label={`Apply style: ${style.name}`}
      >
        <div
          className="h-20"
          style={{
            background: `linear-gradient(135deg, ${swatch}, ${shift(swatch, 22)})`,
          }}
        />
        <div className="px-3 py-2.5">
          <p className="truncate text-[13px] font-medium text-ink">
            {style.name}
          </p>
          {style.vibe && (
            <p className="mt-0.5 truncate text-[11px] text-faint">
              {style.vibe}
            </p>
          )}
        </div>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete ${style.name}`}
          className="absolute right-2 top-2 grid size-7 cursor-pointer place-items-center rounded-full border border-line/60 bg-surface/90 text-faint opacity-0 backdrop-blur-sm transition-opacity hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/** Nudge a hex color's lightness for the tile gradient. Deterministic. */
function shift(hex: string, delta: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = clamp(parseInt(h.slice(0, 2), 16) + delta);
  const g = clamp(parseInt(h.slice(2, 4), 16) + delta);
  const b = clamp(parseInt(h.slice(4, 6), 16) + delta);
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}
function clamp(n: number): number {
  return Math.max(0, Math.min(255, n));
}
function to2(n: number): string {
  return n.toString(16).padStart(2, "0");
}
