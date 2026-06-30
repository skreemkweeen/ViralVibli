import type { NextRequest } from "next/server";
import type { WorkspaceContext } from "@/lib/context/workspace";

type AssistantMessage = { role: "user" | "assistant"; content: string };
type ChatBody = { messages: AssistantMessage[]; context?: WorkspaceContext };

function buildSystemPrompt(ctx: WorkspaceContext | undefined): string {
  const lines: string[] = [
    "You are the AI creative assistant for ViralVibli — an intelligent creative partner for social media creators, not a generic chatbot.",
    "",
    "## Your Role",
    "- Draft and refine captions, hooks, CTAs, and copy for any platform",
    "- Plan content calendars, campaign sequences, and posting schedules",
    "- Generate story structures, narrative arcs, and video scripts",
    "- Suggest and refine AI prompts for image and video generators",
    "- Analyze ideas and provide strategic creative direction",
    "",
    "## How to Respond",
    "- Be direct and creative. Deliver the content immediately — never ask for more information before producing something.",
    "- Match the creator's brand voice. Keep responses concise and actionable.",
    "- End most responses with a single follow-up offer that takes the work further.",
    "- Format with markdown when it helps (lists, bold key terms), but don't over-structure short answers.",
    "- When the creator asks for a campaign or multi-platform strategy, connect across content types: caption + story + prompt + image direction.",
  ];

  if (ctx?.userName || ctx?.brand) {
    lines.push("", "## Creator");
    if (ctx.userName) lines.push(`Name: ${ctx.userName}`);
    if (ctx.brand) lines.push(`Brand: ${ctx.brand}`);
    if (ctx.voice) lines.push(`Voice: ${ctx.voice}`);
  }

  if (ctx?.pinnedPrompts?.length) {
    lines.push("", "## Pinned Prompts (their go-to creative tools)");
    for (const p of ctx.pinnedPrompts) {
      lines.push(`- **${p.title}**: ${p.content}`);
    }
  } else if (ctx?.recentPrompts?.length) {
    lines.push("", "## Recent Prompts from their Vault");
    for (const p of ctx.recentPrompts) {
      lines.push(`- **${p.title}**: ${p.content}`);
    }
  }

  if (ctx?.vaultCount && ctx.vaultCount > 0) {
    lines.push(``, `The creator has ${ctx.vaultCount} prompts saved in their Vault.`);
  }

  return lines.join("\n");
}

function localStream(messages: AssistantMessage[]): Response {
  const last = messages.at(-1)?.content?.toLowerCase() ?? "";
  let response: string;

  if (last.includes("caption") || last.includes("post")) {
    response = `Here's a caption:\n\n"Some things are worth slowing down for. Meet the piece your space has been missing — made by hand, built to last."\n\nWant three more in different lengths, or a hook-first version for Reels?`;
  } else if (last.includes("plan") || last.includes("calendar") || last.includes("week") || last.includes("schedule")) {
    response = `Here's a simple week:\n\n**Monday** — Behind-the-scenes story, soft sell\n**Wednesday** — Carousel teaching one thing your audience gets wrong\n**Friday** — Single hero shot with a short, confident caption\n\nWhich one should I draft first?`;
  } else if (last.includes("hook") || last.includes("idea") || last.includes("reel")) {
    response = `Three hooks you can use right now:\n\n1. "I stopped doing this, and everything changed."\n2. "The part nobody tells you about starting."\n3. "Save this before your next launch."\n\nWant me to build a full Reel script around one of them?`;
  } else if (last.includes("prompt") || last.includes("image") || last.includes("midjourney") || last.includes("generate")) {
    response = `Here's a refined image prompt:\n\n*"Cinematic close-up of handcrafted ceramic vessel, morning light raking across the surface texture, warm film grain, f/1.8, shot on 35mm"*\n\nWant variations for different moods, or a Midjourney-optimized version with style parameters?`;
  } else if (last.includes("story") || last.includes("sequence") || last.includes("script")) {
    response = `Here's a 3-slide story sequence:\n\n**Slide 1 — Hook:** "You've been doing this wrong."\n**Slide 2 — Reveal:** Show the better way with a quick demo or visual contrast.\n**Slide 3 — CTA:** "Save this for your next shoot → link in bio"\n\nWant a full 5-slide build-out, or a different opening hook?`;
  } else if (last.includes("campaign") || last.includes("launch")) {
    response = `Here's a launch week framework:\n\n**Day 1 — Tease:** Behind-the-scenes clip, no reveal yet\n**Day 3 — Build:** Story sequence walking through the product story\n**Day 5 — Launch:** Hero image + caption with early-access link\n**Day 7 — Social proof:** Share first reactions or UGC\n\nWant me to draft the captions and story scripts for each day?`;
  } else {
    response = `Got it. Here's how I'd approach this:\n\nLead with one clear idea in the first line. Back it up with a specific detail that builds credibility. End with an invitation, not a hard sell.\n\nTell me the platform and the goal and I'll draft the first version right now.`;
  }

  const encoder = new TextEncoder();
  const words = response.match(/\S+\s*/g) ?? [response];

  const stream = new ReadableStream({
    async start(controller) {
      for (const word of words) {
        await new Promise<void>((r) => setTimeout(r, 18 + Math.random() * 28));
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text: word })}\n\n`),
        );
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function POST(req: NextRequest) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, context } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return localStream(messages);
  }

  const systemPrompt = buildSystemPrompt(context);

  let anthropicRes: Response;
  try {
    anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        stream: true,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
  } catch {
    return localStream(messages);
  }

  if (!anthropicRes.ok || !anthropicRes.body) {
    return localStream(messages);
  }

  const encoder = new TextEncoder();
  const body_ = anthropicRes.body;

  const readable = new ReadableStream({
    async start(controller) {
      const reader = body_.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") continue;

            try {
              const event = JSON.parse(raw) as {
                type: string;
                delta?: { type: string; text?: string };
              };
              if (
                event.type === "content_block_delta" &&
                event.delta?.type === "text_delta" &&
                event.delta.text
              ) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ text: event.delta.text })}\n\n`,
                  ),
                );
              }
            } catch {
              // skip malformed SSE events
            }
          }
        }
      } catch {
        // stream interrupted
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
