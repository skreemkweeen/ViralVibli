/**
 * Story Platforms — canonical specs for each supported publishing target.
 * Used by Phone Preview, Inspector platform-fit scoring, and the
 * Publishing Center.
 */

export type StoryPlatformId =
  | "instagram"
  | "lemon8"
  | "tiktok"
  | "pinterest"
  | "facebook"
  | "threads";

export type StoryPlatformSpec = {
  id: StoryPlatformId;
  label: string;
  handleLabel: string;
  /** 9:16 story or grid ratio */
  aspect: "9-16" | "4-5" | "3-4" | "1-1";
  /** Recommended max seconds per slide */
  maxSlideSeconds: number;
  /** Recommended max words per slide body */
  maxWords: number;
  /** Safe zone padding as % of viewport (top / bottom) */
  safeZoneTopPct: number;
  safeZoneBottomPct: number;
  /** Whether the platform natively supports interactive stickers */
  supportsPolls: boolean;
  supportsQuestions: boolean;
  /** Guidance line shown in the Publishing Center */
  hint: string;
};

export const STORY_PLATFORMS: StoryPlatformSpec[] = [
  {
    id: "instagram",
    label: "Instagram Stories",
    handleLabel: "@handle",
    aspect: "9-16",
    maxSlideSeconds: 15,
    maxWords: 50,
    safeZoneTopPct: 14,
    safeZoneBottomPct: 20,
    supportsPolls: true,
    supportsQuestions: true,
    hint: "Vertical 9:16 · 15s per story · polls + questions welcome",
  },
  {
    id: "lemon8",
    label: "Lemon8",
    handleLabel: "lemon8",
    aspect: "3-4",
    maxSlideSeconds: 30,
    maxWords: 80,
    safeZoneTopPct: 8,
    safeZoneBottomPct: 14,
    supportsPolls: false,
    supportsQuestions: false,
    hint: "Long-form vertical · magazine cadence · captions matter",
  },
  {
    id: "tiktok",
    label: "TikTok Slides",
    handleLabel: "@handle",
    aspect: "9-16",
    maxSlideSeconds: 8,
    maxWords: 40,
    safeZoneTopPct: 10,
    safeZoneBottomPct: 22,
    supportsPolls: false,
    supportsQuestions: false,
    hint: "Rapid punchy vertical · text on-frame is the hook",
  },
  {
    id: "pinterest",
    label: "Pinterest Idea Pins",
    handleLabel: "@handle",
    aspect: "9-16",
    maxSlideSeconds: 20,
    maxWords: 90,
    safeZoneTopPct: 10,
    safeZoneBottomPct: 16,
    supportsPolls: false,
    supportsQuestions: false,
    hint: "Aesthetic-first · aspirational · keyword-rich body",
  },
  {
    id: "facebook",
    label: "Facebook Stories",
    handleLabel: "You",
    aspect: "9-16",
    maxSlideSeconds: 15,
    maxWords: 80,
    safeZoneTopPct: 12,
    safeZoneBottomPct: 20,
    supportsPolls: true,
    supportsQuestions: false,
    hint: "Familiar audience · lighter register works",
  },
  {
    id: "threads",
    label: "Threads",
    handleLabel: "@handle",
    aspect: "4-5",
    maxSlideSeconds: 12,
    maxWords: 45,
    safeZoneTopPct: 8,
    safeZoneBottomPct: 14,
    supportsPolls: false,
    supportsQuestions: false,
    hint: "Text-first · earn attention with the first line",
  },
];

const INDEX: Record<StoryPlatformId, StoryPlatformSpec> = STORY_PLATFORMS.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<StoryPlatformId, StoryPlatformSpec>,
);

export function platformSpec(id: StoryPlatformId): StoryPlatformSpec {
  return INDEX[id];
}
