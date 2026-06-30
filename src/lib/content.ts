import {
  Sparkle,
  FilmSlate,
  TextAa,
  SquaresFour,
  Vault,
  Camera,
  VideoCamera,
  TrendUp,
  PaintBrush,
  CalendarBlank,
  ChartLineUp,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

export type Module = {
  name: string;
  blurb: string;
  icon: Icon;
};

/** The thirteen core modules of the creator OS. */
export const modules: Module[] = [
  {
    name: "AI Assistant",
    blurb:
      "A persistent workspace that learns your brand, remembers your tone, and drafts, plans, and analyzes on demand.",
    icon: Sparkle,
  },
  {
    name: "Story Studio",
    blurb:
      "Psychology-backed stories for Instagram, TikTok, and Lemon8. Hooks, sequences, and replies that actually land.",
    icon: FilmSlate,
  },
  {
    name: "Caption Studio",
    blurb:
      "Captions, hooks, and CTAs tuned per platform, from a single idea to a week of posts.",
    icon: TextAa,
  },
  {
    name: "Carousel Studio",
    blurb:
      "Swipeable carousels, comparisons, and step-by-step guides built for saves and shares.",
    icon: SquaresFour,
  },
  {
    name: "Prompt Vault",
    blurb:
      "Ten thousand organized prompts across beauty, fashion, travel, food, and more. Searchable, taggable, yours.",
    icon: Vault,
  },
  {
    name: "Vision Studio",
    blurb:
      "Direct image generation like a photographer: lighting, lens, composition, and camera angle, not guesswork.",
    icon: Camera,
  },
  {
    name: "UGC Studio",
    blurb:
      "Scripts, hooks, b-roll, and shot lists for TikTok Shop, Amazon, and brand collaborations.",
    icon: VideoCamera,
  },
  {
    name: "Trend Lab",
    blurb:
      "Trending hooks, sounds, products, and formats surfaced before they peak, with seasonal windows.",
    icon: TrendUp,
  },
  {
    name: "Brand Studio",
    blurb:
      "Logos, palettes, type, voice, and moodboards. A complete identity kit, generated and editable.",
    icon: PaintBrush,
  },
  {
    name: "Creator Calendar",
    blurb:
      "Thirty and ninety day plans, launches, and reminders that map to your real posting rhythm.",
    icon: CalendarBlank,
  },
  {
    name: "Analytics",
    blurb:
      "Views, saves, followers, and conversions in one view, with growth forecasting you can act on.",
    icon: ChartLineUp,
  },
  {
    name: "Monetization Hub",
    blurb:
      "Affiliate links, brand deals, media kits, and a revenue dashboard with a built-in rate calculator.",
    icon: Wallet,
  },
];

/** Studios surfaced in the horizontal scroll showcase. */
export type Studio = {
  label: string;
  title: string;
  body: string;
  icon: Icon;
  from: string;
  to: string;
};

export const studios: Studio[] = [
  {
    label: "Story Studio",
    title: "Stories that earn the reply",
    body: "Build launch sequences and daily stories on proven psychological frames. The first frame stops the scroll, the last one converts.",
    icon: FilmSlate,
    from: "#1b2a1a",
    to: "#0c0f0b",
  },
  {
    label: "Vision Studio",
    title: "Direct the shot, not the prompt",
    body: "Choose the lens, the light, and the angle. Vision Studio writes the image like a creative director briefs a photographer.",
    icon: Camera,
    from: "#241f12",
    to: "#0e0d0a",
  },
  {
    label: "Trend Lab",
    title: "Catch the wave on the way up",
    body: "Trends are surfaced while they are still climbing, with the format, the sound, and the window to post into.",
    icon: TrendUp,
    from: "#12222a",
    to: "#0a0e10",
  },
  {
    label: "Monetization Hub",
    title: "Turn reach into revenue",
    body: "Track affiliate income, brand deals, and digital products in one place. Know your rate before the call, not after.",
    icon: Wallet,
    from: "#231a26",
    to: "#0d0b0e",
  },
];

export type Tier = {
  name: string;
  price: string;
  cadence: string;
  summary: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

export const tiers: Tier[] = [
  {
    name: "Starter",
    price: "$0",
    cadence: "free, forever",
    summary: "Everything you need to find your voice and post consistently.",
    features: [
      "AI Assistant with brand memory",
      "Caption and Story studios",
      "Prompt Vault, 500 prompts",
      "Calendar for one platform",
    ],
    cta: "Start for free",
  },
  {
    name: "Creator",
    price: "$24",
    cadence: "per month",
    summary: "For creators turning a following into a real, repeatable business.",
    features: [
      "Every studio, unlimited",
      "Full 10,000-prompt Vault",
      "Vision Studio image direction",
      "Trend Lab and forecasting",
      "Monetization Hub and media kits",
    ],
    cta: "Start 14-day trial",
    featured: true,
  },
  {
    name: "Studio",
    price: "$79",
    cadence: "per month",
    summary: "For teams and agencies managing many brands at once.",
    features: [
      "Everything in Creator",
      "Up to 8 brand workspaces",
      "Shared assets and approvals",
      "Priority model access",
    ],
    cta: "Talk to the team",
  },
];

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "I stopped paying for six tools. My whole week now starts and ends inside one workspace, and the AI actually sounds like me.",
    name: "Priya Nadkarni",
    role: "Beauty creator, 412k",
    initials: "PN",
  },
  {
    quote:
      "Trend Lab flagged a format three days before it blew up. That one post did more than my last two months combined.",
    name: "Marcus Adeyemi",
    role: "Fitness and lifestyle, 1.1M",
    initials: "MA",
  },
  {
    quote:
      "The Monetization Hub showed me I was undercharging by half. My next brand deal closed at the number it suggested.",
    name: "Sofia Reinholt",
    role: "Travel creator, 286k",
    initials: "SR",
  },
  {
    quote:
      "Vision Studio gives me editorial-grade shots without a studio day. My feed finally looks like the brand in my head.",
    name: "Devon Castellano",
    role: "Fashion and UGC, 530k",
    initials: "DC",
  },
];

export type Faq = { q: string; a: string };

export const faqs: Faq[] = [
  {
    q: "Does ViralVibli really replace my other tools?",
    a: "For content, planning, and monetization, yes. Writing, image direction, carousels, trends, calendar, analytics, and revenue all live in one workspace, so you stop paying for and switching between half a dozen apps.",
  },
  {
    q: "Will the AI actually sound like me?",
    a: "The AI Assistant builds a memory of your brand, your tone, and your past posts. The more you work inside ViralVibli, the closer its drafts land to your real voice on the first try.",
  },
  {
    q: "Which platforms does it support?",
    a: "Instagram, TikTok, YouTube, Pinterest, Lemon8, Threads, LinkedIn, and Facebook, with formats and best practices tuned for each one rather than copy-pasted across all of them.",
  },
  {
    q: "Can I use it with a team?",
    a: "The Studio plan adds up to eight brand workspaces with shared assets, roles, and approval flows, built for agencies and creators who manage more than one brand.",
  },
  {
    q: "What happens to my data and my content?",
    a: "Your content and brand memory are yours. You can export everything at any time, and we never train shared models on your private workspace.",
  },
];
