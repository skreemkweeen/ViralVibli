import type { StorySlide } from "@/lib/ai/types";

export type StoryDirection = {
  subject: string;
  audience: string | null;
  goal: string;
  platform: string;
  voice: string | null;
  tone: string | null;
  length: string;
  ctaStyle: string | null;
  visualDirection: string | null;
  hookStrength: string;
  framework: string;
  postingSchedule: string | null;
  campaignObjective: string | null;
};

export const emptyStoryDirection: StoryDirection = {
  subject: "",
  audience: null,
  goal: "drive-engagement",
  platform: "instagram",
  voice: "authentic",
  tone: "conversational",
  length: "medium",
  ctaStyle: "soft",
  visualDirection: "lifestyle",
  hookStrength: "strong",
  framework: "aida",
  postingSchedule: null,
  campaignObjective: null,
};

export const SLIDE_COUNT_MAP: Record<string, number> = {
  short: 4,
  medium: 7,
  long: 10,
};

export type StoryConcept = {
  id: string;
  direction: StoryDirection;
  brief: string;
  slides: StorySlide[];
  provider: string;
  createdAt: number;
  favorite: boolean;
  collectionId: string | null;
  label?: string;
};

export type StoryHistoryEntry = {
  id: string;
  brief: string;
  direction: StoryDirection;
  createdAt: number;
};

export type StorySaved = {
  id: string;
  brief: string;
  direction: StoryDirection;
  tags: string[];
  createdAt: number;
};
