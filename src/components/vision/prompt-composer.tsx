"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  CheckCircle,
  Pencil,
  Sparkle,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { useVision } from "@/lib/vision/vision-store";
import {
  styles,
  moods,
  lighting,
  compositions,
  colorGrades,
  cameras,
  lenses,
  apertures,
  materials,
  textures,
  timesOfDay,
  weathers,
  renderStyles,
  optionLabel,
  categories,
} from "@/lib/vision/data";
import type { Direction } from "@/lib/vision/prompt";

/**
 * Prompt Composer — right-side inspector that decomposes the assembled prompt
 * into six semantic blocks. Reads the same Direction the ControlPanel writes,
 * so nothing is duplicated. Users can append a free-text refinement to any
 * block; refinements are additive and never overwrite the composed clause.
 */

type Block = {
  id: string;
  label: string;
  emptyHint: string;
  build: (d: Direction) => string;
};

const BLOCKS: Block[] = [
  {
    id: "subject",
    label: "Subject",
    emptyHint: "Name what's in frame",
    build: (d) => {
      const cat = categories.find((c) => c.id === d.category);
      const subject = d.subject.trim() || cat?.hint || "the subject";
      const mat = optionLabel(materials, d.material);
      return mat
        ? `${capitalize(subject)} in ${mat.toLowerCase()}`
        : capitalize(subject);
    },
  },
  {
    id: "look",
    label: "Look",
    emptyHint: "Style + mood + composition",
    build: (d) => {
      const parts = [
        optionLabel(styles, d.style),
        optionLabel(moods, d.mood),
        optionLabel(compositions, d.composition),
      ]
        .filter(Boolean)
        .map((p) => p!.toLowerCase());
      return parts.length ? parts.join(", ") : "";
    },
  },
  {
    id: "gear",
    label: "Camera",
    emptyHint: "Body, lens, aperture",
    build: (d) => {
      const cam = optionLabel(cameras, d.camera);
      const lens = optionLabel(lenses, d.lens);
      const ap = optionLabel(apertures, d.aperture);
      return [
        cam && `${cam}`,
        lens && `${lens} lens`,
        ap && `at ${ap}`,
      ]
        .filter(Boolean)
        .join(" · ");
    },
  },
  {
    id: "lighting",
    label: "Lighting",
    emptyHint: "Light source, time, weather",
    build: (d) => {
      const parts = [
        optionLabel(lighting, d.lighting),
        optionLabel(timesOfDay, d.timeOfDay),
        optionLabel(weathers, d.weather),
      ]
        .filter(Boolean)
        .map((p) => p!.toLowerCase());
      return parts.length ? parts.join(", ") : "";
    },
  },
  {
    id: "environment",
    label: "Environment",
    emptyHint: "Where the shot happens",
    build: (d) => d.environment.trim(),
  },
  {
    id: "finish",
    label: "Finish",
    emptyHint: "Texture + color grade + render",
    build: (d) => {
      const parts = [
        optionLabel(textures, d.texture),
        optionLabel(colorGrades, d.colorGrade),
        optionLabel(renderStyles, d.render),
      ]
        .filter(Boolean)
        .map((p) => p!.toLowerCase());
      return parts.length ? parts.join(", ") : "";
    },
  },
];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function PromptComposer({
  onEditRequest,
}: {
  /** Notify the outer studio which block the user wants to edit. */
  onEditRequest?: (blockId: string) => void;
}) {
  const { direction, prompt, enhancedPrompt, generating, generate } = useVision();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<"final" | "raw" | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const composedBlocks = useMemo(
    () =>
      BLOCKS.map((b) => ({
        ...b,
        clause: b.build(direction),
        note: notes[b.id]?.trim() ?? "",
      })),
    [direction, notes],
  );

  const finalPrompt = useMemo(() => {
    const noteAppends = Object.values(notes)
      .map((n) => n.trim())
      .filter(Boolean);
    if (noteAppends.length === 0) return prompt;
    return `${prompt.replace(/\.$/, "")}. ${noteAppends.join(". ")}${noteAppends[noteAppends.length - 1].endsWith(".") ? "" : "."}`;
  }, [prompt, notes]);

  const displayPrompt = enhancedPrompt ?? finalPrompt;

  const copy = async (text: string, key: "final" | "raw") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="border-b border-line px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
              Prompt composer
            </p>
            <h2 className="mt-0.5 text-[14px] font-medium text-ink">
              {composedBlocks.filter((b) => b.clause).length} of {BLOCKS.length} blocks composed
            </h2>
          </div>
          <button
            type="button"
            onClick={() => generate()}
            disabled={generating}
            aria-label="Generate from this composition"
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-line bg-bg text-faint transition-colors hover:border-faint hover:text-accent-fg disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            title="Generate from this composition"
          >
            <Sparkle weight="fill" className="size-3.5" />
          </button>
        </div>
      </header>

      {/* Blocks */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-1">
          {composedBlocks.map((b) => {
            const isExpanded = expanded === b.id;
            const filled = Boolean(b.clause);
            return (
              <div
                key={b.id}
                className={`group rounded-xl border transition-colors ${
                  filled ? "border-line-soft bg-bg" : "border-line/60 bg-bg/50"
                }`}
              >
                <div className="flex items-start gap-3 px-3 py-2.5">
                  <span className="mt-1 grid size-1.5 shrink-0 rounded-full bg-accent-fg/60" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[10.5px] font-semibold uppercase tracking-widest text-faint">
                        {b.label}
                      </p>
                      {b.note && (
                        <span className="rounded-full border border-accent/40 bg-accent/[0.08] px-1.5 py-0.5 text-[9.5px] font-medium text-accent-fg">
                          + note
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-0.5 text-[12.5px] leading-relaxed ${
                        filled ? "text-ink" : "text-faint"
                      }`}
                    >
                      {b.clause || b.emptyHint}
                    </p>
                    {b.note && (
                      <p className="mt-1 text-[11.5px] italic leading-relaxed text-accent-fg">
                        &ldquo;{b.note}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
                    {onEditRequest && filled && (
                      <button
                        type="button"
                        onClick={() => onEditRequest(b.id)}
                        aria-label={`Edit ${b.label} in controls`}
                        title="Edit source"
                        className="grid size-7 cursor-pointer place-items-center rounded-md text-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        <Pencil className="size-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpanded(isExpanded ? null : b.id)}
                      aria-expanded={isExpanded}
                      aria-controls={`note-${b.id}`}
                      aria-label={`${isExpanded ? "Hide" : "Add"} refinement for ${b.label}`}
                      title="Refine this block"
                      className="grid size-7 cursor-pointer place-items-center rounded-md text-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    >
                      <ArrowsClockwise className="size-3" weight="bold" />
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div
                    id={`note-${b.id}`}
                    className="border-t border-line-soft px-3 pb-3 pt-2"
                  >
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-faint">
                      Refinement
                    </label>
                    <textarea
                      value={notes[b.id] ?? ""}
                      onChange={(e) =>
                        setNotes((n) => ({ ...n, [b.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setExpanded(null);
                      }}
                      rows={2}
                      placeholder={`Add a specific note, e.g. "with morning window fog"`}
                      className="w-full resize-none rounded-lg border border-line bg-bg px-2.5 py-1.5 text-[12px] text-ink placeholder:text-faint transition-colors focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                    />
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10.5px] text-faint">
                        Appends to the final prompt
                      </span>
                      {notes[b.id] && (
                        <button
                          type="button"
                          onClick={() =>
                            setNotes((n) => {
                              const next = { ...n };
                              delete next[b.id];
                              return next;
                            })
                          }
                          className="cursor-pointer text-[10.5px] text-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 rounded"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Final prompt */}
      <footer className="border-t border-line px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
            {enhancedPrompt ? "Enhanced prompt" : "Final prompt"}
          </p>
          <button
            type="button"
            onClick={() => void copy(displayPrompt, "final")}
            aria-label="Copy prompt"
            className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] text-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {copied === "final" ? (
              <>
                <CheckCircle weight="fill" className="size-3 text-accent-fg" /> Copied
              </>
            ) : (
              <>
                <Copy className="size-3" /> Copy
              </>
            )}
          </button>
        </div>
        <p className="max-h-32 overflow-y-auto rounded-lg border border-line-soft bg-bg px-3 py-2 text-[12px] leading-relaxed text-muted">
          {displayPrompt}
        </p>
      </footer>
    </div>
  );
}
