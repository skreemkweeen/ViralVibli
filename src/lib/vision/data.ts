/** Vision Studio vocabularies. The art-direction language the builder composes. */

export type Category = {
  id: string;
  label: string;
  tagline: string;
  /** default subject seed, shown as a hint */
  hint: string;
};

export const categories: Category[] = [
  { id: "luxury-product", label: "Luxury product", tagline: "Quiet, expensive, considered", hint: "a ceramic vase on stone" },
  { id: "beauty", label: "Beauty", tagline: "Skin, texture, glow", hint: "a serum bottle with dewy skin" },
  { id: "fashion", label: "Fashion editorial", tagline: "Movement and attitude", hint: "a model in a tailored coat" },
  { id: "flat-lay", label: "Flat lay", tagline: "Top-down, arranged", hint: "styled stationery and coffee" },
  { id: "ugc", label: "UGC", tagline: "Real, handheld, honest", hint: "holding the product to camera" },
  { id: "lifestyle", label: "Lifestyle", tagline: "In the moment", hint: "morning light in a kitchen" },
  { id: "food", label: "Food", tagline: "Appetite and craft", hint: "a plated dessert, side light" },
  { id: "interior", label: "Interior", tagline: "Space and material", hint: "a sunlit reading nook" },
  { id: "travel", label: "Travel", tagline: "Place and atmosphere", hint: "a coastal road at dusk" },
  { id: "automotive", label: "Automotive", tagline: "Form and speed", hint: "a parked coupe, wet asphalt" },
  { id: "architecture", label: "Architecture", tagline: "Line and light", hint: "a concrete facade, hard shadow" },
  { id: "tech", label: "Tech", tagline: "Precision and surface", hint: "a device on a matte plinth" },
  { id: "social", label: "Social media", tagline: "Scroll-stopping", hint: "a bold single-subject hero" },
  { id: "cinematic", label: "Cinematic", tagline: "A frame from a film", hint: "a figure in a doorway" },
  { id: "macro", label: "Macro", tagline: "The smallest detail", hint: "a droplet on a petal" },
  { id: "portrait", label: "Portrait", tagline: "Presence and gaze", hint: "a close portrait, soft key" },
];

export type Option = { id: string; label: string; detail?: string };

export const styles: Option[] = [
  { id: "editorial", label: "Editorial", detail: "magazine, art-directed" },
  { id: "minimal", label: "Minimal", detail: "negative space, restraint" },
  { id: "cinematic", label: "Cinematic", detail: "filmic, narrative" },
  { id: "luxe", label: "Luxe", detail: "polished, premium" },
  { id: "documentary", label: "Documentary", detail: "candid, unstaged" },
  { id: "surreal", label: "Surreal", detail: "dreamlike, unexpected" },
  { id: "vintage", label: "Vintage film", detail: "grain, faded" },
  { id: "high-key", label: "High-key", detail: "bright, airy" },
  { id: "low-key", label: "Low-key", detail: "moody, dark" },
  { id: "bold", label: "Bold color", detail: "saturated, graphic" },
];

export const lighting: Option[] = [
  { id: "golden", label: "Golden hour", detail: "warm, low sun" },
  { id: "window", label: "Soft window", detail: "diffused daylight" },
  { id: "softbox", label: "Studio softbox", detail: "controlled, even" },
  { id: "hard-sun", label: "Hard sun", detail: "crisp shadows" },
  { id: "rembrandt", label: "Rembrandt", detail: "dramatic portrait" },
  { id: "neon", label: "Neon", detail: "colored practicals" },
  { id: "rim", label: "Backlit rim", detail: "glowing edges" },
  { id: "overcast", label: "Overcast", detail: "soft, shadowless" },
  { id: "candle", label: "Candlelit", detail: "warm, intimate" },
  { id: "mixed", label: "Mixed practical", detail: "ambient sources" },
];

export const compositions: Option[] = [
  { id: "thirds", label: "Rule of thirds" },
  { id: "centered", label: "Centered" },
  { id: "negative", label: "Negative space" },
  { id: "closeup", label: "Tight close-up" },
  { id: "overhead", label: "Overhead" },
  { id: "low-angle", label: "Low angle" },
  { id: "dutch", label: "Dutch tilt" },
  { id: "leading", label: "Leading lines" },
  { id: "symmetry", label: "Symmetry" },
  { id: "frame", label: "Frame in frame" },
];

export const moods: Option[] = [
  { id: "serene", label: "Serene", detail: "calm, quiet" },
  { id: "bold", label: "Bold", detail: "confident, graphic" },
  { id: "intimate", label: "Intimate", detail: "close, warm" },
  { id: "energetic", label: "Energetic", detail: "lively, kinetic" },
  { id: "nostalgic", label: "Nostalgic", detail: "wistful, faded" },
  { id: "mysterious", label: "Mysterious", detail: "shadowed, moody" },
  { id: "playful", label: "Playful", detail: "bright, fun" },
  { id: "refined", label: "Refined", detail: "elegant, precise" },
];

export const materials: Option[] = [
  { id: "ceramic", label: "Ceramic" },
  { id: "glass", label: "Glass" },
  { id: "metal", label: "Brushed metal" },
  { id: "marble", label: "Marble" },
  { id: "linen", label: "Linen" },
  { id: "leather", label: "Leather" },
  { id: "wood", label: "Wood" },
  { id: "concrete", label: "Concrete" },
  { id: "velvet", label: "Velvet" },
  { id: "paper", label: "Paper" },
];

export const textures: Option[] = [
  { id: "matte", label: "Matte" },
  { id: "glossy", label: "Glossy" },
  { id: "soft-focus", label: "Soft focus" },
  { id: "crisp", label: "Crisp detail" },
  { id: "grain", label: "Film grain" },
  { id: "smooth", label: "Smooth" },
];

export const timesOfDay: Option[] = [
  { id: "dawn", label: "Dawn" },
  { id: "morning", label: "Morning" },
  { id: "midday", label: "Midday" },
  { id: "golden", label: "Golden hour" },
  { id: "blue", label: "Blue hour" },
  { id: "night", label: "Night" },
];

export const weathers: Option[] = [
  { id: "clear", label: "Clear" },
  { id: "overcast", label: "Overcast" },
  { id: "fog", label: "Soft fog" },
  { id: "rain", label: "Light rain" },
  { id: "snow", label: "Fresh snow" },
  { id: "harsh", label: "Harsh sun" },
];

export const renderStyles: Option[] = [
  { id: "photographic", label: "Photographic" },
  { id: "cinematic-film", label: "Cinematic film" },
  { id: "editorial-print", label: "Editorial print" },
  { id: "hyperreal", label: "Hyperreal" },
  { id: "analog", label: "Analog 35mm" },
  { id: "studio-render", label: "Studio render" },
];

export const qualities: Option[] = [
  { id: "standard", label: "Standard", detail: "clean" },
  { id: "high", label: "High", detail: "fine detail" },
  { id: "ultra", label: "Ultra", detail: "maximum detail" },
];

export const colorGrades: Option[] = [
  { id: "warm-film", label: "Warm film" },
  { id: "cool-editorial", label: "Cool editorial" },
  { id: "pastel", label: "Muted pastel" },
  { id: "bw", label: "High-contrast B&W" },
  { id: "teal-orange", label: "Teal and orange" },
  { id: "faded", label: "Faded analog" },
  { id: "rich", label: "Rich saturated" },
  { id: "neutral", label: "Clean neutral" },
];

export const cameras: Option[] = [
  { id: "hasselblad", label: "Hasselblad X2D" },
  { id: "phaseone", label: "Phase One XF" },
  { id: "sony", label: "Sony A7R V" },
  { id: "canon", label: "Canon R5" },
  { id: "leica", label: "Leica Q3" },
];

export const lenses: Option[] = [
  { id: "24", label: "24mm", detail: "wide" },
  { id: "35", label: "35mm", detail: "reportage" },
  { id: "50", label: "50mm", detail: "natural" },
  { id: "85", label: "85mm", detail: "portrait" },
  { id: "100", label: "100mm macro", detail: "detail" },
  { id: "135", label: "135mm", detail: "compression" },
];

export const apertures: Option[] = [
  { id: "1.4", label: "f/1.4", detail: "dreamy" },
  { id: "2", label: "f/2" },
  { id: "2.8", label: "f/2.8" },
  { id: "5.6", label: "f/5.6" },
  { id: "8", label: "f/8", detail: "sharp" },
  { id: "11", label: "f/11", detail: "deep" },
];

export type Aspect = { id: string; label: string; w: number; h: number };

export const aspects: Aspect[] = [
  { id: "1-1", label: "1:1", w: 1, h: 1 },
  { id: "4-5", label: "4:5", w: 4, h: 5 },
  { id: "3-2", label: "3:2", w: 3, h: 2 },
  { id: "2-3", label: "2:3", w: 2, h: 3 },
  { id: "16-9", label: "16:9", w: 16, h: 9 },
  { id: "9-16", label: "9:16", w: 9, h: 16 },
];

export function optionLabel(list: Option[], id: string | null): string | null {
  if (!id) return null;
  return list.find((o) => o.id === id)?.label ?? null;
}
