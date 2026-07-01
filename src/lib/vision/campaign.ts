/**
 * Vision campaign macro — deterministic direction variants for a 6-shot
 * campaign. Given a single Direction, returns six labeled variants that
 * mirror the canonical shot list of a real editorial / product campaign:
 *
 *   Hero · Lifestyle · Macro · Packaging · Detail · Social
 *
 * The user's original direction is preserved as Hero; every other variant
 * only overrides the fields that give that shot type its recognizable
 * shape. No AI round-trip.
 */

import type { Direction } from "./prompt";

export type ShotKind =
  | "hero"
  | "lifestyle"
  | "macro"
  | "packaging"
  | "detail"
  | "social";

export type CampaignShot = {
  kind: ShotKind;
  label: string;
  hint: string;
  direction: Direction;
};

export const CAMPAIGN_SHOTS: {
  kind: ShotKind;
  label: string;
  hint: string;
  transform: (d: Direction) => Direction;
}[] = [
  {
    kind: "hero",
    label: "Hero",
    hint: "Signature frame — the direction as directed",
    transform: (d) => ({ ...d }),
  },
  {
    kind: "lifestyle",
    label: "Lifestyle",
    hint: "In-use, environmental, human scale",
    transform: (d) => ({
      ...d,
      style: "lifestyle",
      composition: "thirds",
      lens: "35",
      aperture: "2.8",
    }),
  },
  {
    kind: "macro",
    label: "Macro",
    hint: "Close-up detail on material and craft",
    transform: (d) => ({
      ...d,
      style: "macro",
      composition: "closeup",
      lens: "100",
      aperture: "5.6",
    }),
  },
  {
    kind: "packaging",
    label: "Packaging",
    hint: "Clean product study for e-commerce",
    transform: (d) => ({
      ...d,
      style: "minimal",
      composition: "centered",
      lighting: "softbox",
      aspect: "1-1",
    }),
  },
  {
    kind: "detail",
    label: "Detail",
    hint: "Isolated material or texture story",
    transform: (d) => ({
      ...d,
      composition: "negative",
      lens: "85",
      aperture: "2.8",
    }),
  },
  {
    kind: "social",
    label: "Social",
    hint: "Square-first, punchy graphic language",
    transform: (d) => ({
      ...d,
      aspect: "1-1",
      style: "social",
      composition: "centered",
    }),
  },
];

export function buildCampaign(direction: Direction): CampaignShot[] {
  return CAMPAIGN_SHOTS.map(({ kind, label, hint, transform }) => ({
    kind,
    label,
    hint,
    direction: transform(direction),
  }));
}
