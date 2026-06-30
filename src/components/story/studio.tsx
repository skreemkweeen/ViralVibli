"use client";

import { StoryProvider } from "@/lib/story/store";
import { StudioShell } from "@/components/studio";
import { StoryControls } from "./controls";
import { StorySequence } from "./sequence";

export function StoryStudio() {
  return (
    <StoryProvider>
      <div className="flex flex-col lg:h-[calc(100dvh-8rem)]">
        {/* Header */}
        <header className="mb-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-[clamp(1.6rem,4vw,2.2rem)] font-semibold tracking-[-0.03em]">
                Story Studio
              </h1>
              <p className="mt-1.5 text-[15px] text-muted">
                Psychology-backed story sequences for Instagram, TikTok, YouTube Shorts, and more.
              </p>
            </div>
          </div>
        </header>

        {/* Two-pane workspace */}
        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-line bg-surface">
          <StudioShell
            controls={<StoryControls />}
            canvas={<StorySequence />}
          />
        </div>
      </div>
    </StoryProvider>
  );
}
