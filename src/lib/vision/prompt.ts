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
  moods,
  materials,
  textures,
  timesOfDay,
  weathers,
  renderStyles,
  qualities,
  optionLabel,
} from "./data";

/** The full art-direction state the builder composes. */
export type Direction = {
  category: string;
  subject: string;
  environment: string;
  style: string | null;
  mood: string | null;
  lighting: string | null;
  composition: string | null;
  colorGrade: string | null;
  camera: string | null;
  lens: string | null;
  aperture: string | null;
  material: string | null;
  texture: string | null;
  timeOfDay: string | null;
  weather: string | null;
  render: string | null;
  quality: string;
  aspect: string;
};

export const emptyDirection: Direction = {
  category: "luxury-product",
  subject: "",
  environment: "",
  style: "editorial",
  mood: "refined",
  lighting: "window",
  composition: "negative",
  colorGrade: "neutral",
  camera: "hasselblad",
  lens: "50",
  aperture: "2.8",
  material: null,
  texture: null,
  timeOfDay: null,
  weather: null,
  render: "photographic",
  quality: "high",
  aspect: "4-5",
};

/** Assemble a professional photography-direction prompt from the state. */
export function assemblePrompt(d: Direction): string {
  const cat = categories.find((c) => c.id === d.category);
  const subject = d.subject.trim() || cat?.hint || "the subject";

  const parts: string[] = [];

  // subject, material, category
  const mat = optionLabel(materials, d.material);
  const subjectClause = mat
    ? `${capitalize(subject)} in ${mat.toLowerCase()}`
    : capitalize(subject);
  parts.push(`${subjectClause}. ${cat?.label ?? "Editorial"} photography`);

  // style, mood, composition
  const style = optionLabel(styles, d.style);
  const mood = optionLabel(moods, d.mood);
  const comp = optionLabel(compositions, d.composition);
  const tone = [
    style && `${style.toLowerCase()} style`,
    mood && `${mood.toLowerCase()} mood`,
    comp && comp.toLowerCase(),
  ].filter(Boolean);
  if (tone.length) parts.push(tone.join(", "));

  // gear
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

  // light, time, weather
  const light = optionLabel(lighting, d.lighting);
  const time = optionLabel(timesOfDay, d.timeOfDay);
  const weather = optionLabel(weathers, d.weather);
  const env = [
    light && `${light.toLowerCase()} lighting`,
    time && time.toLowerCase(),
    weather && weather.toLowerCase(),
  ].filter(Boolean);
  if (env.length) parts.push(env.join(", "));

  if (d.environment.trim()) parts.push(d.environment.trim());

  // surface, grade
  const texture = optionLabel(textures, d.texture);
  const grade = optionLabel(colorGrades, d.colorGrade);
  const finish = [
    texture && `${texture.toLowerCase()} finish`,
    grade && `${grade.toLowerCase()} color grade`,
  ].filter(Boolean);
  if (finish.length) parts.push(finish.join(", "));

  // render + aspect + quality
  const render = optionLabel(renderStyles, d.render);
  if (render) parts.push(`${render.toLowerCase()} rendering`);

  const aspect = aspects.find((a) => a.id === d.aspect);
  if (aspect) parts.push(`${aspect.label} aspect ratio`);

  const quality = optionLabel(qualities, d.quality);
  parts.push(
    `art-directed, ${quality ? `${quality.toLowerCase()} detail` : "high detail"}, professional`,
  );

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
