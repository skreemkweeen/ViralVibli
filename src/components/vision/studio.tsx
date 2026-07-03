"use client";

import { useEffect, useState } from "react";
import {
  SquaresFour,
  Sidebar as SidebarIcon,
  Rows,
  PushPin,
  Notebook,
  Palette,
  Camera as CameraIcon,
  Lightbulb,
  FilmSlate,
  Sparkle,
  GridFour,
  Brain,
  Books,
  Export as ExportIcon,
} from "@phosphor-icons/react";
import { VisionProvider } from "@/lib/vision/vision-store";
import { CategoryBar } from "./category-bar";
import { ControlPanel } from "./control-panel";
import { Canvas } from "./canvas";
import { PresetGallery } from "./preset-gallery";
import { PromptComposer } from "./prompt-composer";
import { CampaignPlanner } from "./campaign-planner";
import { MoodboardPanel } from "./moodboard-panel";
import { BriefPanel } from "./brief-panel";
import { StyleLibraryPanel } from "./style-library-panel";
import { CameraPlannerPanel } from "./camera-planner-panel";
import { LightingDesignerPanel } from "./lighting-designer-panel";
import { ShotListPanel } from "./shot-list-panel";
import { CampaignBuilderPanel } from "./campaign-builder-panel";
import { BatchPanel } from "./batch-panel";
import { PromptIntelligencePanel } from "./prompt-intelligence-panel";
import { ReferenceWallPanel } from "./reference-wall-panel";
import { ExportMemoryPanel } from "./export-memory-panel";

export function VisionStudio() {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(true);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [moodboardOpen, setMoodboardOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [stylesOpen, setStylesOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [lightingOpen, setLightingOpen] = useState(false);
  const [shotsOpen, setShotsOpen] = useState(false);
  const [campaignBuilderOpen, setCampaignBuilderOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [intelligenceOpen, setIntelligenceOpen] = useState(false);
  const [refWallOpen, setRefWallOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

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
                onClick={() => setBriefOpen(true)}
                aria-label="Open Creative Brief"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:border-faint active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <Notebook className="size-4 text-accent-fg" weight="fill" />
                Brief
              </button>
              <button
                type="button"
                onClick={() => setStylesOpen(true)}
                aria-label="Open Style Library"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:border-faint active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <Palette className="size-4 text-accent-fg" weight="fill" />
                Styles
              </button>
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                aria-label="Open Camera Planner"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:border-faint active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <CameraIcon className="size-4 text-accent-fg" weight="fill" />
                Camera
              </button>
              <button
                type="button"
                onClick={() => setLightingOpen(true)}
                aria-label="Open Lighting Designer"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:border-faint active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <Lightbulb className="size-4 text-accent-fg" weight="fill" />
                Lighting
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
                onClick={() => setShotsOpen(true)}
                aria-label="Open Shot List"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:border-faint active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <FilmSlate className="size-4 text-accent-fg" weight="fill" />
                Shots
              </button>
              <button
                type="button"
                onClick={() => setCampaignBuilderOpen(true)}
                aria-label="Open Campaign Builder"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:border-faint active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <Sparkle className="size-4 text-accent-fg" weight="fill" />
                Campaign
              </button>
              <button
                type="button"
                onClick={() => setBatchOpen(true)}
                aria-label="Open Batch Generator"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:border-faint active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <GridFour className="size-4 text-accent-fg" weight="fill" />
                Batch
              </button>
              <button
                type="button"
                onClick={() => setIntelligenceOpen(true)}
                aria-label="Open Prompt Intelligence"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:border-faint active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <Brain className="size-4 text-accent-fg" weight="fill" />
                Intelligence
              </button>
              <button
                type="button"
                onClick={() => setRefWallOpen(true)}
                aria-label="Open Reference Wall"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:border-faint active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <Books className="size-4 text-accent-fg" weight="fill" />
                Refs
              </button>
              <button
                type="button"
                onClick={() => setExportOpen(true)}
                aria-label="Open Export and Memory"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:border-faint active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <ExportIcon className="size-4 text-accent-fg" weight="fill" />
                Export
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
      <BriefPanel open={briefOpen} onClose={() => setBriefOpen(false)} />
      <StyleLibraryPanel open={stylesOpen} onClose={() => setStylesOpen(false)} />
      <CameraPlannerPanel open={cameraOpen} onClose={() => setCameraOpen(false)} />
      <LightingDesignerPanel open={lightingOpen} onClose={() => setLightingOpen(false)} />
      <ShotListPanel open={shotsOpen} onClose={() => setShotsOpen(false)} />
      <CampaignBuilderPanel
        open={campaignBuilderOpen}
        onClose={() => setCampaignBuilderOpen(false)}
      />
      <BatchPanel open={batchOpen} onClose={() => setBatchOpen(false)} />
      <PromptIntelligencePanel
        open={intelligenceOpen}
        onClose={() => setIntelligenceOpen(false)}
      />
      <ReferenceWallPanel
        open={refWallOpen}
        onClose={() => setRefWallOpen(false)}
      />
      <ExportMemoryPanel
        open={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </VisionProvider>
  );
}
