"use client";

/**
 * Publishing Center — schedule + queue view over all publish items for
 * this project.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PaperPlaneTilt, Trash, X } from "@phosphor-icons/react";
import { useStory } from "@/lib/story/store";
import { STORY_PLATFORMS, type StoryPlatformId } from "@/lib/story/story-platforms";
import { statusSummary } from "@/lib/story/story-publishing";

export function PublishingPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    stories,
    publishQueue,
    publishStory,
    removePublish,
    markPublishStatus,
  } = useStory();
  const reduce = useReducedMotion();
  const [selectedStory, setSelectedStory] = useState<string>("");
  const [selectedPlatform, setSelectedPlatform] = useState<StoryPlatformId>("instagram");
  const [scheduledAt, setScheduledAt] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setSelectedStory((prev) => prev || stories[0]?.id || "");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, stories]);

  const summary = useMemo(() => statusSummary(publishQueue), [publishQueue]);

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
            aria-label="Close publishing"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Publishing Center"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-[85vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <div className="mb-1 inline-flex items-center gap-2">
                  <PaperPlaneTilt className="size-4 text-accent-fg" weight="fill" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">Delivery</p>
                </div>
                <h2 className="text-[18px] font-semibold text-ink">Publishing Center</h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  Queue every story to every platform. Draft → Scheduled → Queued → Published.
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

            <div className="grid gap-3 border-b border-line bg-bg/40 px-6 py-4 sm:grid-cols-2">
              <label className="grid gap-1 text-[12px]">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-faint">Story</span>
                <select
                  value={selectedStory}
                  onChange={(e) => setSelectedStory(e.target.value)}
                  className="h-8 rounded-md border border-line bg-surface px-2 text-[12px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  <option value="">Select story…</option>
                  {stories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-[12px]">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-faint">Platform</span>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value as StoryPlatformId)}
                  className="h-8 rounded-md border border-line bg-surface px-2 text-[12px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {STORY_PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-[12px]">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-faint">Schedule</span>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="h-8 rounded-md border border-line bg-surface px-2 text-[12px] text-ink focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </label>
              <div className="flex items-end gap-2 text-[11px] text-muted">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedStory) return;
                    const t = scheduledAt ? new Date(scheduledAt).getTime() : undefined;
                    publishStory(selectedStory, selectedPlatform, t);
                  }}
                  disabled={!selectedStory}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 text-[12px] font-medium text-ink hover:border-accent/70 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <PaperPlaneTilt className="size-3" weight="bold" />
                  Enqueue
                </button>
                <span className="ml-auto text-[11px] text-faint">
                  Draft {summary.draft} · Scheduled {summary.scheduled} · Published {summary.published} · Failed {summary.failed}
                </span>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {publishQueue.length === 0 ? (
                <p className="text-[13px] text-muted">Nothing in the queue yet.</p>
              ) : (
                <ul className="grid gap-2">
                  {publishQueue.map((item) => {
                    const story = stories.find((s) => s.id === item.storyId);
                    return (
                      <li
                        key={item.id}
                        className="rounded-xl border border-line bg-bg p-3"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-[13px] font-semibold text-ink">
                            {story?.name ?? item.storyId}
                          </p>
                          <span className="text-[10.5px] uppercase tracking-widest text-faint">
                            {item.platform}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11.5px] text-muted">
                          Status · <span className="text-ink">{item.status}</span>
                          {item.scheduledAt && (
                            <span className="text-faint">
                              {" "}· {new Date(item.scheduledAt).toLocaleString()}
                            </span>
                          )}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => markPublishStatus(item.id, "queued")}
                            className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          >
                            Queue
                          </button>
                          <button
                            type="button"
                            onClick={() => markPublishStatus(item.id, "published")}
                            className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          >
                            Mark published
                          </button>
                          <button
                            type="button"
                            onClick={() => markPublishStatus(item.id, "needs-review")}
                            className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          >
                            Needs review
                          </button>
                          <button
                            type="button"
                            onClick={() => removePublish(item.id)}
                            aria-label="Remove queue item"
                            className="ml-auto rounded-full border border-line p-1 text-faint hover:border-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          >
                            <Trash className="size-3" weight="bold" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
