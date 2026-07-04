"use client";

import { Sun, Moon, Desktop } from "@phosphor-icons/react";
import { useTheme, type Theme } from "./theme-provider";

const order: Theme[] = ["light", "dark", "system"];
const icons = {
  light: Sun,
  dark: Moon,
  system: Desktop,
} as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = icons[theme];

  function cycle() {
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${theme}. Click to change.`}
      title={`Theme: ${theme}`}
      className="grid size-9 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <Icon className="size-[18px]" />
    </button>
  );
}
