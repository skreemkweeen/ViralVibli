import type {
  Project,
  ActivityItem,
  CreatorProfile,
} from "./types";

/**
 * Realistic demo workspace. Populates the store so a first-time visitor sees
 * the platform as it will look after weeks of real use — projects mid-flight,
 * activity trail, brand profile, plus a small library of vault prompts.
 *
 * Timestamps are relative to `now` at seed time so the "N min ago" strip on
 * the dashboard renders naturally.
 */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export type DemoVaultPrompt = {
  id: string;
  title: string;
  content: string;
  category:
    | "image-gen"
    | "social"
    | "copywriting"
    | "video"
    | "research"
    | "analysis"
    | "code"
    | "creative";
  platform?: "instagram" | "tiktok" | "youtube" | "linkedin" | "twitter" | "pinterest";
  favorite: boolean;
  pinned: boolean;
  usageCount: number;
  createdAt: number;
  updatedAt: number;
  versions: unknown[];
};

export type DemoWorkspace = {
  profile: CreatorProfile;
  projects: Project[];
  activity: ActivityItem[];
  vaultPrompts: DemoVaultPrompt[];
};

export function buildDemoWorkspace(): DemoWorkspace {
  const now = Date.now();

  const profile: CreatorProfile = {
    brand: "Marrow Studio",
    tagline: "Slow content for makers and creators",
    voice: "warm, editorial, considered",
    primaryPlatform: "Instagram",
    preferredStyle: "editorial",
    contentGoals: ["build-audience", "launch-product", "brand-consistency"],
  };

  const projects: Project[] = [
    {
      id: "demo-proj-launch",
      name: "Autumn Ceramic Collection",
      description: "Product launch across Instagram + email over 10 days",
      color: "orange",
      items: [
        {
          type: "story",
          id: "demo-story-1",
          title: "5-slide launch teaser sequence",
        },
        {
          type: "vision",
          id: "demo-vision-1",
          title: "Hero shot — morning light, single vessel",
        },
        {
          type: "prompt",
          id: "demo-prompt-launch-caption",
          title: "Launch caption — Instagram main grid",
        },
        {
          type: "conversation",
          id: "demo-conv-1",
          title: "Caption variations & tone check",
        },
      ],
      createdAt: now - 6 * DAY,
      updatedAt: now - 42 * MIN,
    },
    {
      id: "demo-proj-content-week",
      name: "Content Week 24",
      description: "Weekly plan: 3 posts, 1 reel, 2 stories",
      color: "lime",
      items: [
        {
          type: "prompt",
          id: "demo-prompt-hook",
          title: "Reel hook — first-line stopper",
        },
        {
          type: "story",
          id: "demo-story-2",
          title: "Behind-the-scenes carousel",
        },
      ],
      createdAt: now - 3 * DAY,
      updatedAt: now - 3 * HOUR,
    },
    {
      id: "demo-proj-brand-refresh",
      name: "Brand voice refresh",
      description: "Rewriting bio + About page copy for the new season",
      color: "blue",
      items: [
        {
          type: "prompt",
          id: "demo-prompt-bio",
          title: "Instagram bio — 5 versions",
        },
      ],
      createdAt: now - 12 * DAY,
      updatedAt: now - 2 * DAY,
    },
  ];

  const activity: ActivityItem[] = [
    {
      id: "demo-act-1",
      type: "chat-sent",
      title: "Refine the launch caption a bit warmer",
      moduleId: "assistant",
      href: "/assistant",
      createdAt: now - 12 * MIN,
    },
    {
      id: "demo-act-2",
      type: "vision-generated",
      title: "Hero shot — morning light, single vessel",
      moduleId: "vision",
      href: "/vision",
      createdAt: now - 42 * MIN,
    },
    {
      id: "demo-act-3",
      type: "story-generated",
      title: "5-slide launch teaser sequence",
      moduleId: "story",
      href: "/story",
      createdAt: now - 3 * HOUR,
    },
    {
      id: "demo-act-4",
      type: "prompt-saved",
      title: "Reel hook — first-line stopper",
      moduleId: "vault",
      href: "/vault",
      createdAt: now - 1 * DAY,
    },
    {
      id: "demo-act-5",
      type: "project-created",
      title: 'Created "Content Week 24"',
      moduleId: "workspace",
      href: "/projects",
      createdAt: now - 3 * DAY,
    },
  ];

  const vaultPrompts: DemoVaultPrompt[] = [
    {
      id: "demo-prompt-launch-caption",
      title: "Launch caption — Instagram main grid",
      content:
        "Write a launch caption for {product}. Open with the reason it exists, not the specs. Second line pays off the promise with one specific detail. Close with a soft CTA that invites the reader to save the post.",
      category: "social",
      platform: "instagram",
      favorite: true,
      pinned: true,
      usageCount: 12,
      createdAt: now - 20 * DAY,
      updatedAt: now - 42 * MIN,
      versions: [],
    },
    {
      id: "demo-prompt-hook",
      title: "Reel hook — first-line stopper",
      content:
        "Give me five Reel hooks for {topic}. Each hook is under 8 words, contains a small tension, and would make a scrolling viewer stop for one full second.",
      category: "social",
      platform: "instagram",
      favorite: true,
      pinned: false,
      usageCount: 34,
      createdAt: now - 44 * DAY,
      updatedAt: now - 6 * HOUR,
      versions: [],
    },
    {
      id: "demo-prompt-bio",
      title: "Instagram bio — 5 versions",
      content:
        "Write five versions of an Instagram bio for {brand}. Each version is a different tone: warm & editorial, playful & direct, technical & confident, spare & minimal, poetic & atmospheric. Cap at 140 characters each.",
      category: "copywriting",
      platform: "instagram",
      favorite: false,
      pinned: true,
      usageCount: 6,
      createdAt: now - 50 * DAY,
      updatedAt: now - 2 * DAY,
      versions: [],
    },
    {
      id: "demo-prompt-cinematic",
      title: "Cinematic product shot — 35mm",
      content:
        "Cinematic close-up of {subject}, morning light raking across the surface texture, warm film grain, shallow depth of field, f/1.8, shot on 35mm, mood of quiet craft, neutral off-white background.",
      category: "image-gen",
      favorite: true,
      pinned: false,
      usageCount: 22,
      createdAt: now - 30 * DAY,
      updatedAt: now - 5 * DAY,
      versions: [],
    },
    {
      id: "demo-prompt-weekly-plan",
      title: "Weekly content plan skeleton",
      content:
        "Plan a week of content for {brand} on {platform}. Three posts, one reel, two stories. For each: format, hook, angle, and a first-draft caption in the brand voice.",
      category: "creative",
      platform: "instagram",
      favorite: false,
      pinned: false,
      usageCount: 4,
      createdAt: now - 15 * DAY,
      updatedAt: now - 3 * DAY,
      versions: [],
    },
    {
      id: "demo-prompt-competitor",
      title: "Competitor teardown",
      content:
        "Analyse the last 30 posts from {@handle} on {platform}. Identify their best-performing hooks, their content pillars, the visual style they lean on, and one thing we could learn without imitating.",
      category: "analysis",
      favorite: false,
      pinned: false,
      usageCount: 2,
      createdAt: now - 8 * DAY,
      updatedAt: now - 8 * DAY,
      versions: [],
    },
    {
      id: "demo-prompt-newsletter",
      title: "Weekly newsletter opener",
      content:
        "Draft the opening 100 words of this week's newsletter for {brand}. Start with a specific moment from the last seven days, then earn the reader's attention by promising something concrete below the fold.",
      category: "copywriting",
      favorite: false,
      pinned: false,
      usageCount: 7,
      createdAt: now - 25 * DAY,
      updatedAt: now - 10 * DAY,
      versions: [],
    },
    {
      id: "demo-prompt-behind-scenes",
      title: "Behind-the-scenes carousel outline",
      content:
        "Outline a 6-slide carousel for a behind-the-scenes look at {process}. Slide 1 = hook. Slides 2–5 = the honest middle. Slide 6 = a soft close with an invitation to read the caption.",
      category: "creative",
      platform: "instagram",
      favorite: false,
      pinned: false,
      usageCount: 9,
      createdAt: now - 18 * DAY,
      updatedAt: now - 12 * DAY,
      versions: [],
    },
  ];

  return { profile, projects, activity, vaultPrompts };
}
