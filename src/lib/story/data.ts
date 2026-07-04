export type Option = { id: string; label: string; detail?: string };

export const audiences: Option[] = [
  { id: "beauty", label: "Beauty enthusiasts", detail: "skincare, makeup, wellness" },
  { id: "fitness", label: "Fitness & wellness", detail: "gym, nutrition, mindset" },
  { id: "fashion", label: "Fashion & style", detail: "outfits, trends, OOTD" },
  { id: "food", label: "Food & recipes", detail: "cooking, restaurants, GRWM" },
  { id: "travel", label: "Travel & adventure", detail: "destinations, tips, vlogs" },
  { id: "entrepreneur", label: "Entrepreneurs", detail: "business, growth, hustle" },
  { id: "home", label: "Home & decor", detail: "interior, DIY, organization" },
  { id: "parent", label: "Parents & family", detail: "parenting, education, kids" },
];

export const goals: Option[] = [
  { id: "drive-engagement", label: "Drive engagement", detail: "replies, saves, shares" },
  { id: "gain-followers", label: "Gain followers", detail: "profile visits, follows" },
  { id: "promote-product", label: "Promote product", detail: "direct product push" },
  { id: "build-trust", label: "Build trust", detail: "authority, credibility" },
  { id: "educate", label: "Educate audience", detail: "how-tos, tips, knowledge" },
  { id: "go-viral", label: "Go viral", detail: "shares, reposts, reach" },
  { id: "affiliate", label: "Affiliate sales", detail: "link clicks, commissions" },
];

export const platforms: Option[] = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "lemon8", label: "Lemon8" },
  { id: "youtube-shorts", label: "YouTube Shorts" },
  { id: "pinterest", label: "Pinterest" },
];

export const voices: Option[] = [
  { id: "authentic", label: "Authentic", detail: "raw, real, relatable" },
  { id: "professional", label: "Professional", detail: "expert, polished, credible" },
  { id: "playful", label: "Playful", detail: "fun, light, energetic" },
  { id: "luxurious", label: "Luxurious", detail: "elevated, refined, premium" },
  { id: "inspirational", label: "Inspirational", detail: "motivating, uplifting" },
  { id: "edgy", label: "Edgy", detail: "bold, provocative, daring" },
];

export const tones: Option[] = [
  { id: "conversational", label: "Conversational", detail: "like texting a friend" },
  { id: "persuasive", label: "Persuasive", detail: "compelling, reason-forward" },
  { id: "motivational", label: "Motivational", detail: "energising, push to act" },
  { id: "humorous", label: "Humorous", detail: "funny, self-aware, witty" },
  { id: "emotional", label: "Emotional", detail: "heartfelt, vulnerable" },
  { id: "urgent", label: "Urgent", detail: "FOMO, time-sensitive" },
];

export const lengths: Option[] = [
  { id: "short", label: "Short", detail: "4 slides" },
  { id: "medium", label: "Medium", detail: "7 slides" },
  { id: "long", label: "Long", detail: "10 slides" },
];

export const ctaStyles: Option[] = [
  { id: "soft", label: "Soft ask", detail: "save this, try it" },
  { id: "direct", label: "Direct", detail: "buy now, click link" },
  { id: "urgency", label: "Urgency", detail: "limited time, don't miss" },
  { id: "question", label: "Question", detail: "comment your answer" },
  { id: "save-this", label: "Save this", detail: "bookmark for later" },
  { id: "share-it", label: "Share it", detail: "tag a friend" },
];

export const visualDirections: Option[] = [
  { id: "lifestyle", label: "Lifestyle", detail: "candid, in-the-moment" },
  { id: "product", label: "Product-focused", detail: "hero shots, detail close-ups" },
  { id: "bts", label: "Behind the scenes", detail: "process, workspace, day-in-life" },
  { id: "before-after", label: "Before & after", detail: "transformation reveal" },
  { id: "text-heavy", label: "Text-heavy", detail: "strong copy over simple bg" },
  { id: "minimal", label: "Minimal & clean", detail: "negative space, editorial" },
  { id: "bold", label: "Bold & colorful", detail: "high-saturation, eye-catching" },
];

export const hookStrengths: Option[] = [
  { id: "mild", label: "Mild", detail: "gentle, curious" },
  { id: "moderate", label: "Moderate", detail: "clear value prop" },
  { id: "strong", label: "Strong", detail: "pattern interrupt" },
  { id: "extreme", label: "Extreme", detail: "max controversy / surprise" },
];

export const postingSchedules: Option[] = [
  { id: "single", label: "Single post", detail: "one standalone story" },
  { id: "daily", label: "Daily series", detail: "post one slide per day" },
  { id: "3-day", label: "3-day series", detail: "cliffhanger across 3 days" },
  { id: "launch", label: "Launch week", detail: "product or campaign launch" },
];

export const campaignObjectives: Option[] = [
  { id: "awareness", label: "Brand awareness", detail: "reach, impressions" },
  { id: "consideration", label: "Drive consideration", detail: "profile views, saves" },
  { id: "conversion", label: "Convert sales", detail: "link clicks, purchases" },
  { id: "retention", label: "Retain audience", detail: "returning viewers" },
  { id: "ugc", label: "Generate UGC", detail: "user repost and remix" },
];

export function optionLabel(list: Option[], id: string | null): string | null {
  if (!id) return null;
  return list.find((o) => o.id === id)?.label ?? null;
}
