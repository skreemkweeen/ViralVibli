import type { WorkspaceContext } from "@/lib/context/workspace";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type { WorkspaceContext };

export async function* streamAssistantReply(
  messages: ChatMessage[],
  context: WorkspaceContext,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  let res: Response;

  try {
    res = await fetch("/api/assistant/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        context,
      }),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
    yield "Connection error. Please try again.";
    return;
  }

  if (!res.ok || !res.body) {
    yield "Something went wrong. Please try again.";
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (signal?.aborted) break;

      buf += decoder.decode(value, { stream: true });
      const chunks = buf.split("\n\n");
      buf = chunks.pop() ?? "";

      for (const chunk of chunks) {
        if (!chunk.startsWith("data: ")) continue;
        const raw = chunk.slice(6).trim();
        if (raw === "[DONE]") return;

        try {
          const { text } = JSON.parse(raw) as { text?: string };
          if (text) yield text;
        } catch {
          // ignore parse errors
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export const starterPrompts = [
  "Write a launch caption for Instagram",
  "Give me three hooks for a Reel",
  "Plan my posting week",
  "Draft a story sequence for a product reveal",
  "Refine an image prompt for Midjourney",
  "Build a campaign for a new product launch",
];
