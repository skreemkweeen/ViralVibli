import type { EnhanceGoal } from "@/lib/ai/types";
import { allEnhanceGoals } from "@/lib/ai/types";

export type { EnhanceGoal };

export async function enhancePrompt(
  prompt: string,
  subject: string,
  goals: EnhanceGoal[] = allEnhanceGoals,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("/api/vision/enhance", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, subject, goals }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: "Enhancement failed" }))) as {
      error?: string;
    };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  const data = (await res.json()) as { prompt: string };
  return data.prompt;
}
