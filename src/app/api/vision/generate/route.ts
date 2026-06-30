import { NextRequest, NextResponse } from "next/server";
import type { ImageRequest } from "@/lib/ai/types";
import { createJob } from "@/lib/ai/jobs";

export async function POST(req: NextRequest) {
  let body: Partial<ImageRequest>;
  try {
    body = (await req.json()) as Partial<ImageRequest>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const request: ImageRequest = {
    prompt,
    aspect: typeof body.aspect === "string" ? body.aspect : "4:5",
    count: typeof body.count === "number" ? Math.min(Math.max(body.count, 1), 4) : 3,
    seed: typeof body.seed === "number" ? body.seed : undefined,
    quality: typeof body.quality === "string" ? body.quality : "high",
  };

  const job = createJob(request);
  return NextResponse.json(job, { status: 202 });
}
