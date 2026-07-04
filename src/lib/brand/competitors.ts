/**
 * Competitor intelligence — captured explicitly by the creator, never
 * scraped. The AI Director compares the current brand against these
 * profiles to surface positioning opportunities.
 */

export type Competitor = {
  id: string;
  brand: string;
  voice: string;
  colors: string[];
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  messaging: string;
  visualStyle: string;
  targetAudience: string;
  differentiators: string[];
  createdAt: number;
  updatedAt: number;
};

export function emptyCompetitor(id: string, now: number = Date.now()): Competitor {
  return {
    id,
    brand: "",
    voice: "",
    colors: [],
    positioning: "",
    strengths: [],
    weaknesses: [],
    messaging: "",
    visualStyle: "",
    targetAudience: "",
    differentiators: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function updateCompetitor(
  c: Competitor,
  patch: Partial<Competitor>,
): Competitor {
  return { ...c, ...patch, updatedAt: Date.now() };
}

export function addCompetitorTag(
  c: Competitor,
  field: "colors" | "strengths" | "weaknesses" | "differentiators",
  value: string,
): Competitor {
  const trimmed = value.trim();
  if (!trimmed || c[field].includes(trimmed)) return c;
  return updateCompetitor(c, { [field]: [...c[field], trimmed] });
}

export function removeCompetitorTag(
  c: Competitor,
  field: "colors" | "strengths" | "weaknesses" | "differentiators",
  value: string,
): Competitor {
  return updateCompetitor(c, {
    [field]: c[field].filter((v) => v !== value),
  });
}

// ─── Comparison ──────────────────────────────────────────────────────────

export type CompetitorInsight = {
  competitorId: string;
  competitorName: string;
  overlap: string[];
  opportunity: string[];
  risk: string[];
};

/**
 * Compare a brand vocabulary + positioning against a competitor. Returns
 * overlap (things both do), opportunity (weaknesses to exploit), and
 * risk (strengths to compete against).
 *
 * Pure — the AI never copies competitor content, only identifies
 * angles.
 */
export function compareCompetitor(
  vocab: string[],
  positioning: string,
  competitor: Competitor,
): CompetitorInsight {
  const brandTerms = new Set(vocab.map((v) => v.toLowerCase()));
  const compVocab = new Set(
    [competitor.voice, competitor.messaging, competitor.visualStyle]
      .join(" ")
      .toLowerCase()
      .split(/[\s,]+/)
      .filter(Boolean),
  );
  const overlap = Array.from(brandTerms).filter((v) => compVocab.has(v));

  const opportunity = [
    ...competitor.weaknesses,
    ...(competitor.positioning && positioning
      ? [`Position against: "${competitor.positioning}"`]
      : []),
  ];

  const risk = competitor.strengths;
  return {
    competitorId: competitor.id,
    competitorName: competitor.brand || "Untitled competitor",
    overlap,
    opportunity,
    risk,
  };
}
