/**
 * Publishing engine — the local, deterministic queue that Story Studio
 * uses to plan when a story ships to each platform. No real network
 * calls — the studio records intent so a publishing worker (or the
 * creator) can act on it.
 */

import type { StoryPlatformId } from "./story-platforms";

export const PUBLISH_STATUSES = [
  "draft",
  "scheduled",
  "queued",
  "published",
  "failed",
  "needs-review",
] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

export type PublishItem = {
  id: string;
  storyId: string;
  platform: StoryPlatformId;
  status: PublishStatus;
  /** Epoch ms — when to publish */
  scheduledAt?: number;
  /** Epoch ms — when it actually shipped */
  publishedAt?: number;
  /** Optional URL to the live post */
  publishedUrl?: string;
  /** Optional failure reason */
  failureReason?: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
};

export type PublishQueue = PublishItem[];

// ─── Mutations ────────────────────────────────────────────────────────────

export function addPublishItem(
  queue: PublishQueue,
  input: {
    id: string;
    storyId: string;
    platform: StoryPlatformId;
    scheduledAt?: number;
    status?: PublishStatus;
    note?: string;
    now?: number;
  },
): PublishQueue {
  const now = input.now ?? Date.now();
  const item: PublishItem = {
    id: input.id,
    storyId: input.storyId,
    platform: input.platform,
    scheduledAt: input.scheduledAt,
    status: input.status ?? (input.scheduledAt ? "scheduled" : "draft"),
    note: input.note,
    createdAt: now,
    updatedAt: now,
  };
  return [item, ...queue];
}

export function updatePublishItem(
  queue: PublishQueue,
  id: string,
  patch: Partial<PublishItem>,
  now: number = Date.now(),
): PublishQueue {
  return queue.map((it) =>
    it.id === id ? { ...it, ...patch, updatedAt: now } : it,
  );
}

export function removePublishItem(queue: PublishQueue, id: string): PublishQueue {
  return queue.filter((it) => it.id !== id);
}

export function setPublishStatus(
  queue: PublishQueue,
  id: string,
  status: PublishStatus,
  extra?: { publishedAt?: number; publishedUrl?: string; failureReason?: string },
): PublishQueue {
  return updatePublishItem(queue, id, {
    status,
    publishedAt: extra?.publishedAt ?? (status === "published" ? Date.now() : undefined),
    publishedUrl: extra?.publishedUrl,
    failureReason: extra?.failureReason,
  });
}

// ─── Read helpers ─────────────────────────────────────────────────────────

export function queueForStory(queue: PublishQueue, storyId: string): PublishItem[] {
  return queue.filter((it) => it.storyId === storyId);
}

export function queueForStatus(queue: PublishQueue, status: PublishStatus): PublishItem[] {
  return queue.filter((it) => it.status === status);
}

export function queueForDay(queue: PublishQueue, dayStart: number, dayEnd: number): PublishItem[] {
  return queue.filter(
    (it) => it.scheduledAt != null && it.scheduledAt >= dayStart && it.scheduledAt < dayEnd,
  );
}

export function statusSummary(queue: PublishQueue): Record<PublishStatus, number> {
  const acc: Record<PublishStatus, number> = {
    draft: 0,
    scheduled: 0,
    queued: 0,
    published: 0,
    failed: 0,
    "needs-review": 0,
  };
  for (const it of queue) acc[it.status] = (acc[it.status] ?? 0) + 1;
  return acc;
}

export function upcomingWithin(
  queue: PublishQueue,
  windowMs: number,
  now: number = Date.now(),
): PublishItem[] {
  return queue
    .filter(
      (it) =>
        (it.status === "scheduled" || it.status === "queued") &&
        it.scheduledAt != null &&
        it.scheduledAt >= now &&
        it.scheduledAt <= now + windowMs,
    )
    .sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0));
}
