"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { presets } from "@/lib/vision/presets";
import { conceptGradient } from "@/lib/vision/prompt";
import { useVision } from "@/lib/vision/vision-store";

export function PresetGallery({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { applyPreset } = useVision();
  const reduce = useReducedMotion();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return presets;
    return presets.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.descriptor.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center px-4 py-[6vh]"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          <button
            aria-label="Close presets"
            onClick={onClose}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Premium presets"
            initial={reduce ? false : { opacity: 0, y: -10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -10, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-[16px] font-medium text-ink">
                  Premium presets
                </h2>
                <p className="text-[13px] text-muted">
                  Curated starting points. Your subject stays put.
                </p>
              </div>
              <button
                aria-label="Close"
                onClick={onClose}
                className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="border-b border-line-soft px-5 py-3">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search presets"
                  className="h-10 w-full rounded-lg border border-line bg-bg pl-9 pr-3 text-[14px] text-ink placeholder:text-faint focus:border-faint focus:outline-none"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    applyPreset(p.values);
                    onClose();
                  }}
                  className="group overflow-hidden rounded-xl border border-line bg-bg text-left transition-colors hover:border-faint"
                >
                  <div
                    className="relative h-24 w-full overflow-hidden"
                    style={{ background: conceptGradient(p.id) }}
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full opacity-20 blur-2xl"
                      style={{ background: "var(--color-accent)" }}
                    />
                  </div>
                  <div className="p-3.5">
                    <p className="text-[13.5px] font-medium text-ink">
                      {p.name}
                    </p>
                    <p className="mt-1 text-[12px] leading-snug text-muted">
                      {p.descriptor}
                    </p>
                  </div>
                </button>
              ))}
              {results.length === 0 && (
                <p className="col-span-full py-12 text-center text-[14px] text-faint">
                  No presets match &ldquo;{query}&rdquo;.
                </p>
              )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
