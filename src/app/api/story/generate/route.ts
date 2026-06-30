import { NextRequest, NextResponse } from "next/server";
import type { StoryRequest } from "@/lib/ai/types";
import { createStoryJob } from "@/lib/ai/jobs";

const VALID_COUNTS = [3, 4, 5, 6, 7, 8, 9, 10, 12, 15];

export async function POST(req: NextRequest) {
  let body: Partial<StoryRequest>;
  try {
    body = (await req.json()) as Partial<StoryRequest>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const brief = typeof body.brief === "string" ? body.brief.trim() : "";
  if (!brief) {
    return NextResponse.json({ error: "brief is required" }, { status: 400 });
  }

  const rawCount = typeof body.count === "number" ? body.count : 6;
  const count = VALID_COUNTS.includes(rawCount)
    ? rawCount
    : rawCount < 3
    ? 3
    : rawCount > 15
    ? 15
    : rawCount;

  const request: StoryRequest = {
    brief,
    subject: typeof body.subject === "string" ? body.subject.trim() : undefined,
    framework: typeof body.framework === "string" ? body.framework : "aida",
    platform: typeof body.platform === "string" ? body.platform : "instagram",
    count,
    voice: typeof body.voice === "string" ? body.voice : undefined,
    tone: typeof body.tone === "string" ? body.tone : undefined,
    hookStrength: typeof body.hookStrength === "string" ? body.hookStrength : undefined,
    visualDirection: typeof body.visualDirection === "string" ? body.visualDirection : undefined,
    ctaStyle: typeof body.ctaStyle === "string" ? body.ctaStyle : undefined,
    audience: typeof body.audience === "string" ? body.audience : undefined,
    goal: typeof body.goal === "string" ? body.goal : undefined,
  };

  const job = createStoryJob(request);
  return NextResponse.json(job, { status: 202 });
}
