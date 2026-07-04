/**
 * Export Center — turn a Vision Studio project state into portable
 * artefacts. Two shapes:
 *
 *   • Prompt bundles — the composed prompt reformatted for each of the
 *     8 target models.
 *   • Campaign packages — brief + shot list + prompts + camera + lighting
 *     + references + metadata, exported as JSON / Markdown / CSV.
 *
 * Pure — receives fully-resolved inputs and returns strings + filenames.
 */

import type { CreativeBrief } from "./brief";
import type { LightingSetup } from "./lighting";
import type { Direction } from "./prompt";
import type { ReferenceItem } from "./reference-wall";
import type { Shot } from "./shots";
import type { CampaignPlan } from "./campaign-plans";
import { formatForModel, TARGET_MODELS, type TargetModelId } from "./models";

// ─── Prompt bundle ────────────────────────────────────────────────────────

export type PromptBundleEntry = {
  modelId: TargetModelId;
  label: string;
  text: string;
};

export function promptBundle(
  prompt: string,
  direction: Direction,
): PromptBundleEntry[] {
  return TARGET_MODELS.map((m) => ({
    modelId: m.id,
    label: m.label,
    text: formatForModel(prompt, m.id, {
      aspect: direction.aspect,
      quality: direction.quality,
    }),
  }));
}

// ─── Formats ──────────────────────────────────────────────────────────────

export type ExportFormat = "json" | "markdown" | "csv";

export type ExportedArtifact = {
  filename: string;
  mime: string;
  content: string;
};

// ─── Campaign package ─────────────────────────────────────────────────────

export type CampaignPackageInput = {
  projectName?: string;
  brief: CreativeBrief;
  shots: Shot[];
  campaigns: CampaignPlan[];
  lighting: LightingSetup;
  references: ReferenceItem[];
  direction: Direction;
  prompt: string;
  createdAt?: number;
};

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "vision"
  );
}

/**
 * JSON export — full structured dump.
 */
export function exportCampaignAsJson(
  input: CampaignPackageInput,
): ExportedArtifact {
  const payload = {
    generatedBy: "ViralVibli · Vision Studio",
    createdAt: input.createdAt ?? Date.now(),
    projectName: input.projectName ?? "Untitled",
    brief: input.brief,
    direction: input.direction,
    prompt: input.prompt,
    promptBundle: promptBundle(input.prompt, input.direction),
    lighting: input.lighting,
    references: input.references,
    shots: input.shots,
    campaigns: input.campaigns,
  };
  return {
    filename: `${slugify(input.projectName ?? "vision")}-campaign.json`,
    mime: "application/json",
    content: JSON.stringify(payload, null, 2),
  };
}

/**
 * Markdown export — a shareable brief-style document.
 */
export function exportCampaignAsMarkdown(
  input: CampaignPackageInput,
): ExportedArtifact {
  const b = input.brief;
  const lines: string[] = [];
  lines.push(`# ${input.projectName ?? "Untitled Campaign"}`);
  lines.push("");
  lines.push("_Vision Studio campaign package_");
  lines.push("");
  lines.push("## Creative brief");
  if (b.objective) lines.push(`- **Objective:** ${b.objective}`);
  if (b.audience) lines.push(`- **Audience:** ${b.audience}`);
  if (b.platform) lines.push(`- **Platform:** ${b.platform}`);
  if (b.deliverables) lines.push(`- **Deliverables:** ${b.deliverables}`);
  if (b.visualKeywords) lines.push(`- **Visual keywords:** ${b.visualKeywords}`);
  if (b.brandPersonality)
    lines.push(`- **Brand personality:** ${b.brandPersonality}`);
  if (b.artDirectionNotes)
    lines.push(`- **Art direction notes:** ${b.artDirectionNotes}`);
  if (b.references) lines.push(`- **References:** ${b.references}`);
  if (b.constraints) lines.push(`- **Constraints:** ${b.constraints}`);
  lines.push("");
  lines.push("## Direction");
  lines.push("```json");
  lines.push(JSON.stringify(input.direction, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("## Prompt");
  lines.push(input.prompt);
  lines.push("");
  lines.push("## Per-model bundles");
  for (const b of promptBundle(input.prompt, input.direction)) {
    lines.push(`### ${b.label}`);
    lines.push("```");
    lines.push(b.text);
    lines.push("```");
  }
  if (input.shots.length) {
    lines.push("");
    lines.push("## Shot list");
    for (const s of input.shots) {
      lines.push(`### ${s.name} · ${s.type}`);
      lines.push(`- Status: ${s.status} · Approval: ${s.approval}`);
      lines.push(
        `- Aspect ${s.direction.aspect} · Lens ${s.direction.lens ?? "—"}mm · f/${s.direction.aperture ?? "—"} · Comp ${s.direction.composition ?? "—"}`,
      );
      if (s.references.length)
        lines.push(
          `- References: ${s.references
            .map((r) => (r.url ? `[${r.label}](${r.url})` : r.label))
            .join(" · ")}`,
        );
      lines.push("");
      lines.push("```");
      lines.push(s.prompt);
      lines.push("```");
    }
  }
  if (input.campaigns.length) {
    lines.push("");
    lines.push("## Campaigns");
    for (const c of input.campaigns) {
      lines.push(`- **${c.label}** — ${c.shots.length} shot(s)`);
    }
  }
  if (input.references.length) {
    lines.push("");
    lines.push("## References");
    for (const r of input.references) {
      lines.push(
        `- **${r.title}** _(${r.kind})_${r.url ? ` — ${r.url}` : ""}${r.note ? ` — ${r.note}` : ""}`,
      );
    }
  }
  return {
    filename: `${slugify(input.projectName ?? "vision")}-campaign.md`,
    mime: "text/markdown",
    content: lines.join("\n") + "\n",
  };
}

/**
 * CSV export — one row per shot, flattened for spreadsheets.
 */
export function exportShotsAsCsv(input: CampaignPackageInput): ExportedArtifact {
  const header = [
    "id",
    "name",
    "type",
    "status",
    "approval",
    "aspect",
    "lens",
    "aperture",
    "composition",
    "style",
    "mood",
    "prompt",
  ];
  const rows = [header];
  for (const s of input.shots) {
    rows.push([
      s.id,
      s.name,
      s.type,
      s.status,
      s.approval,
      s.direction.aspect,
      s.direction.lens ?? "",
      s.direction.aperture ?? "",
      s.direction.composition ?? "",
      s.direction.style ?? "",
      s.direction.mood ?? "",
      s.prompt.replace(/"/g, '""'),
    ]);
  }
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/\n/g, " ")}"`).join(","))
    .join("\n");
  return {
    filename: `${slugify(input.projectName ?? "vision")}-shots.csv`,
    mime: "text/csv",
    content: csv + "\n",
  };
}

// ─── Dispatch ─────────────────────────────────────────────────────────────

export function exportCampaign(
  input: CampaignPackageInput,
  format: ExportFormat,
): ExportedArtifact {
  switch (format) {
    case "json":
      return exportCampaignAsJson(input);
    case "markdown":
      return exportCampaignAsMarkdown(input);
    case "csv":
      return exportShotsAsCsv(input);
  }
}
