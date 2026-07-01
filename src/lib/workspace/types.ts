export type ProjectColor =
  | "lime"
  | "blue"
  | "purple"
  | "orange"
  | "pink"
  | "teal";

export type ProjectItemRef = {
  type: "prompt" | "story" | "vision" | "conversation";
  id: string;
  title: string;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  color: ProjectColor;
  items: ProjectItemRef[];
  createdAt: number;
  updatedAt: number;
};

export type CreatorProfile = {
  brand: string;
  tagline?: string;
  voice: string;
  primaryPlatform?: string;
  preferredStyle?: string;
  contentGoals: string[];
};

export type ActivityType =
  | "project-created"
  | "prompt-saved"
  | "story-generated"
  | "vision-generated"
  | "chat-sent";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  moduleId: string;
  href?: string;
  createdAt: number;
};

export const PROJECT_COLORS: Record<
  ProjectColor,
  { border: string; text: string; dot: string }
> = {
  lime: {
    border: "border-l-accent/60",
    text: "text-accent-fg",
    dot: "bg-accent",
  },
  blue: {
    border: "border-l-blue-400/60",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  purple: {
    border: "border-l-purple-400/60",
    text: "text-purple-400",
    dot: "bg-purple-400",
  },
  orange: {
    border: "border-l-orange-400/60",
    text: "text-orange-400",
    dot: "bg-orange-400",
  },
  pink: {
    border: "border-l-pink-400/60",
    text: "text-pink-400",
    dot: "bg-pink-400",
  },
  teal: {
    border: "border-l-teal-400/60",
    text: "text-teal-400",
    dot: "bg-teal-400",
  },
};

export const PROJECT_COLORS_LIST: ProjectColor[] = [
  "lime",
  "blue",
  "purple",
  "orange",
  "pink",
  "teal",
];

export const DEFAULT_CREATOR_PROFILE: CreatorProfile = {
  brand: "Your Brand",
  voice: "calm, warm",
  contentGoals: [],
};
