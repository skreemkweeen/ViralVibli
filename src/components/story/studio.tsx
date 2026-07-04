"use client";

import { useEffect, useState } from "react";
import { Sidebar as SidebarIcon } from "@phosphor-icons/react";
import { StoryProvider, useStory } from "@/lib/story/store";
import { StoryToolRail, type StoryToolId } from "./tool-rail";
import { StoryInspectorRail } from "./inspector-rail";
import { StoryboardCanvas } from "./storyboard-canvas";
import { SlideInspectorPanel } from "./slide-inspector-panel";
import { PhonePreviewPanel } from "./phone-preview-panel";
import { StoryIntelligencePanel } from "./intelligence-panel";
import { CampaignsPanel } from "./campaigns-panel";
import { PublishingPanel } from "./publishing-panel";
import { VersionsPanel } from "./versions-panel";
import { VoiceoverPanel } from "./voiceover-panel";
import { NarrativeGraphPanel } from "./narrative-graph-panel";
import { StoryControls } from "./controls";

export function StoryStudio() {
  return (
    <StoryProvider>
      <StoryStudioInner />
    </StoryProvider>
  );
}

function StoryStudioInner() {
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [briefOpen, setBriefOpen] = useState(false);
  const [campaignsOpen, setCampaignsOpen] = useState(false);
  const [frameworksOpen, setFrameworksOpen] = useState(false);
  const [directorOpen, setDirectorOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [intelligenceOpen, setIntelligenceOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [publishingOpen, setPublishingOpen] = useState(false);
  const [voiceoverOpen, setVoiceoverOpen] = useState(false);
  const [narrativeOpen, setNarrativeOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const { concepts, loadConceptIntoSlides } = useStory();

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const cid = q.get("concept");
      if (cid && concepts.find((c) => c.id === cid)) loadConceptIntoSlides(cid);
    } catch {
      // no-op
    }
  }, [concepts, loadConceptIntoSlides]);

  const openTool = (id: StoryToolId) => {
    switch (id) {
      case "brief":
        return setBriefOpen(true);
      case "campaigns":
        return setCampaignsOpen(true);
      case "frameworks":
        return setFrameworksOpen(true);
      case "assets":
        return setBriefOpen(true); // Reuses the brief drawer for now
      case "director":
        return setDirectorOpen(true);
      case "voiceover":
        return setVoiceoverOpen(true);
      case "shots":
        return; // shots live in the main canvas; scroll to it
      case "narrative":
        return setNarrativeOpen(true);
      case "versions":
        return setVersionsOpen(true);
      case "analytics":
        return setAnalyticsOpen(true);
      case "publishing":
        return setPublishingOpen(true);
      case "intelligence":
        return setIntelligenceOpen(true);
    }
  };

  const onInspectorOpen = (id: "intelligence" | "analytics" | "versions" | "publishing") => {
    switch (id) {
      case "intelligence":
        return setIntelligenceOpen(true);
      case "analytics":
        return setAnalyticsOpen(true);
      case "versions":
        return setVersionsOpen(true);
      case "publishing":
        return setPublishingOpen(true);
    }
  };

  return (
    <>
      <div className="flex flex-col lg:h-[calc(100dvh-8rem)]">
        <header className="mb-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-[clamp(1.6rem,4vw,2.2rem)] font-semibold tracking-[-0.03em]">
                Story Studio
              </h1>
              <p className="mt-1.5 text-[15px] text-muted">
                Plan, write, visualise, and publish complete social campaigns.
              </p>
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => setPhoneOpen(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink transition-colors hover:border-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                Phone preview
              </button>
              <button
                type="button"
                onClick={() => setInspectorOpen((v) => !v)}
                aria-pressed={inspectorOpen}
                aria-label={inspectorOpen ? "Hide inspector rail" : "Show inspector rail"}
                className="hidden cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink transition-colors hover:border-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 xl:inline-flex"
              >
                <SidebarIcon className="size-4 text-accent-fg" weight={inspectorOpen ? "fill" : "regular"} />
                Inspector
              </button>
            </div>
          </div>
        </header>

        <div
          className={`grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[200px_1fr] ${
            inspectorOpen ? "xl:grid-cols-[200px_minmax(0,1fr)_260px]" : "xl:grid-cols-[200px_1fr]"
          }`}
        >
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface lg:block lg:h-full">
            <StoryToolRail onOpen={openTool} />
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface lg:h-full">
            <StoryboardCanvas onOpenSlide={setSelectedSlideId} />
          </div>
          {inspectorOpen && (
            <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface xl:block xl:h-full">
              <StoryInspectorRail onOpen={onInspectorOpen} />
            </div>
          )}
        </div>
      </div>

      {/* Legacy generation controls kept for existing flow, opened as Brief */}
      {briefOpen && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-[6vh]">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Story brief"
            className="relative flex h-[85vh] w-full max-w-[880px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">Brief</p>
                <h2 className="text-[18px] font-semibold text-ink">Story brief</h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  Compose the classic story direction — the AI generator uses this brief.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBriefOpen(false)}
                aria-label="Close"
                className="cursor-pointer rounded-full p-1.5 text-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                ✕
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <StoryControls />
            </div>
          </div>
        </div>
      )}

      <CampaignsPanel open={campaignsOpen} onClose={() => setCampaignsOpen(false)} />
      {/* Frameworks reuses the campaigns modal — its own tab surfaces the 17 frameworks */}
      {frameworksOpen && (
        <CampaignsPanel
          open={frameworksOpen}
          onClose={() => setFrameworksOpen(false)}
        />
      )}
      <StoryIntelligencePanel open={intelligenceOpen} onClose={() => setIntelligenceOpen(false)} />
      <StoryIntelligencePanel open={directorOpen} onClose={() => setDirectorOpen(false)} />
      <StoryIntelligencePanel open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} />
      <VersionsPanel open={versionsOpen} onClose={() => setVersionsOpen(false)} />
      <PublishingPanel open={publishingOpen} onClose={() => setPublishingOpen(false)} />
      <VoiceoverPanel open={voiceoverOpen} onClose={() => setVoiceoverOpen(false)} />
      <NarrativeGraphPanel open={narrativeOpen} onClose={() => setNarrativeOpen(false)} />
      <PhonePreviewPanel open={phoneOpen} onClose={() => setPhoneOpen(false)} />
      <SlideInspectorPanel slideId={selectedSlideId} onClose={() => setSelectedSlideId(null)} />
    </>
  );
}
