"use client";

import { useVision } from "@/lib/vision/vision-store";
import {
  styles,
  lighting,
  compositions,
  colorGrades,
  cameras,
  lenses,
  apertures,
  aspects,
  categories,
  optionLabel,
} from "@/lib/vision/data";
import { ControlSection } from "./control-section";
import { ChipGroup } from "./chip-group";

export function ControlPanel() {
  const { direction, setField, resetDirection } = useVision();
  const cat = categories.find((c) => c.id === direction.category);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="text-[14px] font-medium text-ink">Direction</h2>
        <button
          onClick={resetDirection}
          className="text-[12.5px] text-muted transition-colors hover:text-ink"
        >
          Reset
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        {/* Subject */}
        <ControlSection title="Subject" defaultOpen>
          <input
            value={direction.subject}
            onChange={(e) => setField("subject", e.target.value)}
            placeholder={cat?.hint ?? "Describe the subject"}
            className="h-10 w-full rounded-lg border border-line bg-bg px-3 text-[13px] text-ink placeholder:text-faint focus:border-faint focus:outline-none"
          />
        </ControlSection>

        {/* Style */}
        <ControlSection
          title="Style"
          summary={optionLabel(styles, direction.style)}
        >
          <ChipGroup
            options={styles}
            value={direction.style}
            onChange={(v) => setField("style", v)}
            size="sm"
          />
        </ControlSection>

        {/* Camera & lens */}
        <ControlSection
          title="Camera and lens"
          summary={optionLabel(cameras, direction.camera)}
        >
          <div className="space-y-3">
            <Field label="Body">
              <ChipGroup
                options={cameras}
                value={direction.camera}
                onChange={(v) => setField("camera", v)}
                size="sm"
              />
            </Field>
            <Field label="Focal length">
              <ChipGroup
                options={lenses}
                value={direction.lens}
                onChange={(v) => setField("lens", v)}
                size="sm"
              />
            </Field>
            <Field label="Aperture">
              <ChipGroup
                options={apertures}
                value={direction.aperture}
                onChange={(v) => setField("aperture", v)}
                size="sm"
              />
            </Field>
          </div>
        </ControlSection>

        {/* Lighting */}
        <ControlSection
          title="Lighting"
          summary={optionLabel(lighting, direction.lighting)}
        >
          <ChipGroup
            options={lighting}
            value={direction.lighting}
            onChange={(v) => setField("lighting", v)}
            size="sm"
          />
        </ControlSection>

        {/* Composition */}
        <ControlSection
          title="Composition"
          summary={optionLabel(compositions, direction.composition)}
        >
          <ChipGroup
            options={compositions}
            value={direction.composition}
            onChange={(v) => setField("composition", v)}
            size="sm"
          />
        </ControlSection>

        {/* Environment */}
        <ControlSection title="Environment" defaultOpen={false}>
          <input
            value={direction.environment}
            onChange={(e) => setField("environment", e.target.value)}
            placeholder="e.g. on travertine, near a tall window"
            className="h-10 w-full rounded-lg border border-line bg-bg px-3 text-[13px] text-ink placeholder:text-faint focus:border-faint focus:outline-none"
          />
        </ControlSection>

        {/* Color grade */}
        <ControlSection
          title="Color grade"
          summary={optionLabel(colorGrades, direction.colorGrade)}
        >
          <ChipGroup
            options={colorGrades}
            value={direction.colorGrade}
            onChange={(v) => setField("colorGrade", v)}
            size="sm"
          />
        </ControlSection>

        {/* Aspect ratio */}
        <ControlSection
          title="Aspect ratio"
          summary={aspects.find((a) => a.id === direction.aspect)?.label}
        >
          <div className="flex flex-wrap gap-1.5">
            {aspects.map((a) => {
              const active = direction.aspect === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setField("aspect", a.id)}
                  aria-pressed={active}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12.5px] transition-colors ${
                    active
                      ? "border-accent/50 bg-accent/[0.10] text-ink"
                      : "border-line bg-bg text-muted hover:border-faint hover:text-ink"
                  }`}
                >
                  <span
                    className="block rounded-[2px] border border-current opacity-70"
                    style={{
                      width: 14 * (a.w >= a.h ? 1 : a.w / a.h),
                      height: 14 * (a.h >= a.w ? 1 : a.h / a.w),
                    }}
                  />
                  {a.label}
                </button>
              );
            })}
          </div>
        </ControlSection>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] uppercase tracking-[0.12em] text-faint">
        {label}
      </p>
      {children}
    </div>
  );
}
