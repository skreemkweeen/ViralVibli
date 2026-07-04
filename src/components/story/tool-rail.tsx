"use client";

/**
 * Story Studio tool rail — left column of the professional workspace.
 * Groups every tool by purpose (Direction / Production / Delivery),
 * so the header stays clean and the studio still exposes every
 * capability.
 */

import type { Icon } from "@phosphor-icons/react";
import {
  Books,
  Brain,
  ChartLineUp,
  ClockClockwise,
  FilmSlate,
  GitBranch,
  Kanban,
  Microphone,
  Notebook,
  PaperPlaneTilt,
  Sparkle,
  Waveform,
} from "@phosphor-icons/react";

export type StoryToolId =
  | "campaigns"
  | "frameworks"
  | "brief"
  | "assets"
  | "director"
  | "shots"
  | "voiceover"
  | "narrative"
  | "versions"
  | "analytics"
  | "publishing"
  | "intelligence";

type ToolEntry = {
  id: StoryToolId;
  label: string;
  icon: Icon;
  group: "direction" | "production" | "delivery";
};

const TOOLS: ToolEntry[] = [
  { id: "brief", label: "Brief", icon: Notebook, group: "direction" },
  { id: "campaigns", label: "Campaigns", icon: Sparkle, group: "direction" },
  { id: "frameworks", label: "Frameworks", icon: Books, group: "direction" },
  { id: "assets", label: "Assets", icon: FilmSlate, group: "direction" },
  { id: "director", label: "AI Director", icon: Brain, group: "production" },
  { id: "voiceover", label: "Voiceover", icon: Microphone, group: "production" },
  { id: "shots", label: "Story board", icon: Kanban, group: "production" },
  { id: "narrative", label: "Narrative graph", icon: GitBranch, group: "production" },
  { id: "versions", label: "Versions", icon: ClockClockwise, group: "delivery" },
  { id: "analytics", label: "Analytics", icon: ChartLineUp, group: "delivery" },
  { id: "publishing", label: "Publishing", icon: PaperPlaneTilt, group: "delivery" },
  { id: "intelligence", label: "Intelligence", icon: Waveform, group: "delivery" },
];

const GROUP_LABEL: Record<ToolEntry["group"], string> = {
  direction: "Direction",
  production: "Production",
  delivery: "Delivery",
};

export function StoryToolRail({ onOpen }: { onOpen: (id: StoryToolId) => void }) {
  const groups = TOOLS.reduce<Record<ToolEntry["group"], ToolEntry[]>>(
    (acc, tool) => {
      (acc[tool.group] ??= []).push(tool);
      return acc;
    },
    { direction: [], production: [], delivery: [] },
  );
  return (
    <nav aria-label="Story Studio tools" className="grid gap-4 overflow-y-auto p-3">
      {(Object.keys(groups) as ToolEntry["group"][]).map((g) => (
        <div key={g}>
          <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
            {GROUP_LABEL[g]}
          </p>
          <ul className="grid gap-0.5">
            {groups[g].map((t) => (
              <li key={t.id}>
                <ToolButton icon={t.icon} label={t.label} onClick={() => onOpen(t.id)} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: Icon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${label}`}
      title={label}
      className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-[12.5px] text-muted transition-colors hover:border-line hover:bg-bg/60 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <Icon className="size-4 text-accent-fg" weight="fill" />
      <span className="truncate">{label}</span>
    </button>
  );
}
