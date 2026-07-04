import type { PromptCategory, PromptPlatform, TransformOp, PromptEntry } from "./types";

export type CategoryOption = {
  id: PromptCategory;
  label: string;
  icon: string;
};

export type PlatformOption = {
  id: PromptPlatform;
  label: string;
};

export type TransformOption = {
  id: TransformOp;
  label: string;
  description: string;
};

export const categories: CategoryOption[] = [
  { id: "image-gen", label: "Image Gen", icon: "🎨" },
  { id: "social", label: "Social Media", icon: "📱" },
  { id: "copywriting", label: "Copywriting", icon: "✍️" },
  { id: "video", label: "Video", icon: "🎬" },
  { id: "research", label: "Research", icon: "🔍" },
  { id: "analysis", label: "Analysis", icon: "📊" },
  { id: "code", label: "Code", icon: "💻" },
  { id: "creative", label: "Creative", icon: "💡" },
];

export const platforms: PlatformOption[] = [
  { id: "chatgpt", label: "ChatGPT" },
  { id: "claude", label: "Claude" },
  { id: "midjourney", label: "Midjourney" },
  { id: "dalle", label: "DALL-E" },
  { id: "flux", label: "Flux" },
  { id: "runway", label: "Runway" },
  { id: "sora", label: "Sora" },
  { id: "stable-diffusion", label: "Stable Diffusion" },
];

export const transformOps: TransformOption[] = [
  { id: "improve", label: "Improve", description: "Sharpen specificity and impact" },
  { id: "expand", label: "Expand", description: "Add detail and context" },
  { id: "condense", label: "Condense", description: "Distill to the core" },
  { id: "rewrite", label: "Rewrite", description: "Fresh phrasing, same intent" },
  { id: "make-casual", label: "Make Casual", description: "Conversational tone" },
  { id: "make-professional", label: "Make Professional", description: "Formal and precise" },
  { id: "make-creative", label: "Make Creative", description: "Push beyond the obvious" },
  { id: "variations", label: "Variations", description: "Generate 3 distinct takes" },
];

function seed(
  id: string,
  title: string,
  content: string,
  category: PromptCategory,
  tags: string[],
  platform?: PromptPlatform,
): PromptEntry {
  return {
    id,
    title,
    content,
    category,
    tags,
    platform,
    source: "seed",
    favorite: false,
    pinned: false,
    usageCount: 0,
    versions: [],
    createdAt: Date.now() - Math.floor(Math.random() * 30) * 86400000,
    updatedAt: Date.now() - Math.floor(Math.random() * 7) * 86400000,
  };
}

export const SEED_PROMPTS: PromptEntry[] = [
  // Image Gen
  seed(
    "seed-img-1",
    "Cinematic Tokyo portrait",
    "Cinematic portrait of a woman in a neon-lit Tokyo alleyway at night. Rain-soaked cobblestone streets reflecting pink and cyan light. Cyberpunk aesthetic, 35mm film grain, shallow depth of field. Shot on Leica M11, f/1.4, ISO 1600.",
    "image-gen",
    ["portrait", "cyberpunk", "night", "tokyo", "cinematic"],
    "midjourney",
  ),
  seed(
    "seed-img-2",
    "Luxury product photography",
    "Minimal product photography: luxury skincare bottle centered on white Carrara marble surface. Soft directional shadows, editorial lighting from above-left. Clean white background, ultra-sharp focus, studio quality. Shot overhead at 45 degrees.",
    "image-gen",
    ["product", "minimal", "luxury", "studio", "editorial"],
    "dalle",
  ),
  seed(
    "seed-img-3",
    "Coffee desk flat lay",
    "Overhead flat lay composition: MacBook Pro, ceramic pour-over coffee cup, open leather notebook with handwritten notes, small succulent in terracotta pot, AirPods case. Warm natural window light from the left. Minimal, editorial aesthetic.",
    "image-gen",
    ["flat lay", "lifestyle", "desk", "coffee", "minimal"],
    "midjourney",
  ),
  seed(
    "seed-img-4",
    "Abstract fluid art",
    "Abstract fluid pour art: swirling flows of deep ocean blue, molten gold, and pearl white. Ultra-high resolution macro photography perspective. Colors blending with sharp micro-detail at the edges. No bubbles. 8K resolution.",
    "image-gen",
    ["abstract", "art", "fluid", "macro", "blue"],
    "flux",
  ),
  seed(
    "seed-img-5",
    "Dark academia bookshelf",
    "Dark academia bookshelf scene: floor-to-ceiling leather-bound books, warm candlelight from antique brass holders, dust particles visible in the light. Deep shadows, rich mahogany tones. Shot on vintage Nikon 50mm f/1.2. Atmospheric, moody.",
    "image-gen",
    ["dark academia", "books", "moody", "vintage", "atmospheric"],
    "midjourney",
  ),

  // Social Media
  seed(
    "seed-social-1",
    "Instagram product caption",
    "Write an Instagram caption for [product]. Structure: open with a bold claim or unexpected observation (1 sentence), establish relatability (1-2 sentences), introduce the product naturally as the solution (1-2 sentences), end with a soft CTA. Tone: confident but approachable. No hashtag placeholder — write actual relevant hashtags at the end.",
    "social",
    ["instagram", "caption", "product", "cta"],
    "claude",
  ),
  seed(
    "seed-social-2",
    "TikTok hook variations",
    "Create 3 TikTok hook variations for [topic]: (1) a controversial or counterintuitive statement that challenges a common belief, (2) a surprising or little-known statistic, (3) a hyper-relatable pain point that makes the viewer feel seen. Each hook must be under 10 words and optimized for the first 1-3 seconds of watch time.",
    "social",
    ["tiktok", "hook", "viral", "opening"],
    "chatgpt",
  ),
  seed(
    "seed-social-3",
    "LinkedIn thought leadership",
    "Write a LinkedIn post about [achievement/lesson]. Structure: open with a moment of vulnerability or failure (2-3 sentences), transition to what you learned (3-4 sentences), share the specific framework or insight others can apply (3-4 sentences), close with a question that invites genuine responses. 150-200 words. No corporate speak.",
    "social",
    ["linkedin", "thought leadership", "storytelling", "professional"],
    "claude",
  ),
  seed(
    "seed-social-4",
    "Twitter thread starter",
    "Write a Twitter/X thread opening tweet for [topic]. Requirements: attention-grabbing first statement under 15 words, creates a strong curiosity gap that makes the reader need to see the rest, no clickbait — the thread must deliver on the promise. Provide 3 alternative opening tweets with different angles: stat-led, story-led, and controversy-led.",
    "social",
    ["twitter", "thread", "viral", "hook"],
    "chatgpt",
  ),
  seed(
    "seed-social-5",
    "Pinterest SEO description",
    "Write a Pinterest description for [pin/product]. Requirements: naturally incorporate 3-5 high-search keywords for [niche], conversational tone (not keyword-stuffed), includes a sensory or emotional hook in the first sentence, ends with a soft call to save or click. Under 150 characters for the primary description.",
    "social",
    ["pinterest", "seo", "description", "keywords"],
    "chatgpt",
  ),

  // Copywriting
  seed(
    "seed-copy-1",
    "PAS product description",
    "Write a product description for [product] using the PAS framework. Pain: identify the specific frustration or problem in language the customer would actually use. Agitate: deepen the pain — what happens if they keep ignoring it? Solution: introduce [product] as the logical resolution with 2 specific benefits. Under 100 words total. End with a single action CTA.",
    "copywriting",
    ["PAS", "product", "sales", "framework"],
    "claude",
  ),
  seed(
    "seed-copy-2",
    "Email subject line pack",
    "Generate 10 email subject lines for [topic/offer]. Include 2 each of: curiosity-gap (what they don't know), benefit-led (specific outcome), urgency/scarcity, question format, and personalized/segmented. Mark each with its type. Avoid spam triggers. Aim for 40-55 characters per line.",
    "copywriting",
    ["email", "subject line", "conversion", "copywriting"],
    "chatgpt",
  ),
  seed(
    "seed-copy-3",
    "Brand About page bio",
    "Write an About page for [creator/brand]. Three paragraphs: (1) who you are and your origin story — include a specific detail that makes it memorable, (2) your core philosophy or belief about [industry/niche] — what you stand for and against, (3) your unique value and who you serve best. Conversational, not corporate. First-person, present tense.",
    "copywriting",
    ["about page", "bio", "brand", "storytelling"],
    "claude",
  ),
  seed(
    "seed-copy-4",
    "High-converting CTA copy",
    "Write 8 high-converting CTA button alternatives for [action]. Avoid: Submit, Click Here, Get Started. Requirements: action-oriented verb, outcome-focused, 1-4 words max. Provide options across three categories: (A) value-led (what they gain), (B) transformation-led (how they change), (C) low-friction (feels easy and fast). Mark each.",
    "copywriting",
    ["CTA", "button", "conversion", "UX"],
    "chatgpt",
  ),

  // Video
  seed(
    "seed-video-1",
    "YouTube intro script",
    "Write a YouTube video intro script for [topic]. Structure: Hook (0-8 seconds): one arresting statement or question that speaks directly to the viewer's pain or desire — no 'welcome back' or channel name. Context bridge (8-20 seconds): establish why this matters right now. Promise (20-30 seconds): exactly what the viewer will know or be able to do by the end. High energy, zero filler words.",
    "video",
    ["youtube", "intro", "script", "hook"],
    "chatgpt",
  ),
  seed(
    "seed-video-2",
    "UGC product testimonial script",
    "Write a 45-second UGC-style testimonial video script for [product]. Format: natural talking-head, first-person. Structure: (1) relatable problem/pain without mentioning the product (5-8 seconds), (2) discovery moment — how you found [product], keep it organic (8-12 seconds), (3) specific result with a concrete detail or number (15-20 seconds), (4) soft recommendation (5-8 seconds). No corporate language. Read at natural speech pace.",
    "video",
    ["UGC", "testimonial", "script", "product"],
    "claude",
  ),
  seed(
    "seed-video-3",
    "Short-form b-roll shot list",
    "Create a 10-scene b-roll shot list for a short-form video about [topic]. For each scene specify: (1) exact subject and action, (2) camera angle (overhead, eye level, low angle, etc.), (3) movement (static, slow push, pull-back, pan), (4) duration (2-4 seconds), (5) visual metaphor or emotional beat it reinforces. Format as a numbered list. Sequence from broad establishing shots to close detail shots.",
    "video",
    ["b-roll", "shot list", "cinematography", "short-form"],
    "claude",
  ),

  // Research
  seed(
    "seed-research-1",
    "Market research analyst",
    "Act as a senior market research analyst for [product/niche]. Provide: (1) top 3 customer pain points with the emotional language they use to describe them, (2) primary buying motivators (functional, emotional, social), (3) top 3 objections and how successful competitors overcome them, (4) winning messaging angles and positioning gaps in the current market, (5) content formats and channels where this audience is most active and receptive. Format with clear headers.",
    "research",
    ["market research", "ICP", "messaging", "competitive"],
    "claude",
  ),
  seed(
    "seed-research-2",
    "ICP builder",
    "Build a detailed ideal customer profile (ICP) for [business/product]. Include: Demographics (age range, location, income, job title/life stage), Psychographics (values, beliefs, lifestyle markers), Digital behavior (platforms, content types, time spent online), Buying behavior (how they discover products, decision timeline, who influences them), Trigger moments (specific situations that make them ready to buy), and Dream outcome (the transformation they're really buying). Be specific and avoid generic descriptions.",
    "research",
    ["ICP", "customer profile", "segmentation", "marketing"],
    "claude",
  ),
  seed(
    "seed-research-3",
    "Content gap analysis",
    "Analyze the content landscape for [niche/topic] and identify content gaps. Provide: (1) top 5 questions people in this niche are asking that are underserved by current content, (2) angles or perspectives that are missing from mainstream coverage, (3) format gaps (questions better answered in video vs. written vs. visual), (4) audience segments within this niche whose needs aren't being addressed, (5) 10 specific content ideas addressing these gaps. Include search intent type for each idea.",
    "research",
    ["content strategy", "SEO", "gap analysis", "ideation"],
    "chatgpt",
  ),

  // Analysis
  seed(
    "seed-analysis-1",
    "Competitive analysis framework",
    "Perform a competitive analysis for [brand/product] vs. [competitor]. Analyze across: Positioning (how they describe themselves, core promise, tone of voice), Pricing strategy and tiers, Content strategy (platforms, formats, frequency, top-performing content), Audience targeting (who they go after and who they ignore), Visual identity and brand expression, Unique differentiators and potential weaknesses. End with 3 specific opportunities for [brand] to differentiate.",
    "analysis",
    ["competitive analysis", "strategy", "positioning", "brand"],
    "claude",
  ),
  seed(
    "seed-analysis-2",
    "Trend opportunity analysis",
    "Analyze the trend trajectory for [topic] in 2025. Structure: (1) current trend status (emerging/peaking/declining) with supporting evidence, (2) who is early-adopting and what that signals, (3) what's driving adoption (cultural, technological, economic), (4) what peak saturation will look like, (5) the contrarian opportunity — what to do when others are doing X, (6) 3 specific content or product angles to capitalize on this trend before peak. Be specific, not vague.",
    "analysis",
    ["trends", "opportunity", "timing", "strategy"],
    "chatgpt",
  ),

  // Code
  seed(
    "seed-code-1",
    "Code review checklist",
    "Review the following code for: (1) correctness bugs and edge cases, (2) security vulnerabilities (injection, XSS, CSRF, exposed secrets), (3) performance issues (unnecessary re-renders, N+1 queries, missing memoization), (4) readability and naming clarity, (5) missing error handling, (6) reuse opportunities and duplication. For each issue: state the problem, explain why it matters, suggest the fix. Rank by severity: Critical → High → Medium → Low.\n\n[paste code here]",
    "code",
    ["code review", "security", "performance", "quality"],
    "claude",
  ),
  seed(
    "seed-code-2",
    "Architecture decision record",
    "Help me write an Architecture Decision Record (ADR) for [technical decision]. Include: Context (what situation led to this decision, what problem it solves), Decision (what we chose and the exact approach), Rationale (why this over alternatives — be specific), Trade-offs accepted (what we're giving up), Alternatives considered (with brief reason for rejection), Consequences (what this enables, what becomes harder), Review trigger (conditions under which we'd revisit this).",
    "code",
    ["architecture", "ADR", "decision", "engineering"],
    "claude",
  ),

  // Creative
  seed(
    "seed-creative-1",
    "Brand story arc",
    "Write a brand origin story for [brand/creator] using the hero's journey arc. Structure: (1) ordinary world — who they were before, what life/work looked like, (2) the call — what problem or frustration forced a change, (3) the transformation — what they discovered or built, (4) the return — how they now help others make the same journey. Keep it human, specific, and emotionally true. 200-300 words. First-person voice.",
    "creative",
    ["brand story", "storytelling", "origin", "narrative"],
    "claude",
  ),
  seed(
    "seed-creative-2",
    "Newsletter concept generator",
    "Generate a newsletter concept for [creator/niche]. Provide: (1) a compelling newsletter name with a 5-word positioning line, (2) core editorial premise — the specific angle or point of view that makes it different, (3) recurring section ideas (3-4 sections per issue, each with a name and what it contains), (4) the one-sentence reason someone subscribes, (5) the ideal reader profile. Push past obvious ideas — the first one you think of is the one everyone has.",
    "creative",
    ["newsletter", "content strategy", "concept", "editorial"],
    "chatgpt",
  ),
];
