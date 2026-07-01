"use client";

import { ControlSection, ChipGroup, StudioGenerateButton } from "@/components/studio";
import { useStory } from "@/lib/story/store";
import {
  audiences,
  goals,
  platforms,
  voices,
  tones,
  lengths,
  ctaStyles,
  visualDirections,
  hookStrengths,
  postingSchedules,
  campaignObjectives,
} from "@/lib/story/data";
import { frameworks } from "@/lib/story/frameworks";
export function StoryControls() {
  const {
    direction,
    setField,
    generating,
    enhancing,
    generate,
    cancelGeneration,
  } = useStory();

  return (
    <div className="flex h-full flex-col">
      {/* Subject input */}
      <div className="border-b border-line px-4 py-4">
        <label className="mb-2 block text-[12px] font-medium uppercase tracking-wider text-faint">
          What's this story about?
        </label>
        <textarea
          value={direction.subject}
          onChange={(e) => setField("subject", e.target.value)}
          placeholder="My new skincare serum, a brand collaboration, a personal travel story…"
          rows={3}
          className="w-full resize-none rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[13.5px] text-ink placeholder:text-faint transition-colors focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        />
      </div>

      {/* Scrollable controls */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        <ControlSection
          title="Framework"
          summary={frameworks.find((f) => f.id === direction.framework)?.name ?? null}
        >
          <div className="space-y-2">
            {frameworks.map((fw) => {
              const active = direction.framework === fw.id;
              return (
                <button
                  key={fw.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setField("framework", fw.id)}
                  className={`w-full cursor-pointer rounded-xl border px-3.5 py-3 text-left transition-colors active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    active
                      ? "border-accent/50 bg-accent/[0.08]"
                      : "border-line bg-bg hover:border-faint"
                  }`}
                >
                  <div className="text-[13px] font-medium text-ink">{fw.name}</div>
                  <div className="mt-0.5 text-[12px] text-faint">{fw.tagline}</div>
                </button>
              );
            })}
          </div>
        </ControlSection>

        <ControlSection title="Platform" summary={direction.platform}>
          <ChipGroup
            options={platforms}
            value={direction.platform}
            onChange={(v) => setField("platform", v ?? "instagram")}
            clearable={false}
          />
        </ControlSection>

        <ControlSection title="Story Length" summary={lengths.find(l => l.id === direction.length)?.detail ?? null}>
          <ChipGroup
            options={lengths}
            value={direction.length}
            onChange={(v) => setField("length", v ?? "medium")}
            clearable={false}
          />
        </ControlSection>

        <ControlSection title="Audience" summary={audiences.find(a => a.id === direction.audience)?.label ?? null} defaultOpen={false}>
          <ChipGroup
            options={audiences}
            value={direction.audience}
            onChange={(v) => setField("audience", v)}
          />
        </ControlSection>

        <ControlSection title="Goal" summary={goals.find(g => g.id === direction.goal)?.label ?? null} defaultOpen={false}>
          <ChipGroup
            options={goals}
            value={direction.goal}
            onChange={(v) => setField("goal", v ?? "drive-engagement")}
            clearable={false}
          />
        </ControlSection>

        <ControlSection title="Brand Voice" summary={voices.find(v => v.id === direction.voice)?.label ?? null} defaultOpen={false}>
          <ChipGroup
            options={voices}
            value={direction.voice}
            onChange={(v) => setField("voice", v)}
          />
        </ControlSection>

        <ControlSection title="Tone" summary={tones.find(t => t.id === direction.tone)?.label ?? null} defaultOpen={false}>
          <ChipGroup
            options={tones}
            value={direction.tone}
            onChange={(v) => setField("tone", v)}
          />
        </ControlSection>

        <ControlSection title="Hook Strength" summary={hookStrengths.find(h => h.id === direction.hookStrength)?.label ?? null} defaultOpen={false}>
          <ChipGroup
            options={hookStrengths}
            value={direction.hookStrength}
            onChange={(v) => setField("hookStrength", v ?? "strong")}
            clearable={false}
          />
        </ControlSection>

        <ControlSection title="Visual Direction" summary={visualDirections.find(v => v.id === direction.visualDirection)?.label ?? null} defaultOpen={false}>
          <ChipGroup
            options={visualDirections}
            value={direction.visualDirection}
            onChange={(v) => setField("visualDirection", v)}
          />
        </ControlSection>

        <ControlSection title="CTA Style" summary={ctaStyles.find(c => c.id === direction.ctaStyle)?.label ?? null} defaultOpen={false}>
          <ChipGroup
            options={ctaStyles}
            value={direction.ctaStyle}
            onChange={(v) => setField("ctaStyle", v)}
          />
        </ControlSection>

        <ControlSection title="Posting Schedule" defaultOpen={false}>
          <ChipGroup
            options={postingSchedules}
            value={direction.postingSchedule}
            onChange={(v) => setField("postingSchedule", v)}
          />
        </ControlSection>

        <ControlSection title="Campaign Objective" defaultOpen={false}>
          <ChipGroup
            options={campaignObjectives}
            value={direction.campaignObjective}
            onChange={(v) => setField("campaignObjective", v)}
          />
        </ControlSection>
      </div>

      {/* Generate button — sticky footer */}
      <div className="border-t border-line px-4 py-4">
        <StudioGenerateButton
          generating={generating}
          enhancing={enhancing}
          onGenerate={generate}
          onCancel={cancelGeneration}
          label="Build story"
          generatingLabel="Building story…"
          enhancingLabel="Composing…"
        />
      </div>
    </div>
  );
}
