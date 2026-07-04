"use client";

/**
 * Tool Rail — the left column of the professional Vision Studio layout.
 *
 * Every button opens one of the tool panels. Icon-first so the rail
 * stays tight; a tooltip label + aria-label carry the meaning. Groups
 * the buttons into three columns of purpose: creative direction (Brief,
 * Styles, Refs), production (Camera, Lighting, Shots, Campaign, Batch),
 * and intelligence + delivery (Intelligence, Export).
 */

import type { Icon } from "@phosphor-icons/react";
import {
  Notebook,
  Palette,
  Books,
  Camera as CameraIcon,
  Lightbulb,
  FilmSlate,
  Sparkle,
  GridFour,
  Brain,
  Export,
  PushPin,
  SquaresFour,
} from "@phosphor-icons/react";

export type ToolId =
  | "brief"
  | "styles"
  | "refs"
  | "camera"
  | "lighting"
  | "shots"
  | "campaign"
  | "batch"
  | "intelligence"
  | "export"
  | "moodboard"
  | "presets";

type ToolEntry = {
  id: ToolId;
  label: string;
  icon: Icon;
  group: "direction" | "production" | "delivery";
};

const TOOLS: ToolEntry[] = [
  { id: "brief", label: "Brief", icon: Notebook, group: "direction" },
  { id: "styles", label: "Styles", icon: Palette, group: "direction" },
  { id: "refs", label: "References", icon: Books, group: "direction" },
  { id: "moodboard", label: "Moodboard", icon: PushPin, group: "direction" },
  { id: "camera", label: "Camera", icon: CameraIcon, group: "production" },
  { id: "lighting", label: "Lighting", icon: Lightbulb, group: "production" },
  { id: "shots", label: "Shot list", icon: FilmSlate, group: "production" },
  { id: "campaign", label: "Campaign", icon: Sparkle, group: "production" },
  { id: "batch", label: "Batch", icon: GridFour, group: "production" },
  { id: "intelligence", label: "Intelligence", icon: Brain, group: "delivery" },
  { id: "export", label: "Export & memory", icon: Export, group: "delivery" },
  { id: "presets", label: "Presets", icon: SquaresFour, group: "delivery" },
];

const GROUP_LABEL: Record<ToolEntry["group"], string> = {
  direction: "Direction",
  production: "Production",
  delivery: "Delivery",
};

export function ToolRail({ onOpen }: { onOpen: (id: ToolId) => void }) {
  const groups = TOOLS.reduce<Record<ToolEntry["group"], ToolEntry[]>>(
    (acc, tool) => {
      (acc[tool.group] ??= []).push(tool);
      return acc;
    },
    { direction: [], production: [], delivery: [] },
  );
  return (
    <nav
      aria-label="Vision Studio tools"
      className="grid gap-4 overflow-y-auto p-3"
    >
      {(Object.keys(groups) as ToolEntry["group"][]).map((g) => (
        <div key={g}>
          <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-faint">
            {GROUP_LABEL[g]}
          </p>
          <ul className="grid gap-0.5">
            {groups[g].map((t) => (
              <li key={t.id}>
                <ToolButton
                  icon={t.icon}
                  label={t.label}
                  onClick={() => onOpen(t.id)}
                />
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
      className="group flex w-full cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-[12.5px] text-muted transition-colors hover:border-line hover:bg-bg/60 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <Icon className="size-4 text-accent-fg" weight="fill" />
      <span className="truncate">{label}</span>
    </button>
  );
}
