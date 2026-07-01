"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  CheckCircle,
  Lightning,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { fillVariables } from "@/lib/vault/variables";

/**
 * Variable filler — surfaces the extracted {tokens} of a prompt as labelled
 * inputs, live-renders the filled prompt below, and offers a Copy filled
 * action. Purely local state: filling never mutates the vault entry.
 *
 * Rendered inside the Prompt Inspector only when the prompt has at least
 * one variable.
 */
export function VariableFiller({
  content,
  variables,
}: {
  content: string;
  variables: string[];
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const filled = useMemo(() => fillVariables(content, values), [content, values]);
  const filledCount = variables.filter((v) => values[v]?.trim()).length;
  const allFilled = filledCount === variables.length;

  async function copy() {
    try {
      await navigator.clipboard.writeText(filled);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable
    }
  }

  function reset() {
    setValues({});
  }

  if (variables.length === 0) return null;

  return (
    <div className="mb-4 rounded-2xl border border-accent/25 bg-accent/[0.04] p-3.5">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Lightning weight="fill" className="size-3.5 text-accent-fg" />
          <p className="text-[13px] font-semibold text-ink">Fill in the blanks</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10.5px] tabular-nums text-faint">
            {filledCount}/{variables.length}
          </span>
          {filledCount > 0 && (
            <button
              type="button"
              onClick={reset}
              aria-label="Clear values"
              className="grid size-6 cursor-pointer place-items-center rounded-md text-faint transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              title="Clear values"
            >
              <ArrowsClockwise className="size-3" weight="bold" />
            </button>
          )}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid gap-2 sm:grid-cols-2">
        {variables.map((v) => {
          const hasValue = Boolean(values[v]?.trim());
          return (
            <label key={v} className="block">
              <span className="mb-1 flex items-center gap-1.5 text-[10.5px] font-medium text-faint">
                <span className="font-mono text-accent-fg">{`{${v}}`}</span>
                {hasValue && (
                  <span className="rounded-full bg-accent/[0.15] px-1.5 py-px text-[9px] text-accent-fg">
                    set
                  </span>
                )}
              </span>
              <input
                type="text"
                value={values[v] ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [v]: e.target.value }))
                }
                placeholder={placeholderFor(v)}
                aria-label={`Value for ${v}`}
                className="h-9 w-full rounded-lg border border-line bg-bg px-2.5 text-[12.5px] text-ink placeholder:text-faint transition-colors focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              />
            </label>
          );
        })}
      </div>

      {/* Live filled prompt */}
      <div className="mt-3 rounded-xl border border-line-soft bg-bg">
        <div className="flex items-center justify-between border-b border-line-soft px-3 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-faint">
            {allFilled ? "Ready to use" : "Preview"}
          </span>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy filled prompt"
            className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] text-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {copied ? (
              <>
                <CheckCircle weight="fill" className="size-3 text-accent-fg" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3" />
                Copy filled
              </>
            )}
          </button>
        </div>
        <p className="max-h-32 overflow-y-auto whitespace-pre-wrap px-3 py-2 text-[12px] leading-relaxed text-muted">
          {renderFilledPrompt(filled)}
        </p>
      </div>
    </div>
  );
}

/**
 * Split the filled prompt so unresolved `{variable}` tokens render as tinted
 * chips in situ — makes it obvious which slots still need a value.
 */
function renderFilledPrompt(filled: string): React.ReactNode {
  const parts = filled.split(/(\{[a-zA-Z][a-zA-Z0-9_-]{0,39}\})/g);
  return parts.map((part, i) => {
    if (/^\{[a-zA-Z][a-zA-Z0-9_-]{0,39}\}$/.test(part)) {
      return (
        <span
          key={i}
          className="mx-0.5 rounded-md border border-amber-500/40 bg-amber-500/[0.08] px-1 py-px font-mono text-[11px] text-amber-300"
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * Generate a placeholder hint from the variable name so blank inputs still
 * carry meaning: "product" → "e.g. Marrow Bowl", "platform" → "e.g. Instagram".
 */
function placeholderFor(name: string): string {
  const hints: Record<string, string> = {
    product: "e.g. Marrow Bowl",
    platform: "e.g. Instagram",
    brand: "e.g. Marrow Studio",
    audience: "e.g. slow-living creators",
    topic: "e.g. autumn ceramic collection",
    process: "e.g. hand-throwing a bowl",
    handle: "e.g. @studio_name",
    subject: "e.g. hand-thrown mug",
  };
  return hints[name] ?? `Value for ${name}`;
}
