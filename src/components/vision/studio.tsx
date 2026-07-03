"use client";

import { useEffect, useState } from "react";
import { Sidebar as SidebarIcon } from "@phosphor-icons/react";
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
import { ToolRail, type ToolId } from "./tool-rail";
import { InspectorRail } from "./inspector-rail";

export function VisionStudio() {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
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
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("moodboard") === "1") setMoodboardOpen(true);
    } catch {
      // no-op
    }
  }, []);

  const openTool = (id: ToolId) => {
    switch (id) {
      case "brief":
        return setBriefOpen(true);
      case "styles":
        return setStylesOpen(true);
      case "refs":
        return setRefWallOpen(true);
      case "moodboard":
        return setMoodboardOpen(true);
      case "camera":
        return setCameraOpen(true);
      case "lighting":
        return setLightingOpen(true);
      case "shots":
        return setShotsOpen(true);
      case "campaign":
        return setCampaignBuilderOpen(true);
      case "batch":
        return setBatchOpen(true);
      case "intelligence":
        return setIntelligenceOpen(true);
      case "export":
        return setExportOpen(true);
      case "presets":
        return setPresetsOpen(true);
    }
  };

  return (
    <VisionProvider>
      <div className="flex flex-col lg:h-[calc(100dvh-8rem)]">
        {/* Compact header */}
        <header className="mb-4">
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
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => setComposerOpen((v) => !v)}
                aria-pressed={composerOpen}
                aria-label={
                  composerOpen ? "Hide prompt composer" : "Show prompt composer"
                }
                className="hidden cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink transition-colors hover:border-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 xl:inline-flex"
              >
                <SidebarIcon
                  className="size-4 text-accent-fg"
                  weight={composerOpen ? "fill" : "regular"}
                />
                Composer
              </button>
              <button
                type="button"
                onClick={() => setInspectorOpen((v) => !v)}
                aria-pressed={inspectorOpen}
                aria-label={
                  inspectorOpen
                    ? "Hide inspector rail"
                    : "Show inspector rail"
                }
                className="hidden cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink transition-colors hover:border-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 xl:inline-flex"
              >
                <SidebarIcon
                  className="size-4 text-accent-fg"
                  weight={inspectorOpen ? "fill" : "regular"}
                />
                Inspector
              </button>
            </div>
          </div>
          <div className="mt-4">
            <CategoryBar />
          </div>
        </header>

        {/* Professional 4/5-column workspace:
              Tool rail | Controls | Canvas | Composer? | Inspector rail?
            On lg the composer and inspector rails collapse into modals only. */}
        <div
          className={`grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[200px_340px_1fr] ${
            composerOpen && inspectorOpen
              ? "xl:grid-cols-[200px_320px_minmax(0,1fr)_320px_260px]"
              : composerOpen
                ? "xl:grid-cols-[200px_320px_minmax(0,1fr)_340px]"
                : inspectorOpen
                  ? "xl:grid-cols-[200px_340px_minmax(0,1fr)_280px]"
                  : "xl:grid-cols-[200px_340px_1fr]"
          }`}
        >
          {/* Tool rail — always shown on lg+ */}
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface lg:block lg:h-full">
            <ToolRail onOpen={openTool} />
          </div>
          {/* Controls */}
          <div className="overflow-hidden rounded-2xl border border-line bg-surface lg:h-full">
            <ControlPanel />
          </div>
          {/* Canvas */}
          <div className="overflow-hidden rounded-2xl border border-line bg-surface lg:h-full">
            <Canvas onBrowsePresets={() => setPresetsOpen(true)} />
          </div>
          {/* Composer — xl only */}
          {composerOpen && (
            <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface xl:block xl:h-full">
              <PromptComposer />
            </div>
          )}
          {/* Inspector rail — xl only */}
          {inspectorOpen && (
            <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface xl:block xl:h-full">
              <InspectorRail
                onOpen={(id) => {
                  if (id === "intelligence") setIntelligenceOpen(true);
                  else if (id === "shots") setShotsOpen(true);
                  else if (id === "batch") setBatchOpen(true);
                }}
              />
            </div>
          )}
        </div>
      </div>

      <PresetGallery open={presetsOpen} onClose={() => setPresetsOpen(false)} />
      <CampaignPlanner
        open={campaignOpen}
        onClose={() => setCampaignOpen(false)}
      />
      <MoodboardPanel
        open={moodboardOpen}
        onClose={() => setMoodboardOpen(false)}
      />
      <BriefPanel open={briefOpen} onClose={() => setBriefOpen(false)} />
      <StyleLibraryPanel open={stylesOpen} onClose={() => setStylesOpen(false)} />
      <CameraPlannerPanel
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
      />
      <LightingDesignerPanel
        open={lightingOpen}
        onClose={() => setLightingOpen(false)}
      />
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
