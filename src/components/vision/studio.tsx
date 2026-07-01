"use client";

import { useEffect, useState } from "react";
import {
  SquaresFour,
  Sidebar as SidebarIcon,
  Rows,
  PushPin,
} from "@phosphor-icons/react";
import { VisionProvider } from "@/lib/vision/vision-store";
import { CategoryBar } from "./category-bar";
import { ControlPanel } from "./control-panel";
import { Canvas } from "./canvas";
import { PresetGallery } from "./preset-gallery";
import { PromptComposer } from "./prompt-composer";
import { CampaignPlanner } from "./campaign-planner";
import { MoodboardPanel } from "./moodboard-panel";

export function VisionStudio() {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(true);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [moodboardOpen, setMoodboardOpen] = useState(false);

  useEffect(() => {
    // Command palette handoff: ?moodboard=1 opens the moodboard panel.
    // Read from window.location directly to avoid a Suspense boundary in a
    // client-only leaf.
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("moodboard") === "1") setMoodboardOpen(true);
    } catch {
      // no-op
    }
  }, []);

  return (
    <VisionProvider>
      <div className="flex flex-col lg:h-[calc(100dvh-8rem)]">
        {/* header */}
        <header className="mb-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-[clamp(1.6rem,4vw,2.2rem)] font-semibold tracking-[-0.03em]">
                Vision Studio
              </h1>
              <p className="mt-1.5 text-[15px] text-muted">
                Direct the shot. Compose a professional brief, then generate
                concepts.
              </p>
            </div>
            <div className="hidden shrink-0 gap-2 sm:flex">
              <button
                type="button"
                onClick={() => setComposerOpen((v) => !v)}
                aria-pressed={composerOpen}
                aria-label={
                  composerOpen ? "Hide prompt composer" : "Show prompt composer"
                }
                className="hidden cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:border-faint active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 xl:inline-flex"
              >
                <SidebarIcon className="size-4 text-accent-fg" weight={composerOpen ? "fill" : "regular"} />
                Composer
              </button>
              <button
                type="button"
                onClick={() => setMoodboardOpen(true)}
                aria-label="Open moodboard"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:border-faint active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <PushPin className="size-4 text-accent-fg" weight="fill" />
                Moodboard
              </button>
              <button
                type="button"
                onClick={() => setCampaignOpen(true)}
                aria-label="Plan a 6-shot campaign"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:border-faint active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <Rows className="size-4 text-accent-fg" />
                Plan campaign
              </button>
              <button
                type="button"
                onClick={() => setPresetsOpen(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:border-faint active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <SquaresFour className="size-4 text-accent-fg" />
                Browse presets
              </button>
            </div>
          </div>
          <div className="mt-5">
            <CategoryBar />
          </div>
        </header>

        {/* Three-pane workspace: Controls | Canvas | Composer.
            Composer collapses to a hidden state below xl; on xl+ it's a
            360px right inspector. */}
        <div
          className={`grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[360px_1fr] ${
            composerOpen ? "xl:grid-cols-[340px_minmax(0,1fr)_360px]" : "xl:grid-cols-[360px_1fr]"
          }`}
        >
          <div className="overflow-hidden rounded-2xl border border-line bg-surface lg:h-full">
            <ControlPanel />
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface lg:h-full">
            <Canvas onBrowsePresets={() => setPresetsOpen(true)} />
          </div>
          {composerOpen && (
            <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface xl:block xl:h-full">
              <PromptComposer />
            </div>
          )}
        </div>
      </div>

      <PresetGallery open={presetsOpen} onClose={() => setPresetsOpen(false)} />
      <CampaignPlanner open={campaignOpen} onClose={() => setCampaignOpen(false)} />
      <MoodboardPanel open={moodboardOpen} onClose={() => setMoodboardOpen(false)} />
    </VisionProvider>
  );
}
