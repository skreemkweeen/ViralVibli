"use client";

/**
 * Creative Brief modal — the campaign-level context for the whole shoot.
 *
 * Fields map 1:1 onto the CreativeBrief type. Editing is inline; changes
 * flow into the Vision store immediately so autosave feels seamless.
 */

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Notebook, X } from "@phosphor-icons/react";
import { useVision } from "@/lib/vision/vision-store";
import type { CreativeBrief } from "@/lib/vision/brief";

type FieldSpec = {
  key: keyof CreativeBrief;
  label: string;
  placeholder: string;
  rows?: number;
};

const FIELDS: FieldSpec[] = [
  { key: "objective", label: "Campaign objective", placeholder: "Announce the spring skincare launch and drive Instagram saves.", rows: 2 },
  { key: "audience", label: "Audience", placeholder: "Skincare enthusiasts, 25–34, image-forward feed.", rows: 2 },
  { key: "platform", label: "Primary platform", placeholder: "Instagram (feed + stories), TikTok, website hero." },
  { key: "deliverables", label: "Deliverables", placeholder: "Hero image, 3 lifestyle, 2 macro, 6 story slides, 2 reels.", rows: 3 },
  { key: "visualKeywords", label: "Visual keywords", placeholder: "Warm brass, oat, matte ceramic, unhurried people.", rows: 2 },
  { key: "brandPersonality", label: "Brand personality", placeholder: "Quiet confidence. Two sentences, then a beat.", rows: 2 },
  { key: "artDirectionNotes", label: "Art direction notes", placeholder: "Editorial. No neon. No stock props. Real skin.", rows: 3 },
  { key: "references", label: "References", placeholder: "Aesop shop windows, Kinfolk stills, moody Portra shifts.", rows: 2 },
  { key: "constraints", label: "Constraints", placeholder: "No influencer clichés. No AI-obvious hands.", rows: 2 },
];

export function BriefPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { brief, updateBrief, resetBrief } = useVision();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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
            aria-label="Close Creative Brief"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Creative Brief"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[820px] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            {/* Header */}
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <div className="mb-1 inline-flex items-center gap-2">
                  <Notebook className="size-4 text-accent-fg" weight="fill" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                    Creative direction
                  </p>
                </div>
                <h2 className="text-[18px] font-semibold text-ink">
                  Creative Brief
                </h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  The campaign context every shot inherits. Autosaves per project.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Clear this Creative Brief?")) resetBrief();
                  }}
                  className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="cursor-pointer rounded-full p-1.5 text-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <X className="size-4" weight="bold" />
                </button>
              </div>
            </header>

            {/* Fields */}
            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <label key={f.key} className={f.rows && f.rows > 2 ? "sm:col-span-2" : ""}>
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-faint">
                    {f.label}
                  </span>
                  <textarea
                    value={brief[f.key]}
                    onChange={(e) => updateBrief({ [f.key]: e.target.value })}
                    rows={f.rows ?? 1}
                    placeholder={f.placeholder}
                    className="block w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-[13px] leading-relaxed text-ink placeholder:text-faint focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </label>
              ))}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-line px-6 py-3 text-[11px] text-faint">
              <span>Every field is optional — write only what steers the shoot.</span>
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border border-line bg-bg px-1.5 py-0.5 font-mono text-[10px]">
                  Esc
                </kbd>
                Close
              </span>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
