/**
 * Persona engine — structured audience intelligence the AI can reason
 * about. Every persona has 14 fields, matching the documented spec.
 */

export type Persona = {
  id: string;
  name: string;
  age: string;
  occupation: string;
  goals: string[];
  painPoints: string[];
  dreamOutcome: string;
  buyingMotivation: string;
  objections: string[];
  language: string;
  socialPlatforms: string[];
  contentPreferences: string[];
  visualPreferences: string[];
  communicationStyle: string;
  /** How well this persona aligns with the brand (0-100) */
  brandFit: number;
  createdAt: number;
  updatedAt: number;
};

export function emptyPersona(id: string, now: number = Date.now()): Persona {
  return {
    id,
    name: "",
    age: "",
    occupation: "",
    goals: [],
    painPoints: [],
    dreamOutcome: "",
    buyingMotivation: "",
    objections: [],
    language: "",
    socialPlatforms: [],
    contentPreferences: [],
    visualPreferences: [],
    communicationStyle: "",
    brandFit: 60,
    createdAt: now,
    updatedAt: now,
  };
}

export function updatePersona(p: Persona, patch: Partial<Persona>): Persona {
  return { ...p, ...patch, updatedAt: Date.now() };
}

export function addPersonaTag(
  p: Persona,
  field:
    | "goals"
    | "painPoints"
    | "objections"
    | "socialPlatforms"
    | "contentPreferences"
    | "visualPreferences",
  value: string,
): Persona {
  const trimmed = value.trim();
  if (!trimmed || p[field].includes(trimmed)) return p;
  return updatePersona(p, { [field]: [...p[field], trimmed] });
}

export function removePersonaTag(
  p: Persona,
  field:
    | "goals"
    | "painPoints"
    | "objections"
    | "socialPlatforms"
    | "contentPreferences"
    | "visualPreferences",
  value: string,
): Persona {
  return updatePersona(p, {
    [field]: p[field].filter((v) => v !== value),
  });
}

/**
 * Personality-informed brand-fit score. Nudges brandFit based on how
 * many of the persona's stated preferences the brand vocabulary
 * matches, so a persona whose visual preferences are 'quiet' and
 * 'editorial' feels like a strong fit for a Luxury/editorial brand.
 */
export function scorePersonaFit(
  persona: Persona,
  vocabulary: string[],
): number {
  const set = new Set(vocabulary.map((v) => v.toLowerCase()));
  if (set.size === 0) return persona.brandFit;
  const hits = [
    ...persona.contentPreferences,
    ...persona.visualPreferences,
    persona.language,
    persona.communicationStyle,
  ]
    .filter(Boolean)
    .map((v) => v.toLowerCase())
    .filter((v) => Array.from(set).some((word) => v.includes(word)));
  const bonus = Math.min(25, hits.length * 6);
  return Math.max(0, Math.min(100, persona.brandFit + bonus - 10));
}
