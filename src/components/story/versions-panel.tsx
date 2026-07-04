"use client";

/**
 * Version tree — story-level Git-style snapshots.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChatCircle,
  ClockClockwise,
  Copy,
  GitBranch,
  GitMerge,
  X,
} from "@phosphor-icons/react";
import { useStory } from "@/lib/story/store";
import {
  compareStorySnapshots,
  findStorySnapshot,
  storyBranchTips,
  storyHead,
  storyLineage,
} from "@/lib/story/story-versions";

export function VersionsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    storyTree,
    commitStoryTake,
    branchStory,
    restoreStoryTake,
    duplicateStoryTake,
    mergeStoryTakes,
    labelStoryTake,
    addStoryTakeComment,
    removeStoryTakeComment,
    setStoryTakeApproval,
  } = useStory();
  const reduce = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState("");
  const [branchName, setBranchName] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [mergeSource, setMergeSource] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setSelectedId((prev) => prev ?? storyTree.headId);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, storyTree.headId]);

  const head = storyHead(storyTree);
  const selected = selectedId ? findStorySnapshot(storyTree, selectedId) : head;
  const diff = useMemo(() => {
    if (!selected || !head || selected.id === head.id) return null;
    return compareStorySnapshots(head, selected);
  }, [selected, head]);

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
            aria-label="Close versions"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Story versions"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-[85vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <div className="mb-1 inline-flex items-center gap-2">
                  <ClockClockwise className="size-4 text-accent-fg" weight="fill" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">Versions</p>
                </div>
                <h2 className="text-[18px] font-semibold text-ink">Story Version Tree</h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  Commit takes, branch alternates, merge, compare, restore.
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

            {/* Commit / branch bar */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-bg/40 px-6 py-3">
              <input
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                placeholder="Label (optional)"
                className="h-8 w-40 rounded-md border border-line bg-surface px-2 text-[12px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <button
                type="button"
                onClick={() => {
                  const id = commitStoryTake(labelDraft.trim() || undefined);
                  setSelectedId(id);
                  setLabelDraft("");
                }}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 text-[12px] font-medium text-ink hover:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                Commit take
              </button>
              <div className="inline-flex items-center gap-1 rounded-full border border-line px-2 pl-3 text-[12px] text-muted">
                <GitBranch className="size-3" />
                <input
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="branch-name"
                  className="w-24 border-0 bg-transparent px-1 py-0.5 text-[12px] text-ink focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!branchName.trim()) return;
                    branchStory(branchName.trim());
                    setBranchName("");
                  }}
                  className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  Branch
                </button>
              </div>
              <p className="ml-auto text-[11px] text-faint">
                {storyTree.snapshots.length} snapshot · {storyBranchTips(storyTree).length} branch
              </p>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)]">
              <aside className="min-h-0 overflow-y-auto border-r border-line">
                {storyTree.snapshots.length === 0 ? (
                  <div className="p-6 text-center text-[12px] text-muted">
                    Commit your first take to start the tree.
                  </div>
                ) : (
                  <ul className="divide-y divide-line">
                    {storyTree.snapshots.map((s) => {
                      const active = s.id === selected?.id;
                      const isHead = s.id === storyTree.headId;
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(s.id)}
                            aria-current={active ? "true" : undefined}
                            className={`w-full cursor-pointer px-4 py-2 text-left transition-colors ${
                              active ? "bg-accent/[0.06]" : "hover:bg-bg/60"
                            }`}
                          >
                            <div className="flex items-baseline justify-between">
                              <p className="truncate text-[12.5px] font-medium text-ink">
                                {s.label ?? s.id.slice(0, 10)}
                              </p>
                              {isHead && (
                                <span className="rounded-full border border-accent/50 bg-accent/10 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-ink">
                                  head
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-muted">
                              {s.branchId && (
                                <span className="inline-flex items-center gap-0.5 rounded-full border border-line bg-surface px-1 py-0.5 text-[10px] text-muted">
                                  <GitBranch className="size-2" />
                                  {s.branchId}
                                </span>
                              )}
                              {s.approval && s.approval !== "draft" && (
                                <span className="rounded-full border border-line px-1 py-0.5 text-[10px] text-muted">
                                  {s.approval}
                                </span>
                              )}
                              {s.comments.length > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-faint">
                                  <ChatCircle className="size-2" />
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

              <section className="min-h-0 overflow-y-auto p-4">
                {!selected ? (
                  <p className="text-[12px] text-muted">Pick a snapshot.</p>
                ) : (
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">Take</p>
                      <input
                        value={selected.label ?? ""}
                        onChange={(e) => labelStoryTake(selected.id, e.target.value)}
                        className="flex-1 border-0 bg-transparent p-0 text-[15px] font-semibold text-ink focus:outline-none focus:ring-0"
                        placeholder="Name this take"
                      />
                      <select
                        value={selected.approval ?? "draft"}
                        onChange={(e) =>
                          setStoryTakeApproval(
                            selected.id,
                            e.target.value as "draft" | "in-review" | "approved" | "rejected",
                          )
                        }
                        className="h-8 rounded-md border border-line bg-bg px-2 text-[12px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                      >
                        <option value="draft">draft</option>
                        <option value="in-review">in-review</option>
                        <option value="approved">approved</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </div>

                    {/* Slides preview */}
                    <div className="rounded-xl border border-line bg-bg p-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
                        Slides ({selected.slides.length})
                      </p>
                      <ul className="grid gap-0.5 text-[11.5px]">
                        {selected.slides.slice(0, 8).map((s) => (
                          <li key={s.id} className="truncate">
                            <span className="text-faint">#{s.index + 1}</span> · {s.title || s.body.slice(0, 50) || "—"}
                          </li>
                        ))}
                        {selected.slides.length > 8 && (
                          <li className="text-faint">…and {selected.slides.length - 8} more</li>
                        )}
                      </ul>
                    </div>

                    {/* Diff */}
                    {diff && (
                      <div className="rounded-xl border border-line bg-bg p-3">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
                          Diff against HEAD
                        </p>
                        {diff.slideDiffs.length === 0 ? (
                          <p className="text-[12px] text-muted">No slide-level changes.</p>
                        ) : (
                          <ul className="grid gap-0.5 text-[11.5px]">
                            {diff.slideDiffs.map((d) => (
                              <li key={d.slideId} className="flex items-baseline gap-2">
                                <span className="w-16 text-faint">#{d.index + 1}</span>
                                <span
                                  className={
                                    d.kind === "added"
                                      ? "text-emerald-300/90"
                                      : d.kind === "removed"
                                        ? "text-rose-300/90"
                                        : "text-ink"
                                  }
                                >
                                  {d.kind}
                                </span>
                                {d.after?.title && <span className="text-muted">· {d.after.title}</span>}
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
                        onClick={() => restoreStoryTake(selected.id)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-[12px] font-medium text-ink hover:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        <ClockClockwise className="size-3" weight="bold" />
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateStoryTake(selected.id)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-line px-3 py-1 text-[12px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        <Copy className="size-3" weight="bold" />
                        Duplicate
                      </button>
                      <div className="inline-flex items-center gap-1 rounded-full border border-line px-1 pl-3 text-[12px] text-muted">
                        <GitMerge className="size-3" />
                        <select
                          value={mergeSource}
                          onChange={(e) => setMergeSource(e.target.value)}
                          className="h-6 rounded-md border-0 bg-transparent px-1 text-[12px] text-ink focus:outline-none"
                        >
                          <option value="">choose source…</option>
                          {storyTree.snapshots
                            .filter((s) => s.id !== selected.id)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label ?? s.id.slice(0, 12)}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (!mergeSource) return;
                            mergeStoryTakes(selected.id, mergeSource);
                            setMergeSource("");
                          }}
                          className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        >
                          Merge in
                        </button>
                      </div>
                    </div>

                    {/* Comments */}
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
                        Comments
                      </p>
                      <div className="mb-2 flex items-center gap-1">
                        <input
                          value={commentDraft}
                          onChange={(e) => setCommentDraft(e.target.value)}
                          placeholder="Add a note…"
                          className="h-8 flex-1 rounded-md border border-line bg-bg px-2 text-[12px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!commentDraft.trim()) return;
                            addStoryTakeComment(selected.id, commentDraft);
                            setCommentDraft("");
                          }}
                          className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        >
                          Add
                        </button>
                      </div>
                      {selected.comments.length > 0 && (
                        <ul className="grid gap-1">
                          {selected.comments.map((c) => (
                            <li
                              key={c.id}
                              className="flex items-center gap-2 rounded-lg border border-line bg-bg px-2 py-1 text-[11.5px]"
                            >
                              <span className="truncate text-ink">{c.body}</span>
                              <button
                                type="button"
                                onClick={() => removeStoryTakeComment(selected.id, c.id)}
                                aria-label="Delete comment"
                                className="ml-auto rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                              >
                                Delete
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Lineage */}
                    <div className="rounded-xl border border-line bg-bg p-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-faint">Lineage</p>
                      <ul className="flex flex-wrap items-center gap-1 text-[11.5px]">
                        {storyLineage(storyTree, selected.id).map((s, i, arr) => (
                          <li key={s.id} className="inline-flex items-center gap-1">
                            <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-muted">
                              {s.label ?? s.id.slice(0, 12)}
                            </span>
                            {i < arr.length - 1 && <span className="text-faint">←</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
