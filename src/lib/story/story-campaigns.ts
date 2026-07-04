/**
 * Story Campaign engine — Campaign > Sequence > Story > Slide > Asset >
 * Publishing > Analytics hierarchy. Adding a template requires only a new
 * entry in CAMPAIGN_TEMPLATES.
 */

import { emptySlide, type RichSlide } from "./story-slides";
import type { StoryPlatformId } from "./story-platforms";

// ─── Types ────────────────────────────────────────────────────────────────

export type StoryEntry = {
  id: string;
  name: string;
  /** Optional link back to a StoryConcept (legacy generated story) */
  conceptId?: string;
  slides: RichSlide[];
  createdAt: number;
  updatedAt: number;
};

export type StorySequence = {
  id: string;
  label: string;
  hint: string;
  /** Story ids inside this sequence, in order */
  storyIds: string[];
};

export type StoryCampaign = {
  id: string;
  name: string;
  templateId: string;
  goal: string;
  platforms: StoryPlatformId[];
  sequences: StorySequence[];
  createdAt: number;
  updatedAt: number;
  /** Optional project scope */
  projectId?: string;
};

// ─── Templates ────────────────────────────────────────────────────────────

export type CampaignTemplate = {
  id: string;
  name: string;
  goal: string;
  hint: string;
  platforms: StoryPlatformId[];
  sequences: Array<{
    label: string;
    hint: string;
    /** Story blueprints inside this sequence */
    stories: Array<{
      name: string;
      slides: number;
    }>;
  }>;
};

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: "product-launch",
    name: "Product launch",
    goal: "Introduce a product with hype → reveal → conversion",
    hint: "Full launch flow: teaser week → reveal → CTA push",
    platforms: ["instagram", "tiktok", "pinterest"],
    sequences: [
      { label: "Teaser", hint: "Hint at what's coming", stories: [{ name: "Ambient tease", slides: 5 }] },
      { label: "Reveal", hint: "Product debut", stories: [{ name: "Hero reveal", slides: 7 }] },
      { label: "Conversion", hint: "Direct CTA", stories: [{ name: "Final CTA", slides: 4 }] },
    ],
  },
  {
    id: "affiliate",
    name: "Affiliate",
    goal: "Drive conversions on a partner offer",
    hint: "Social proof → benefit → click",
    platforms: ["instagram", "pinterest"],
    sequences: [
      { label: "Social proof", hint: "Testimonial-forward", stories: [{ name: "Real results", slides: 6 }] },
      { label: "Benefit", hint: "Feature deep-dive", stories: [{ name: "Why it works", slides: 5 }] },
      { label: "CTA", hint: "Direct link", stories: [{ name: "Link in bio", slides: 3 }] },
    ],
  },
  {
    id: "ugc",
    name: "UGC",
    goal: "Turn creator content into a repeatable campaign",
    hint: "Handheld / candid / authentic",
    platforms: ["tiktok", "instagram"],
    sequences: [
      { label: "Unboxing", hint: "First impressions", stories: [{ name: "Unbox", slides: 5 }] },
      { label: "In use", hint: "Everyday moments", stories: [{ name: "Everyday", slides: 5 }] },
      { label: "Review", hint: "Verdict", stories: [{ name: "Verdict", slides: 4 }] },
    ],
  },
  {
    id: "evergreen",
    name: "Evergreen",
    goal: "Recurring content that keeps ranking",
    hint: "Educational, saveable, repeatable",
    platforms: ["pinterest", "instagram"],
    sequences: [
      { label: "Series", hint: "3 recurring stories", stories: [
        { name: "Part 1", slides: 5 },
        { name: "Part 2", slides: 5 },
        { name: "Part 3", slides: 5 },
      ] },
    ],
  },
  {
    id: "educational",
    name: "Educational",
    goal: "Teach a topic in one sitting",
    hint: "Ladder complexity across a mini course",
    platforms: ["instagram", "pinterest"],
    sequences: [
      { label: "Ladder", hint: "Beginner → advanced", stories: [
        { name: "Beginner", slides: 6 },
        { name: "Intermediate", slides: 6 },
        { name: "Advanced", slides: 6 },
      ] },
    ],
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    goal: "Show the world you want to invite them into",
    hint: "Day-in-the-life cadence over a week",
    platforms: ["instagram", "lemon8"],
    sequences: [
      { label: "Weekday", hint: "Grounded routines", stories: [{ name: "Weekday morning", slides: 5 }] },
      { label: "Weekend", hint: "Aspirational", stories: [{ name: "Slow weekend", slides: 5 }] },
    ],
  },
  {
    id: "brand-story",
    name: "Brand story",
    goal: "Introduce or reintroduce the brand",
    hint: "Origin → values → invitation",
    platforms: ["instagram", "threads"],
    sequences: [
      { label: "Origin", hint: "How it began", stories: [{ name: "Origin", slides: 5 }] },
      { label: "Values", hint: "What we believe", stories: [{ name: "Values", slides: 5 }] },
      { label: "Invitation", hint: "Join us", stories: [{ name: "Invite", slides: 3 }] },
    ],
  },
  {
    id: "bts",
    name: "Behind the scenes",
    goal: "Show the human behind the brand",
    hint: "Rough edges beat polish",
    platforms: ["instagram", "tiktok"],
    sequences: [
      { label: "Studio", hint: "Where the work happens", stories: [{ name: "Studio tour", slides: 6 }] },
      { label: "Process", hint: "How it's made", stories: [{ name: "Craft", slides: 6 }] },
    ],
  },
  {
    id: "sale",
    name: "Sale",
    goal: "Move product with a time-boxed offer",
    hint: "Teaser → live → last-call",
    platforms: ["instagram", "facebook"],
    sequences: [
      { label: "Teaser", hint: "Curiosity gap", stories: [{ name: "Something's coming", slides: 4 }] },
      { label: "Live", hint: "Full pitch", stories: [{ name: "It's live", slides: 6 }] },
      { label: "Last call", hint: "Urgency", stories: [{ name: "Last call", slides: 3 }] },
    ],
  },
  {
    id: "black-friday",
    name: "Black Friday",
    goal: "Concentrated sale pressure",
    hint: "Compressed launch cadence with urgency",
    platforms: ["instagram", "tiktok", "facebook"],
    sequences: [
      { label: "Preview", hint: "Insider access", stories: [{ name: "Preview", slides: 4 }] },
      { label: "Launch", hint: "It's live", stories: [{ name: "Launch day", slides: 6 }] },
      { label: "Countdown", hint: "48 hours left", stories: [{ name: "48h", slides: 4 }, { name: "24h", slides: 4 }] },
      { label: "Final", hint: "Last 6 hours", stories: [{ name: "Final hours", slides: 3 }] },
    ],
  },
  {
    id: "holiday",
    name: "Holiday",
    goal: "Warm seasonal moment",
    hint: "Gifting + celebrating",
    platforms: ["instagram", "pinterest"],
    sequences: [
      { label: "Warm-up", hint: "Feel the season", stories: [{ name: "Feels", slides: 5 }] },
      { label: "Gift guide", hint: "Curation", stories: [{ name: "Gift guide", slides: 8 }] },
      { label: "Send-off", hint: "Thank you", stories: [{ name: "Thank you", slides: 3 }] },
    ],
  },
  {
    id: "course-launch",
    name: "Course launch",
    goal: "Convert an audience into a cohort",
    hint: "Pre-launch runway + cart open",
    platforms: ["instagram", "threads"],
    sequences: [
      { label: "Pre-launch", hint: "Build the case", stories: [
        { name: "The problem", slides: 5 },
        { name: "The way in", slides: 5 },
      ] },
      { label: "Cart open", hint: "Invite in", stories: [{ name: "Cart open", slides: 6 }] },
      { label: "Cart close", hint: "Last hours", stories: [{ name: "Cart close", slides: 4 }] },
    ],
  },
  {
    id: "service-launch",
    name: "Service launch",
    goal: "Introduce a done-for-you service",
    hint: "Credibility → outcomes → intake",
    platforms: ["instagram", "threads"],
    sequences: [
      { label: "Credibility", hint: "Who we are", stories: [{ name: "Credibility", slides: 5 }] },
      { label: "Outcomes", hint: "What clients get", stories: [{ name: "Outcomes", slides: 6 }] },
      { label: "Intake", hint: "How to start", stories: [{ name: "Intake", slides: 4 }] },
    ],
  },
  {
    id: "personal-brand",
    name: "Personal brand",
    goal: "Grow your presence as a person",
    hint: "Voice-driven, character-first",
    platforms: ["threads", "instagram"],
    sequences: [
      { label: "Identity", hint: "Who you are", stories: [{ name: "Identity", slides: 5 }] },
      { label: "Value", hint: "What you know", stories: [{ name: "Value", slides: 6 }] },
      { label: "Connection", hint: "Where to go next", stories: [{ name: "Connect", slides: 3 }] },
    ],
  },
];

const TEMPLATE_INDEX: Record<string, CampaignTemplate> = CAMPAIGN_TEMPLATES.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<string, CampaignTemplate>,
);

export function campaignTemplate(id: string): CampaignTemplate | undefined {
  return TEMPLATE_INDEX[id];
}

// ─── Builders ─────────────────────────────────────────────────────────────

export type BuildCampaignOptions = {
  campaignId: string;
  templateId: string;
  name?: string;
  now?: number;
  projectId?: string;
  makeStoryId?: (sequenceIndex: number, storyIndex: number) => string;
  makeSlideId?: (storyIndex: number, slideIndex: number) => string;
};

export type BuildResult = {
  campaign: StoryCampaign;
  stories: StoryEntry[];
};

export function buildCampaign(opts: BuildCampaignOptions): BuildResult {
  const tpl = campaignTemplate(opts.templateId);
  if (!tpl) throw new Error(`Unknown template: ${opts.templateId}`);
  const now = opts.now ?? Date.now();
  const stories: StoryEntry[] = [];
  let storyCounter = 0;
  const sequences: StorySequence[] = tpl.sequences.map((seq, si) => {
    const storyIds: string[] = [];
    for (let i = 0; i < seq.stories.length; i++) {
      const blueprint = seq.stories[i]!;
      const storyId = opts.makeStoryId
        ? opts.makeStoryId(si, i)
        : `${opts.campaignId}-story-${storyCounter}`;
      const slides: RichSlide[] = [];
      for (let j = 0; j < blueprint.slides; j++) {
        const slideId = opts.makeSlideId
          ? opts.makeSlideId(storyCounter, j)
          : `${storyId}-slide-${j}`;
        const slide: RichSlide = {
          ...emptySlide(slideId, j, now),
          title: j === 0 ? `${blueprint.name} · hook` : "",
          goal: j === 0 ? "hook" : j === blueprint.slides - 1 ? "cta" : "context",
        };
        slides.push(slide);
      }
      const entry: StoryEntry = {
        id: storyId,
        name: blueprint.name,
        slides,
        createdAt: now,
        updatedAt: now,
      };
      stories.push(entry);
      storyIds.push(storyId);
      storyCounter += 1;
    }
    return {
      id: `${opts.campaignId}-seq-${si}`,
      label: seq.label,
      hint: seq.hint,
      storyIds,
    };
  });
  const campaign: StoryCampaign = {
    id: opts.campaignId,
    name: opts.name ?? tpl.name,
    templateId: tpl.id,
    goal: tpl.goal,
    platforms: tpl.platforms,
    sequences,
    createdAt: now,
    updatedAt: now,
    projectId: opts.projectId,
  };
  return { campaign, stories };
}

// ─── Read helpers ─────────────────────────────────────────────────────────

export function storyIdsFor(campaign: StoryCampaign): string[] {
  return campaign.sequences.flatMap((s) => s.storyIds);
}

export function totalStories(campaign: StoryCampaign): number {
  return storyIdsFor(campaign).length;
}

export function findSequence(
  campaign: StoryCampaign,
  storyId: string,
): StorySequence | undefined {
  return campaign.sequences.find((s) => s.storyIds.includes(storyId));
}
