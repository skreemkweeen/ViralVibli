export type Framework = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  beats: string[];
  promptHint: string;
};

/**
 * Modular storytelling framework library.
 * Adding a new framework requires only a new entry here — zero architectural changes.
 */
export const frameworks: Framework[] = [
  {
    id: "aida",
    name: "AIDA",
    tagline: "Attention → Interest → Desire → Action",
    description: "The classic marketing funnel compressed into a tight story sequence.",
    beats: [
      "Slide 1: Attention — pattern interrupt, bold statement, or surprising hook",
      "Slides 2–3: Interest — build context, share the WHY this matters",
      "Slides 4–5: Desire — show the transformation, outcome, or social proof",
      "Final slide: Action — one clear, compelling CTA",
    ],
    promptHint:
      "First slide must command attention before anything else. Middle slides build genuine desire. Final slide is one focused CTA — never two.",
  },
  {
    id: "pas",
    name: "PAS",
    tagline: "Problem → Agitate → Solution",
    description: "Meet the audience at their pain, amplify it, then deliver relief.",
    beats: [
      "Slide 1: Problem — name the exact pain point the audience feels",
      "Slides 2–3: Agitate — make the problem vivid, urgent, personal",
      "Slides 4–5: Solution — introduce the answer with clarity and conviction",
      "Final slide: CTA — invite them to act on the solution",
    ],
    promptHint:
      "The agitation slides should feel uncomfortable before the solution arrives. Avoid rushing to relief too early.",
  },
  {
    id: "bab",
    name: "Before / After / Bridge",
    tagline: "Show the transformation",
    description: "Contrast the old state with the new, then bridge the gap.",
    beats: [
      "Slides 1–2: Before — establish the painful or unfulfilling 'before' state",
      "Slides 3–4: After — paint a vivid, desirable 'after' state",
      "Slides 5+: Bridge — introduce the mechanism that makes the transformation possible",
      "Final slide: CTA — direct them to the bridge",
    ],
    promptHint:
      "Make the 'before' feel real and relatable — not a cartoon villain version. The 'after' should feel achievable, not fantasy.",
  },
  {
    id: "heros-journey",
    name: "Hero's Journey",
    tagline: "Ordinary → Challenge → Transformation",
    description: "The creator is the hero. The audience follows their journey.",
    beats: [
      "Slide 1: The ordinary world — where the hero started",
      "Slide 2: The call to adventure — the problem or opportunity that changed everything",
      "Slides 3–4: Trials — the real struggles and lessons along the way",
      "Slide 5+: Transformation — who they are now and what they know",
      "Final slide: The gift — the insight or tool the audience can use too",
    ],
    promptHint:
      "Make the creator the hero, not the product. The product is the mentor or tool that enabled the journey.",
  },
  {
    id: "curiosity-gap",
    name: "Curiosity Gap",
    tagline: "Open a loop. Don't close it until the last slide.",
    description: "Create an irresistible information gap that pulls viewers through every slide.",
    beats: [
      "Slide 1: Tease — hint at the answer without revealing it",
      "Slides 2–4: Layer clues — build anticipation, drop partial answers",
      "Slide 5+: More layers — deepen the mystery or add surprising twists",
      "Final slide: The payoff — close the loop with the satisfying reveal",
    ],
    promptHint:
      "Every slide should increase the viewer's need to know the answer. Never reveal it prematurely. The payoff must be worth the wait.",
  },
  {
    id: "open-loop",
    name: "Open Loop",
    tagline: "Start a story. Finish it last.",
    description: "Begin a narrative that won't resolve until the final slide.",
    beats: [
      "Slide 1: Start in the middle — drop into an interesting moment",
      "Slides 2–4: Context and stakes — fill in just enough background to care",
      "Slides 5+: Rising tension — things get more complicated or revealing",
      "Final slide: Resolution — close the loop, deliver the lesson or outcome",
    ],
    promptHint:
      "The story must feel genuinely unresolved until the final slide. Each slide earns the next tap.",
  },
  {
    id: "social-proof",
    name: "Social Proof",
    tagline: "Others have tried it. Here's what happened.",
    description: "Use real results, testimonials, and data to lower resistance.",
    beats: [
      "Slide 1: Bold claim — state a result that feels surprising or significant",
      "Slides 2–3: The evidence — specific numbers, screenshots, or stories",
      "Slides 4–5: Pattern — show it's not a fluke; multiple people, data points",
      "Final slide: Invitation — position the audience as the next success story",
    ],
    promptHint:
      "Specificity beats generality every time. Use real numbers, real timelines, real names where possible.",
  },
  {
    id: "problem-solution",
    name: "Problem → Solution",
    tagline: "Diagnose, then prescribe.",
    description: "A clean, logical flow from identifying the problem to solving it.",
    beats: [
      "Slide 1: Name the problem precisely",
      "Slides 2–3: Diagnose why it happens",
      "Slides 4–5: Present the solution with steps or principles",
      "Final slide: CTA — take the first step toward the solution",
    ],
    promptHint:
      "Be surgical about the problem diagnosis. Audiences trust someone who understands their problem in more detail than they do.",
  },
  {
    id: "educational",
    name: "Educational",
    tagline: "Teach something worth knowing.",
    description: "Pure value delivery — position as an expert by educating.",
    beats: [
      "Slide 1: Promise — tell them exactly what they'll learn",
      "Slides 2–N: Teach — one clear point per slide, in logical order",
      "Final slide: Summary + CTA — reinforce the key lesson and direct the next step",
    ],
    promptHint:
      "Each teaching slide should have one point, simply expressed. If it can't be said simply, it hasn't been understood yet.",
  },
  {
    id: "launch",
    name: "Launch Sequence",
    tagline: "Build hype. Release. Convert.",
    description: "The optimal story arc for a product or content launch.",
    beats: [
      "Slide 1: Teaser — hint at what's coming without revealing everything",
      "Slides 2–3: Build anticipation — WHY this matters, WHY now",
      "Slides 4–5: Reveal — introduce the product/offer with full energy",
      "Final slide: Hard CTA — time-sensitive, direct, urgent",
    ],
    promptHint:
      "Launch energy is different from everyday energy — it's celebratory and urgent at the same time.",
  },
  {
    id: "behind-brand",
    name: "Behind the Brand",
    tagline: "Show, don't sell.",
    description: "Invite the audience behind the curtain to build deep trust.",
    beats: [
      "Slide 1: The invitation — why you're pulling back the curtain",
      "Slides 2–3: The reality — honest, unfiltered, behind-the-scenes moments",
      "Slides 4–5: The values — what drives the decisions you make",
      "Final slide: The connection — invite them into the story",
    ],
    promptHint:
      "Authenticity requires showing the imperfect parts. Sanitised 'behind the scenes' content reads as PR. Go real.",
  },
  {
    id: "day-in-life",
    name: "Day in the Life",
    tagline: "Invite them into your world.",
    description: "A chronological window into a typical (or extraordinary) day.",
    beats: [
      "Slide 1: Morning moment — grounding, honest, sets the tone",
      "Slides 2–4: The day unfolds — work, decisions, small revealing moments",
      "Slides 5+: Evening reflection — what mattered, what they learned",
      "Final slide: The takeaway — one thing the audience can apply",
    ],
    promptHint:
      "The best Day in the Life content reveals personality through small, specific, unexpected details — not the highlights.",
  },
  {
    id: "storybrand",
    name: "StoryBrand",
    tagline: "Character → Problem → Guide → Plan → CTA → Success / Failure",
    description: "Donald Miller's 7-part framework. The audience is the hero; you are the guide.",
    beats: [
      "Slide 1: The hero (the audience) and what they want",
      "Slide 2: The problem — external, internal, and philosophical",
      "Slide 3: You as the guide — empathy + authority in one line",
      "Slides 4–5: The plan — 3 clear steps",
      "Slide 6: The call to action — direct + transitional CTAs",
      "Final slide: The stakes — success if they act, failure if they don't",
    ],
    promptHint:
      "Never make yourself the hero. The audience is the hero; you are Yoda. Show empathy first, authority second.",
  },
  {
    id: "emotional-arc",
    name: "Emotional Arc",
    tagline: "Take them on a feeling journey",
    description: "Structured emotional beats: setup → tension → catharsis.",
    beats: [
      "Slide 1: Emotional grounding — establish the feeling",
      "Slides 2–3: Rising tension — introduce conflict or vulnerability",
      "Slide 4: The turning point — pivot or realisation",
      "Slides 5+: Catharsis — release, insight, or triumph",
      "Final slide: The takeaway feeling — what they carry with them",
    ],
    promptHint:
      "Name the feeling explicitly at least once. Emotional arcs die when they stay abstract.",
  },
  {
    id: "educational-ladder",
    name: "Educational Ladder",
    tagline: "Beginner → Intermediate → Advanced",
    description: "Ladder up complexity so beginners and experts both learn something.",
    beats: [
      "Slide 1: The rung 1 promise — 'here's what most people know'",
      "Slides 2–3: Rung 2 — 'here's what smart people know'",
      "Slides 4–5: Rung 3 — 'here's what pros know'",
      "Final slide: The bridge — apply the highest rung to their situation",
    ],
    promptHint:
      "Every rung must feel like earned insight — not just a longer word for the same idea.",
  },
  {
    id: "documentary",
    name: "Documentary",
    tagline: "Real footage, real feelings, real conclusion",
    description: "Long-form storytelling that reads as journalism.",
    beats: [
      "Slide 1: The subject — introduce a specific person, place, or moment",
      "Slides 2–3: The context — the wider world around the subject",
      "Slides 4–5: The conflict or question the piece is investigating",
      "Slides 6+: Revelation — what the reporting uncovered",
      "Final slide: The reflection — what it means for the viewer",
    ],
    promptHint:
      "Documentaries earn attention with specificity — a name, a place, a date. Never speak in generalities.",
  },
  {
    id: "mini-vlog",
    name: "Mini Vlog",
    tagline: "Casual, kinetic, first-person",
    description: "A short, energetic personal story with three beats.",
    beats: [
      "Slide 1: The setup — 'okay so today I…'",
      "Slides 2–3: The moment — what happened, told with texture",
      "Slide 4: The twist or takeaway",
      "Final slide: The invite — 'let me know if you want part 2'",
    ],
    promptHint:
      "Mini vlogs feel real when they include the mundane friction — not just the highlights.",
  },
];

export function getFramework(id: string): Framework | undefined {
  return frameworks.find((f) => f.id === id);
}
