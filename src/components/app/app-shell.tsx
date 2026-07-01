"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import { AIDock, AIDockTrigger } from "@/components/ai/ai-dock";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
      <AIDock open={dockOpen} onOpenChange={setDockOpen} />
    </div>
  );
}
