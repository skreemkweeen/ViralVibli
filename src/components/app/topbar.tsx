"use client";

import { List, MagnifyingGlass } from "@phosphor-icons/react";
import { Notifications } from "./notifications";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function Topbar({
  onMenu,
  onSearch,
}: {
  onMenu: () => void;
  onSearch: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl md:px-8">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={onMenu}
        className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 lg:hidden"
      >
        <List className="size-5" />
      </button>

      <button
        type="button"
        aria-label="Open command palette (Cmd+K)"
        onClick={onSearch}
        className="flex h-9 flex-1 cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-surface px-3 text-left text-muted transition-colors hover:border-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 md:max-w-sm"
      >
        <MagnifyingGlass className="size-4 shrink-0" />
        <span className="flex-1 truncate text-[14px]">Search or jump to...</span>
        <kbd className="hidden rounded border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-faint sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-1">
        <Notifications />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
