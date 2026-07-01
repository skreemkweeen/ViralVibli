"use client";

/**
 * Right-side preview panel for the command palette.
 *
 * Given the currently-active item, renders a contextual preview: prompt
 * body for vault hits, first slide for stories, moodboard tile for
 * moodboard references, keyword tags for commands, chain sequence for
 * chain items. The palette focuses this pane on Tab so power users can
 * skim without leaving the keyboard.
 */

import { ArrowRight, Command, Keyboard, PushPin } from "@phosphor-icons/react";
import type { SearchHit } from "@/lib/palette/types";

export type PalettePreviewItem =
  | {
      kind: "command";
      title: string;
      subtitle?: string;
      keywords?: string[];
      shortcut?: string[];
      group: string;
      pinned?: boolean;
    }
  | {
      kind: "route";
      title: string;
      hint: string;
      subject: string;
      confidence: number;
      studio: string;
    }
  | {
      kind: "search";
      hit: SearchHit;
    }
  | {
      kind: "chain";
      title: string;
      steps: Array<{ title: string; hint: string; active: boolean }>;
    }
  | {
      kind: "ai";
      query: string;
    }
  | null;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
        {label}
      </p>
      <p className="min-w-0 flex-1 text-right text-[12px] text-muted">
        {value}
      </p>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-line bg-bg px-1.5 font-mono text-[10px] text-muted">
      {children}
    </kbd>
  );
}

export function PalettePreview({ item }: { item: PalettePreviewItem }) {
  if (!item) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <Keyboard className="size-6 text-faint" />
        <p className="text-[12px] leading-relaxed text-faint">
          Highlight anything on the left to preview it here.
          <br />
          <span className="text-[11px]">Tab focuses this panel · ⌘. pins</span>
        </p>
      </div>
    );
  }

  if (item.kind === "command") {
    return (
      <div className="flex h-full flex-col gap-4 px-5 py-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
            {item.group}
          </p>
          <h4 className="mt-1 text-[15px] font-semibold text-ink">
            {item.title}
          </h4>
          {item.subtitle && (
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              {item.subtitle}
            </p>
          )}
        </div>
        {item.keywords && item.keywords.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-faint">
              Aliases
            </p>
            <div className="flex flex-wrap gap-1">
              {item.keywords.slice(0, 8).map((k) => (
                <span
                  key={k}
                  className="rounded-full border border-line/60 bg-bg px-2 py-0.5 text-[10px] text-muted"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-auto space-y-2">
          {item.shortcut && (
            <Row
              label="Shortcut"
              value={
                <span className="inline-flex gap-1">
                  {item.shortcut.map((k, i) => (
                    <Kbd key={i}>{k}</Kbd>
                  ))}
                </span>
              }
            />
          )}
          <Row
            label="Pin"
            value={
              <span className="inline-flex items-center gap-1.5">
                {item.pinned ? (
                  <>
                    <PushPin className="size-3.5 text-accent-fg" weight="fill" />
                    Pinned
                  </>
                ) : (
                  <>
                    <Kbd>⌘</Kbd>
                    <Kbd>.</Kbd>
                  </>
                )}
              </span>
            }
          />
        </div>
      </div>
    );
  }

  if (item.kind === "route") {
    return (
      <div className="flex h-full flex-col gap-4 px-5 py-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
            Route intent
          </p>
          <h4 className="mt-1 text-[15px] font-semibold text-ink">
            {item.title}
          </h4>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            {item.hint}
          </p>
        </div>
        {item.subject && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-faint">
              Prefill subject
            </p>
            <p className="rounded-lg border border-line/60 bg-bg px-3 py-2 text-[12px] leading-relaxed text-ink">
              “{item.subject}”
            </p>
          </div>
        )}
        <div className="mt-auto space-y-2">
          <Row
            label="Target"
            value={<span className="capitalize">{item.studio} Studio</span>}
          />
          <Row
            label="Confidence"
            value={
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-14 overflow-hidden rounded-full bg-line">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${Math.round(item.confidence * 100)}%` }}
                  />
                </span>
                <span className="tabular-nums">
                  {Math.round(item.confidence * 100)}%
                </span>
              </span>
            }
          />
        </div>
      </div>
    );
  }

  if (item.kind === "search") {
    const { hit } = item;
    return (
      <div className="flex h-full flex-col gap-4 px-5 py-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
            {hit.kind}
          </p>
          <h4 className="mt-1 text-[15px] font-semibold text-ink">
            {hit.title}
          </h4>
          {hit.subtitle && (
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              {hit.subtitle}
            </p>
          )}
        </div>
        <div className="mt-auto space-y-2">
          <Row label="Match score" value={<span className="tabular-nums">{hit.score}</span>} />
          {hit.href && <Row label="Opens" value={hit.href} />}
        </div>
      </div>
    );
  }

  if (item.kind === "chain") {
    return (
      <div className="flex h-full flex-col gap-4 px-5 py-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
            Multi-step plan
          </p>
          <h4 className="mt-1 text-[15px] font-semibold text-ink">
            {item.title}
          </h4>
        </div>
        <ol className="space-y-2">
          {item.steps.map((s, i) => (
            <li
              key={i}
              className={`flex items-start gap-3 rounded-lg border px-3 py-2 ${
                s.active
                  ? "border-accent/50 bg-accent/5"
                  : "border-line/60 bg-bg"
              }`}
            >
              <span
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-mono ${
                  s.active
                    ? "bg-accent text-accent-ink"
                    : "border border-line/60 text-faint"
                }`}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-ink">
                  {s.title}
                </p>
                <p className="truncate text-[11px] text-faint">{s.hint}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-auto space-y-2">
          <Row
            label="Skip step"
            value={
              <span className="inline-flex items-center gap-1">
                <Kbd>⌫</Kbd>
              </span>
            }
          />
        </div>
      </div>
    );
  }

  // AI fallback
  return (
    <div className="flex h-full flex-col gap-4 px-5 py-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
          Ask AI
        </p>
        <h4 className="mt-1 text-[15px] font-semibold text-ink">
          Route this to the AI Dock
        </h4>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          Nothing matched confidently — send the query to the AI Dock and keep
          working in place, or open the dedicated Assistant.
        </p>
      </div>
      <div className="rounded-lg border border-line/60 bg-bg px-3 py-2 text-[12px] leading-relaxed text-ink">
        “{item.query}”
      </div>
      <div className="mt-auto space-y-2">
        <Row
          label="Enter"
          value={
            <span className="inline-flex items-center gap-1.5">
              <Command className="size-3" />
              <Kbd>J</Kbd> Dock
            </span>
          }
        />
        <Row
          label="Shift+Enter"
          value={
            <span className="inline-flex items-center gap-1.5">
              <ArrowRight className="size-3" />
              Assistant
            </span>
          }
        />
      </div>
    </div>
  );
}
