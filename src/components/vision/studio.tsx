"use client";

import { useState } from "react";
import { SquaresFour } from "@phosphor-icons/react";
import { VisionProvider } from "@/lib/vision/vision-store";
import { CategoryBar } from "./category-bar";
import { ControlPanel } from "./control-panel";
import { Canvas } from "./canvas";
import { PresetGallery } from "./preset-gallery";

export function VisionStudio() {
  const [presetsOpen, setPresetsOpen] = useState(false);

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
            <button
              type="button"
              onClick={() => setPresetsOpen(true)}
              className="hidden shrink-0 cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:border-faint active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:inline-flex"
            >
              <SquaresFour className="size-4 text-accent-fg" />
              Browse presets
            </button>
          </div>
          <div className="mt-5">
            <CategoryBar />
          </div>
        </header>

        {/* two-pane workspace */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface lg:h-full">
            <ControlPanel />
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface lg:h-full">
            <Canvas onBrowsePresets={() => setPresetsOpen(true)} />
          </div>
        </div>
      </div>

      <PresetGallery open={presetsOpen} onClose={() => setPresetsOpen(false)} />
    </VisionProvider>
  );
}
