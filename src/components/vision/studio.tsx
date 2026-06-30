"use client";

import { VisionProvider } from "@/lib/vision/vision-store";
import { CategoryBar } from "./category-bar";
import { ControlPanel } from "./control-panel";
import { Canvas } from "./canvas";

export function VisionStudio() {
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
            <Canvas />
          </div>
        </div>
      </div>
    </VisionProvider>
  );
}
