"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import { AIDock, AIDockTrigger } from "@/components/ai/ai-dock";

/** Event contract for opening the AI Dock from anywhere in the tree. */
export type OpenDockDetail = { prefill?: string; autoSend?: boolean };

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [dockPrefill, setDockPrefill] = useState<string | undefined>();
  const [dockAutoSend, setDockAutoSend] = useState(false);
  const pathname = usePathname();

  // Hide the floating AI trigger on the assistant route itself — it would
  // duplicate the full-page assistant surface.
  const showDockTrigger = !pathname.startsWith("/assistant");

  // Global keyboard shortcuts: ⌘K palette, ⌘J AI dock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (key === "j") {
        e.preventDefault();
        setDockOpen((v) => !v);
        setDockPrefill(undefined);
        setDockAutoSend(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // External open-dock bridge — any component can dispatch this event with
  // an optional prefill + autoSend flag to seed the dock's composer.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<OpenDockDetail>).detail ?? {};
      setDockPrefill(detail.prefill);
      setDockAutoSend(Boolean(detail.autoSend));
      setDockOpen(true);
    };
    window.addEventListener("vv:open-dock", handler);
    return () => window.removeEventListener("vv:open-dock", handler);
  }, []);

  const openPalette = useCallback(() => setPaletteOpen(true), []);

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar mobileOpen={mobileNav} onClose={() => setMobileNav(false)} />

      <div className="lg:pl-[264px]">
        <Topbar
          onMenu={() => setMobileNav(true)}
          onSearch={openPalette}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1180px] px-5 py-8 md:px-8 focus:outline-none"
        >
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <WelcomeModal />
      {showDockTrigger && !dockOpen && (
        <AIDockTrigger onClick={() => setDockOpen(true)} />
      )}
      <AIDock
        open={dockOpen}
        onOpenChange={(next) => {
          setDockOpen(next);
          if (!next) {
            setDockPrefill(undefined);
            setDockAutoSend(false);
          }
        }}
        prefill={dockPrefill}
        autoSend={dockAutoSend}
        onPrefillConsumed={() => {
          setDockPrefill(undefined);
          setDockAutoSend(false);
        }}
      />
    </div>
  );
}

/** Sugar for external callers — dispatches the custom event that AppShell listens for. */
export function openAIDock(detail: OpenDockDetail = {}): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("vv:open-dock", { detail }));
}
