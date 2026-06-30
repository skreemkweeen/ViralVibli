import { NextRequest, NextResponse } from "next/server";
import type { EnhanceInput } from "@/lib/ai/types";
import { allEnhanceGoals } from "@/lib/ai/types";
import { getPrimaryTextProvider } from "@/lib/ai/registry";
import { ProviderError } from "@/lib/ai/types";

export async function POST(req: NextRequest) {
  let body: Partial<EnhanceInput>;
  try {
    body = (await req.json()) as Partial<EnhanceInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const input: EnhanceInput = {
    prompt,
    subject: typeof body.subject === "string" ? body.subject.trim() : "",
    goals: Array.isArray(body.goals)
      ? (body.goals as string[]).filter((g): g is (typeof allEnhanceGoals)[number] =>
          allEnhanceGoals.includes(g as (typeof allEnhanceGoals)[number]),
        )
      : allEnhanceGoals,
  };

  const provider = getPrimaryTextProvider();

  try {
    const result = await provider.enhance(input, req.signal);
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof ProviderError && !err.retryable ? 502 : 500;
    const message = err instanceof Error ? err.message : "Enhancement failed";
    return NextResponse.json({ error: message }, { status });
  }
}
