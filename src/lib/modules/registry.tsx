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
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

export type ModuleStatus = "live" | "soon";
export type ModuleGroup = "create" | "grow" | "earn";

export type AppModule = {
  id: string;
  name: string;
  href: string;
  icon: Icon;
  status: ModuleStatus;
  group: ModuleGroup;
  blurb: string;
};

/**
 * The single source of truth for product modules. Sidebar nav, the command
 * palette, the dashboard grid, and routing all read from here, so a new module
 * registers in one place and plugs into the whole workspace with no refactor.
 */
export const appModules: AppModule[] = [
  {
    id: "assistant",
    name: "AI Assistant",
    href: "/assistant",
    icon: Sparkle,
    status: "live",
    group: "create",
    blurb: "Your brand-aware workspace. Draft, plan, and analyze in one thread.",
  },
  {
    id: "story",
    name: "Story Studio",
    href: "/m/story",
    icon: FilmSlate,
    status: "soon",
    group: "create",
    blurb: "Psychology-backed stories, sequences, and replies.",
  },
  {
    id: "caption",
    name: "Caption Studio",
    href: "/m/caption",
    icon: TextAa,
    status: "soon",
    group: "create",
    blurb: "Captions, hooks, and CTAs tuned per platform.",
  },
  {
    id: "carousel",
    name: "Carousel Studio",
    href: "/m/carousel",
    icon: SquaresFour,
    status: "soon",
    group: "create",
    blurb: "Swipeable carousels and step-by-step guides.",
  },
  {
    id: "vision",
    name: "Vision Studio",
    href: "/m/vision",
    icon: Camera,
    status: "soon",
    group: "create",
    blurb: "Direct image generation with real photographic control.",
  },
  {
    id: "ugc",
    name: "UGC Studio",
    href: "/m/ugc",
    icon: VideoCamera,
    status: "soon",
    group: "create",
    blurb: "Scripts, hooks, b-roll, and shot lists.",
  },
  {
    id: "prompts",
    name: "Prompt Vault",
    href: "/m/prompts",
    icon: Vault,
    status: "soon",
    group: "create",
    blurb: "Ten thousand organized prompts, searchable.",
  },
  {
    id: "brand",
    name: "Brand Studio",
    href: "/m/brand",
    icon: PaintBrush,
    status: "soon",
    group: "create",
    blurb: "Logos, palettes, type, and brand voice.",
  },
  {
    id: "trends",
    name: "Trend Lab",
    href: "/m/trends",
    icon: TrendUp,
    status: "soon",
    group: "grow",
    blurb: "Trending hooks, sounds, and formats before they peak.",
  },
  {
    id: "calendar",
    name: "Creator Calendar",
    href: "/m/calendar",
    icon: CalendarBlank,
    status: "soon",
    group: "grow",
    blurb: "Thirty and ninety day plans and reminders.",
  },
  {
    id: "analytics",
    name: "Analytics",
    href: "/m/analytics",
    icon: ChartLineUp,
    status: "soon",
    group: "grow",
    blurb: "Views, saves, and conversions with forecasting.",
  },
  {
    id: "community",
    name: "Community",
    href: "/m/community",
    icon: UsersThree,
    status: "soon",
    group: "grow",
    blurb: "Creator feed, challenges, and collaboration.",
  },
  {
    id: "monetization",
    name: "Monetization Hub",
    href: "/m/monetization",
    icon: Wallet,
    status: "soon",
    group: "earn",
    blurb: "Affiliate links, brand deals, and a revenue dashboard.",
  },
];

export const groupLabels: Record<ModuleGroup, string> = {
  create: "Create",
  grow: "Grow",
  earn: "Earn",
};

export function modulesByGroup(group: ModuleGroup): AppModule[] {
  return appModules.filter((m) => m.group === group);
}

export function getModule(id: string): AppModule | undefined {
  return appModules.find((m) => m.id === id);
}

export type { Icon };
