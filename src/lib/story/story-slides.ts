/**
 * Story Slide model — the atomic unit of Story Studio 2.0.
 *
 * A rich slide holds not just copy but the full production plan: visual,
 * video, voiceover, music, CTA, poll, question, sticker, duration,
 * transition, animation, goal, emotion, notes, attachments, plus
 * per-slide status / approval / color-label / comments / versions.
 *
 * Pure. No React. The Story store owns persistence.
 */

import type { StorySlide } from "@/lib/ai/types";

// ─── Enums ────────────────────────────────────────────────────────────────

export const SLIDE_STATUSES = ["draft", "in-progress", "ready", "shot", "published"] as const;
export type SlideStatus = (typeof SLIDE_STATUSES)[number];

export const SLIDE_APPROVALS = ["draft", "in-review", "approved", "changes-requested", "rejected"] as const;
export type SlideApproval = (typeof SLIDE_APPROVALS)[number];

export const SLIDE_COLORS = [
  "none",
  "red",
  "amber",
  "lime",
  "emerald",
  "cyan",
  "violet",
  "pink",
] as const;
export type SlideColor = (typeof SLIDE_COLORS)[number];

export const SLIDE_TRANSITIONS = [
  "cut",
  "fade",
  "slide-left",
  "slide-up",
  "zoom",
  "whip",
  "dissolve",
  "wipe",
] as const;
export type SlideTransition = (typeof SLIDE_TRANSITIONS)[number];

export const SLIDE_ANIMATIONS = [
  "none",
  "kenburns",
  "parallax",
  "text-in",
  "reveal",
  "shake",
  "punch-in",
  "hand-drawn",
] as const;
export type SlideAnimation = (typeof SLIDE_ANIMATIONS)[number];

export const SLIDE_EMOTIONS = [
  "curious",
  "excited",
  "calm",
  "urgent",
  "warm",
  "vulnerable",
  "bold",
  "playful",
  "sombre",
  "aspirational",
] as const;
export type SlideEmotion = (typeof SLIDE_EMOTIONS)[number];

export const SLIDE_GOALS = [
  "hook",
  "context",
  "teach",
  "persuade",
  "empathy",
  "reveal",
  "showcase",
  "cta",
] as const;
export type SlideGoal = (typeof SLIDE_GOALS)[number];

// ─── Sub-entities ─────────────────────────────────────────────────────────

export type SlideCTA = {
  label: string;
  url?: string;
  style?: "soft" | "direct" | "urgent";
};

export type SlidePoll = {
  question: string;
  options: [string, string] | [string, string, string, string];
};

export type SlideQuestion = {
  prompt: string;
  placeholder?: string;
};

export type SlideSticker = {
  kind: "emoji" | "gif" | "custom";
  value: string;
};

export type SlideAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "url" | "file";
  label: string;
  url?: string;
};

export type SlideComment = {
  id: string;
  author?: string;
  body: string;
  createdAt: number;
};

export type SlideVersion = {
  id: string;
  createdAt: number;
  label?: string;
  note?: string;
  // Immutable snapshot of the editable fields.
  title: string;
  body: string;
  cta?: SlideCTA;
};

// ─── The slide itself ─────────────────────────────────────────────────────

export type RichSlide = {
  id: string;
  index: number;
  title: string;
  body: string;
  /** Visual direction hint (or link to a Vision concept) */
  visual?: string;
  /** Optional link to a Vision Studio concept for this slide */
  visionConceptId?: string;
  /** Video reference — URL or asset id */
  video?: string;
  /** Voiceover script */
  voiceover?: string;
  /** Background music description or asset id */
  music?: string;
  cta?: SlideCTA;
  poll?: SlidePoll;
  question?: SlideQuestion;
  sticker?: SlideSticker;
  /** Seconds this slide should hold on-screen */
  duration: number;
  transition: SlideTransition;
  animation: SlideAnimation;
  goal: SlideGoal;
  emotion: SlideEmotion;
  notes?: string;
  attachments: SlideAttachment[];
  status: SlideStatus;
  approval: SlideApproval;
  color: SlideColor;
  /** Collapse in the storyboard */
  collapsed?: boolean;
  /** Optional group tag for grouping sibling slides */
  group?: string;
  comments: SlideComment[];
  history: SlideVersion[];
  createdAt: number;
  updatedAt: number;
};

// ─── Factories ────────────────────────────────────────────────────────────

export function emptySlide(id: string, index: number, now: number = Date.now()): RichSlide {
  return {
    id,
    index,
    title: "",
    body: "",
    duration: 5,
    transition: "cut",
    animation: "none",
    goal: "context",
    emotion: "calm",
    attachments: [],
    status: "draft",
    approval: "draft",
    color: "none",
    comments: [],
    history: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Adapt the legacy StorySlide shape (from the AI generation flow) into a
 * RichSlide so upgrading an existing story doesn't lose text.
 */
export function fromLegacySlide(
  legacy: StorySlide,
  id: string,
  index: number,
  now: number = Date.now(),
): RichSlide {
  const cta = legacy.cta
    ? { label: legacy.cta }
    : undefined;
  return {
    ...emptySlide(id, index, now),
    title: legacy.copy?.split("\n")[0]?.slice(0, 80) ?? "",
    body: legacy.copy ?? "",
    voiceover: legacy.speakerNotes,
    visual: legacy.visualSuggestion,
    cta,
    goal: index === 0 ? "hook" : "context",
  };
}

// ─── Slide operations ─────────────────────────────────────────────────────

export function updateSlideFields(
  slide: RichSlide,
  patch: Partial<Omit<RichSlide, "id" | "createdAt" | "comments" | "history">>,
  now: number = Date.now(),
): RichSlide {
  return { ...slide, ...patch, updatedAt: now };
}

export function snapshotSlideVersion(
  slide: RichSlide,
  id: string,
  label?: string,
  note?: string,
  now: number = Date.now(),
): RichSlide {
  const version: SlideVersion = {
    id,
    createdAt: now,
    label,
    note,
    title: slide.title,
    body: slide.body,
    cta: slide.cta,
  };
  return {
    ...slide,
    history: [version, ...slide.history].slice(0, 20),
    updatedAt: now,
  };
}

export function restoreSlideVersion(slide: RichSlide, versionId: string): RichSlide {
  const v = slide.history.find((h) => h.id === versionId);
  if (!v) return slide;
  return {
    ...slide,
    title: v.title,
    body: v.body,
    cta: v.cta,
    updatedAt: Date.now(),
  };
}

export function addSlideComment(slide: RichSlide, comment: SlideComment): RichSlide {
  return {
    ...slide,
    comments: [comment, ...slide.comments],
    updatedAt: comment.createdAt,
  };
}

export function removeSlideComment(slide: RichSlide, commentId: string): RichSlide {
  return {
    ...slide,
    comments: slide.comments.filter((c) => c.id !== commentId),
    updatedAt: Date.now(),
  };
}

// ─── Slide-list operations ────────────────────────────────────────────────

export function reindexSlides(slides: RichSlide[]): RichSlide[] {
  return slides.map((s, i) => (s.index === i ? s : { ...s, index: i }));
}

export function insertSlide(
  slides: RichSlide[],
  atIndex: number,
  slide: RichSlide,
): RichSlide[] {
  const clamped = Math.max(0, Math.min(atIndex, slides.length));
  return reindexSlides([...slides.slice(0, clamped), slide, ...slides.slice(clamped)]);
}

export function removeSlide(slides: RichSlide[], id: string): RichSlide[] {
  return reindexSlides(slides.filter((s) => s.id !== id));
}

export function moveSlide(
  slides: RichSlide[],
  fromIndex: number,
  toIndex: number,
): RichSlide[] {
  if (fromIndex === toIndex) return slides;
  if (fromIndex < 0 || fromIndex >= slides.length) return slides;
  const next = [...slides];
  const [moved] = next.splice(fromIndex, 1);
  const clampedTo = Math.max(0, Math.min(toIndex, next.length));
  next.splice(clampedTo, 0, moved!);
  return reindexSlides(next);
}

export function duplicateSlide(
  slides: RichSlide[],
  id: string,
  newId: string,
  now: number = Date.now(),
): RichSlide[] {
  const src = slides.find((s) => s.id === id);
  if (!src) return slides;
  const clone: RichSlide = {
    ...src,
    id: newId,
    createdAt: now,
    updatedAt: now,
    comments: [],
    history: [],
    color: src.color,
  };
  const idx = slides.findIndex((s) => s.id === id);
  return insertSlide(slides, idx + 1, clone);
}

/**
 * Split — turn one slide into two by cutting the body at a delimiter (or
 * midpoint if no delimiter is provided).
 */
export function splitSlide(
  slides: RichSlide[],
  id: string,
  newId: string,
  splitAt?: number,
): RichSlide[] {
  const src = slides.find((s) => s.id === id);
  if (!src) return slides;
  const body = src.body;
  const at = splitAt ?? Math.floor(body.length / 2);
  const clampAt = Math.max(0, Math.min(at, body.length));
  const first = body.slice(0, clampAt).trim();
  const second = body.slice(clampAt).trim();
  const idx = slides.findIndex((s) => s.id === id);
  const updated: RichSlide = {
    ...src,
    body: first,
    updatedAt: Date.now(),
  };
  const cloned: RichSlide = {
    ...src,
    id: newId,
    title: src.title ? `${src.title} · continued` : "",
    body: second,
    comments: [],
    history: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const next = [...slides];
  next[idx] = updated;
  return insertSlide(next, idx + 1, cloned);
}

/**
 * Merge — combine two consecutive slides into one, appending the second's
 * body onto the first's and dropping the second.
 */
export function mergeSlides(
  slides: RichSlide[],
  firstId: string,
  secondId: string,
): RichSlide[] {
  const a = slides.find((s) => s.id === firstId);
  const b = slides.find((s) => s.id === secondId);
  if (!a || !b) return slides;
  const merged: RichSlide = {
    ...a,
    body: [a.body, b.body].filter(Boolean).join("\n\n"),
    voiceover: [a.voiceover, b.voiceover].filter(Boolean).join(" ") || undefined,
    notes: [a.notes, b.notes].filter(Boolean).join("\n") || undefined,
    attachments: [...a.attachments, ...b.attachments],
    duration: a.duration + b.duration,
    updatedAt: Date.now(),
  };
  return reindexSlides(
    slides.filter((s) => s.id !== secondId).map((s) => (s.id === firstId ? merged : s)),
  );
}

export function groupSlides(
  slides: RichSlide[],
  ids: string[],
  groupName: string,
): RichSlide[] {
  const set = new Set(ids);
  return slides.map((s) => (set.has(s.id) ? { ...s, group: groupName } : s));
}

export function ungroupSlides(slides: RichSlide[], groupName: string): RichSlide[] {
  return slides.map((s) => (s.group === groupName ? { ...s, group: undefined } : s));
}

// ─── Read helpers ─────────────────────────────────────────────────────────

export function totalDurationSeconds(slides: RichSlide[]): number {
  return slides.reduce((n, s) => n + (s.duration || 0), 0);
}

export function statusCounts(slides: RichSlide[]): Record<SlideStatus, number> {
  const acc: Record<SlideStatus, number> = {
    draft: 0,
    "in-progress": 0,
    ready: 0,
    shot: 0,
    published: 0,
  };
  for (const s of slides) acc[s.status] = (acc[s.status] ?? 0) + 1;
  return acc;
}

export function approvalCounts(slides: RichSlide[]): Record<SlideApproval, number> {
  const acc: Record<SlideApproval, number> = {
    draft: 0,
    "in-review": 0,
    approved: 0,
    "changes-requested": 0,
    rejected: 0,
  };
  for (const s of slides) acc[s.approval] = (acc[s.approval] ?? 0) + 1;
  return acc;
}
