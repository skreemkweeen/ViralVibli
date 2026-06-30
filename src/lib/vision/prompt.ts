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
} from "./data";

/** The full art-direction state the builder composes. */
export type Direction = {
  category: string;
  subject: string;
  environment: string;
  style: string | null;
  lighting: string | null;
  composition: string | null;
  colorGrade: string | null;
  camera: string | null;
  lens: string | null;
  aperture: string | null;
  aspect: string;
};

export const emptyDirection: Direction = {
  category: "luxury-product",
  subject: "",
  environment: "",
  style: "editorial",
  lighting: "window",
  composition: "negative",
  colorGrade: "neutral",
  camera: "hasselblad",
  lens: "50",
  aperture: "2.8",
  aspect: "4-5",
};

/** Assemble a professional photography-direction prompt from the state. */
export function assemblePrompt(d: Direction): string {
  const cat = categories.find((c) => c.id === d.category);
  const subject = d.subject.trim() || cat?.hint || "the subject";

  const parts: string[] = [];
  parts.push(
    `${capitalize(subject)}. ${cat?.label ?? "Editorial"} photography`,
  );

  const style = optionLabel(styles, d.style);
  const comp = optionLabel(compositions, d.composition);
  if (style || comp) {
    parts.push(
      [style && `${style.toLowerCase()} style`, comp && comp.toLowerCase()]
        .filter(Boolean)
        .join(", "),
    );
  }

  const cam = optionLabel(cameras, d.camera);
  const lens = optionLabel(lenses, d.lens);
  const ap = optionLabel(apertures, d.aperture);
  if (cam || lens || ap) {
    const gear = [
      cam && `shot on ${cam}`,
      lens && `${lens} lens`,
      ap && `at ${ap}`,
    ]
      .filter(Boolean)
      .join(" ");
    parts.push(gear);
  }

  const light = optionLabel(lighting, d.lighting);
  if (light) parts.push(`${light.toLowerCase()} lighting`);

  if (d.environment.trim()) parts.push(d.environment.trim());

  const grade = optionLabel(colorGrades, d.colorGrade);
  if (grade) parts.push(`${grade.toLowerCase()} color grade`);

  const aspect = aspects.find((a) => a.id === d.aspect);
  if (aspect) parts.push(`${aspect.label} aspect ratio`);

  parts.push("art-directed, high detail, professional");

  return parts.join(". ").replace(/\.\./g, ".") + ".";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Deterministic, on-brand gradient for a concept card. Kept in a dark,
 * desaturated range with a subtle hue shift per seed so the gallery feels
 * varied without turning into rainbow slop.
 */
export function conceptGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const hue2 = (hue + 40) % 360;
  return `radial-gradient(120% 120% at 30% 15%, hsl(${hue} 22% 16%) 0%, hsl(${hue2} 18% 9%) 70%)`;
}
