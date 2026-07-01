"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { VaultProvider, useVault } from "@/lib/vault/store";
import { StudioShell } from "@/components/studio";
import { VaultControls } from "./controls";
import { VaultPromptGrid } from "./prompt-grid";
import { VaultPromptDetail } from "./prompt-detail";
import {
  PromptRelationshipGraph,
  VaultViewToggle,
} from "./relationship-graph";

function VaultCanvas() {
  const { selectedId } = useVault();
  const reduce = useReducedMotion();
  const [view, setView] = useState<"grid" | "graph">("grid");

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Main pane — grid or graph */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-end border-b border-line-soft px-4 py-2">
          <VaultViewToggle view={view} onChange={setView} />
        </div>
        {view === "grid" ? <VaultPromptGrid /> : <PromptRelationshipGraph />}
      </div>

      {/* Detail panel — slides in from the right */}
      <AnimatePresence initial={false}>
        {selectedId && (
          <motion.aside
            key="vault-detail"
            initial={reduce ? { opacity: 0 } : { x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { x: 20, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="h-full w-80 shrink-0 overflow-hidden border-l border-line bg-surface xl:w-96"
          >
            <VaultPromptDetail />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

export function VaultStudio() {
  return (
    <VaultProvider>
      <div className="flex flex-col lg:h-[calc(100dvh-8rem)]">
        {/* Header */}
        <header className="mb-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-[clamp(1.6rem,4vw,2.2rem)] font-semibold tracking-[-0.03em]">
                Prompt Vault
              </h1>
              <p className="mt-1.5 text-[15px] text-muted">
                Your intelligent prompt library. Save, organize, and transform prompts for any AI platform.
              </p>
            </div>
          </div>
        </header>

        {/* Two-pane workspace */}
        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-line bg-surface">
          <StudioShell
            controls={<VaultControls />}
            canvas={<VaultCanvas />}
          />
        </div>
      </div>
    </VaultProvider>
  );
}
