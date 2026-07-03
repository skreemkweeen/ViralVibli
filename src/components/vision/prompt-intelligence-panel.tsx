"use client";

/**
 * Prompt Intelligence modal — three tabs over the current prompt:
 *   • Versions — Git-like snapshot tree with commit / branch / restore /
 *     duplicate / merge / label / comments.
 *   • Inspector — 9 diagnostic dimensions with per-dimension score,
 *     reason, and actionable fix.
 *   • Scorecard — Creative Director scorecard: 7 axes with why + how to
 *     improve, plus headline / weakest highlights.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Brain,
  ChatCircle,
  ClockClockwise,
  Copy,
  GitBranch,
  GitMerge,
  Tag,
  Target,
  Trash,
  X,
} from "@phosphor-icons/react";
import { useVision } from "@/lib/vision/vision-store";
import { compareSnapshots, head, lineage, type PromptSnapshot } from "@/lib/vision/prompt-versions";
import type { DimensionScore } from "@/lib/vision/prompt-inspector";
import type { DirectorAxisScore } from "@/lib/vision/director-scores";

type Tab = "versions" | "inspector" | "scorecard";

export function PromptIntelligencePanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    promptTree,
    commitPromptSnapshot,
    branchPromptFromHead,
    restorePromptSnapshot,
    duplicatePromptSnapshot,
    mergePromptSnapshots,
    labelPromptSnapshot,
    addPromptComment,
    removePromptComment,
    inspection,
    scorecard,
  } = useVision();
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("versions");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [branchName, setBranchName] = useState("");
  const [mergePicker, setMergePicker] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const currentHead = head(promptTree);
  const selected = useMemo(
    () =>
      selectedId
        ? promptTree.snapshots.find((s) => s.id === selectedId)
        : currentHead,
    [selectedId, promptTree.snapshots, currentHead],
  );

  const diffAgainstHead = useMemo(() => {
    if (!selected || !currentHead || selected.id === currentHead.id) return null;
    return compareSnapshots(currentHead, selected);
  }, [selected, currentHead]);

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
            aria-label="Close Prompt Intelligence"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Prompt Intelligence"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-[85vh] w-full max-w-[1120px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <div className="mb-1 inline-flex items-center gap-2">
                  <Brain className="size-4 text-accent-fg" weight="fill" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                    Intelligence
                  </p>
                </div>
                <h2 className="text-[18px] font-semibold text-ink">
                  Prompt Intelligence
                </h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  Versions, diagnostics, and creative director scores over the
                  current prompt.
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
                { id: "versions" as const, label: "Versions", icon: ClockClockwise },
                { id: "inspector" as const, label: "Inspector", icon: Target },
                { id: "scorecard" as const, label: "Scorecard", icon: Brain },
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
              {tab === "versions" && (
                <div className="ml-auto flex items-center gap-1.5">
                  <input
                    value={labelDraft}
                    onChange={(e) => setLabelDraft(e.target.value)}
                    placeholder="Label (optional)"
                    className="h-7 w-40 rounded-md border border-line bg-surface px-2 text-[12px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                    aria-label="Snapshot label"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const id = commitPromptSnapshot(
                        labelDraft.trim() || undefined,
                      );
                      setSelectedId(id);
                      setLabelDraft("");
                    }}
                    className="cursor-pointer rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-[12px] font-medium text-ink hover:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    Commit snapshot
                  </button>
                </div>
              )}
            </div>

            {/* Body */}
            {tab === "versions" && (
              <VersionsTab
                snapshots={promptTree.snapshots}
                headId={promptTree.headId}
                selected={selected ?? null}
                onSelect={setSelectedId}
                onRestore={restorePromptSnapshot}
                onDuplicate={duplicatePromptSnapshot}
                onLabel={labelPromptSnapshot}
                onAddComment={addPromptComment}
                onRemoveComment={removePromptComment}
                commentDraft={commentDraft}
                setCommentDraft={setCommentDraft}
                branchName={branchName}
                setBranchName={setBranchName}
                onBranch={(name) => branchPromptFromHead(name)}
                diff={diffAgainstHead}
                mergePicker={mergePicker}
                setMergePicker={setMergePicker}
                onMerge={mergePromptSnapshots}
              />
            )}
            {tab === "inspector" && (
              <InspectorTab
                overall={inspection.overall}
                dimensions={inspection.dimensions}
              />
            )}
            {tab === "scorecard" && (
              <ScorecardTab
                axes={scorecard.axes}
                headline={scorecard.headline}
                weakest={scorecard.weakest}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Versions tab ─────────────────────────────────────────────────────────

function VersionsTab({
  snapshots,
  headId,
  selected,
  onSelect,
  onRestore,
  onDuplicate,
  onLabel,
  onAddComment,
  onRemoveComment,
  commentDraft,
  setCommentDraft,
  branchName,
  setBranchName,
  onBranch,
  diff,
  mergePicker,
  setMergePicker,
  onMerge,
}: {
  snapshots: PromptSnapshot[];
  headId: string | null;
  selected: PromptSnapshot | null;
  onSelect: (id: string | null) => void;
  onRestore: (id: string) => void;
  onDuplicate: (id: string) => void;
  onLabel: (id: string, label: string) => void;
  onAddComment: (id: string, body: string) => void;
  onRemoveComment: (id: string, commentId: string) => void;
  commentDraft: string;
  setCommentDraft: (v: string) => void;
  branchName: string;
  setBranchName: (v: string) => void;
  onBranch: (name: string) => void;
  diff: ReturnType<typeof compareSnapshots> | null;
  mergePicker: string | null;
  setMergePicker: (v: string | null) => void;
  onMerge: (intoId: string, takeId: string) => void;
}) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)]">
      <aside className="min-h-0 overflow-y-auto border-r border-line">
        {snapshots.length === 0 ? (
          <div className="p-6 text-center">
            <ClockClockwise className="mx-auto mb-2 size-6 text-faint" />
            <p className="text-[13px] text-muted">No snapshots yet.</p>
            <p className="mt-0.5 text-[11.5px] text-faint">
              Commit a snapshot to start tracking.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {snapshots.map((s) => {
              const active = s.id === selected?.id;
              const isHead = s.id === headId;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(s.id)}
                    aria-current={active ? "true" : undefined}
                    className={`w-full cursor-pointer px-4 py-3 text-left transition-colors ${
                      active ? "bg-accent/[0.06]" : "hover:bg-bg/60"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {s.label ?? shortId(s.id)}
                      </p>
                      {isHead && (
                        <span className="rounded-full border border-accent/50 bg-accent/10 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-ink">
                          head
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                      {s.branchId && (
                        <span className="inline-flex items-center gap-0.5 rounded-full border border-line bg-surface px-1.5 py-0.5 text-[10px] text-muted">
                          <GitBranch className="size-2.5" />
                          {s.branchId}
                        </span>
                      )}
                      {s.comments.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-faint">
                          <ChatCircle className="size-2.5" />
                          {s.comments.length}
                        </span>
                      )}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <section className="min-h-0 overflow-y-auto">
        {!selected ? (
          <div className="flex h-full items-center justify-center p-6 text-[13px] text-muted">
            Commit a snapshot to inspect it.
          </div>
        ) : (
          <div className="grid gap-4 px-6 py-5">
            {/* Selected snapshot header */}
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                {selected.branchId ? "Branch" : "Snapshot"}
              </p>
              <input
                value={selected.label ?? ""}
                onChange={(e) => onLabel(selected.id, e.target.value)}
                placeholder="Add a label"
                className="flex-1 border-0 bg-transparent p-0 text-[18px] font-semibold text-ink focus:outline-none focus:ring-0"
                aria-label="Snapshot label"
              />
            </div>

            {/* Prompt */}
            <div className="rounded-xl border border-line bg-bg p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
                Prompt
              </p>
              <p className="text-[12.5px] leading-relaxed text-ink">
                {selected.prompt}
              </p>
            </div>

            {/* Diff */}
            {diff && (
              <div className="rounded-xl border border-line bg-bg p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
                  Diff against HEAD
                </p>
                {diff.fieldDiffs.length === 0 ? (
                  <p className="text-[12px] text-muted">
                    Only the prompt text differs — the Direction fields are the same.
                  </p>
                ) : (
                  <ul className="grid gap-0.5 text-[11.5px]">
                    {diff.fieldDiffs.map((d) => (
                      <li key={d.field} className="flex items-baseline gap-2">
                        <span className="w-20 shrink-0 text-faint">
                          {d.field}
                        </span>
                        <span className="text-rose-300/80 line-through">
                          {String(d.before ?? "—")}
                        </span>
                        <span className="text-faint">→</span>
                        <span className="text-emerald-300/90">
                          {String(d.after ?? "—")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => onRestore(selected.id)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-[12px] font-medium text-ink hover:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <ClockClockwise className="size-3" weight="bold" />
                Restore
              </button>
              <button
                type="button"
                onClick={() => onDuplicate(selected.id)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-line px-3 py-1 text-[12px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <Copy className="size-3" weight="bold" />
                Duplicate
              </button>
              <div className="inline-flex items-center gap-1 rounded-full border border-line px-1 pl-3 text-[12px] text-muted">
                <GitBranch className="size-3" weight="bold" />
                <input
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="new-branch"
                  className="w-24 border-0 bg-transparent px-1 py-0.5 text-[12px] text-ink focus:outline-none focus:ring-0"
                  aria-label="New branch name"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!branchName.trim()) return;
                    onBranch(branchName.trim());
                    setBranchName("");
                  }}
                  className="cursor-pointer rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  Branch
                </button>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-line px-1 pl-3 text-[12px] text-muted">
                <GitMerge className="size-3" weight="bold" />
                <select
                  value={mergePicker ?? ""}
                  onChange={(e) => setMergePicker(e.target.value || null)}
                  className="h-6 rounded-md border-0 bg-transparent px-1 text-[12px] text-ink focus:outline-none"
                  aria-label="Merge from snapshot"
                >
                  <option value="">choose source…</option>
                  {snapshots
                    .filter((s) => s.id !== selected.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label ?? shortId(s.id)}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!mergePicker) return;
                    onMerge(selected.id, mergePicker);
                    setMergePicker(null);
                  }}
                  className="cursor-pointer rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  Merge in
                </button>
              </div>
            </div>

            {/* Comments */}
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-faint">
                <Tag className="size-3" weight="bold" />
                Comments
              </p>
              <div className="mb-2 flex items-center gap-1.5">
                <input
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="Add a note…"
                  className="h-8 flex-1 rounded-md border border-line bg-surface px-2 text-[12px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                  aria-label="Comment"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!commentDraft.trim()) return;
                    onAddComment(selected.id, commentDraft);
                    setCommentDraft("");
                  }}
                  className="cursor-pointer rounded-full border border-line px-3 py-1 text-[12px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  Add
                </button>
              </div>
              {selected.comments.length > 0 && (
                <ul className="grid gap-1">
                  {selected.comments.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-2 rounded-lg border border-line bg-bg px-3 py-1.5 text-[12px]"
                    >
                      <span className="truncate text-ink">{c.body}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveComment(selected.id, c.id)}
                        aria-label="Delete comment"
                        className="ml-auto cursor-pointer rounded-full p-0.5 text-faint transition-colors hover:text-ink"
                      >
                        <Trash className="size-3" weight="bold" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Lineage strip */}
            <div className="rounded-xl border border-line bg-bg p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
                Lineage
              </p>
              <ul className="flex flex-wrap items-center gap-1 text-[11.5px]">
                {lineage(
                  { snapshots, headId: selected.id },
                  selected.id,
                ).map((s, i, arr) => (
                  <li key={s.id} className="inline-flex items-center gap-1">
                    <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-muted">
                      {s.label ?? shortId(s.id)}
                    </span>
                    {i < arr.length - 1 && (
                      <span className="text-faint">←</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Inspector tab ────────────────────────────────────────────────────────

function InspectorTab({
  overall,
  dimensions,
}: {
  overall: number;
  dimensions: DimensionScore[];
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
      <div className="mb-4 flex items-baseline gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
          Overall
        </p>
        <p className="text-[24px] font-semibold tabular-nums text-ink">
          {overall}
          <span className="text-[16px] text-faint">/100</span>
        </p>
        <ScoreBar value={overall} />
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {dimensions.map((d) => (
          <li
            key={d.id}
            className="rounded-xl border border-line bg-bg p-3"
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[13px] font-semibold text-ink">{d.label}</p>
              <p className="text-[13px] font-semibold tabular-nums text-ink">
                {d.score}
              </p>
            </div>
            <ScoreBar value={d.score} />
            <p className="mt-1 text-[11.5px] leading-snug text-muted">
              {d.reason}
            </p>
            {d.fix && (
              <p className="mt-1 rounded-md border border-accent/30 bg-accent/[0.06] px-2 py-1 text-[11px] leading-snug text-ink">
                {d.fix}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Scorecard tab ────────────────────────────────────────────────────────

function ScorecardTab({
  axes,
  headline,
  weakest,
}: {
  axes: DirectorAxisScore[];
  headline: string;
  weakest: string;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-accent/40 bg-accent/[0.06] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
            Leans hardest into
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-ink">
            {axes.find((a) => a.id === headline)?.label ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-bg px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
            Weakest axis
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-ink">
            {axes.find((a) => a.id === weakest)?.label ?? "—"}
          </p>
        </div>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {axes.map((a) => (
          <li key={a.id} className="rounded-xl border border-line bg-bg p-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[13px] font-semibold text-ink">{a.label}</p>
              <p className="text-[13px] font-semibold tabular-nums text-ink">
                {a.score}
              </p>
            </div>
            <ScoreBar value={a.score} />
            <p className="mt-1 text-[11.5px] leading-snug text-muted">{a.why}</p>
            {a.improve && (
              <p className="mt-1 rounded-md border border-accent/30 bg-accent/[0.06] px-2 py-1 text-[11px] leading-snug text-ink">
                {a.improve}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function ScoreBar({ value }: { value: number }) {
  return (
    <div
      className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-bg"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function shortId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 4)}…${id.slice(-4)}` : id;
}
