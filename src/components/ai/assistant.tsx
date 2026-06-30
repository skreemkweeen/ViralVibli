"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkle, Stop } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import {
  streamAssistantReply,
  starterPrompts,
  type ChatMessage,
} from "@/lib/ai/client";
import { useAuth } from "@/lib/auth/auth-provider";

let counter = 0;
const uid = () => `m${++counter}-${Date.now()}`;

export function Assistant() {
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cancelled = useRef(false);

  const brand = {
    brand: user?.name ?? "your brand",
    voice: "calm, warm",
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [messages, reduce]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const userMsg: ChatMessage = { id: uid(), role: "user", content: trimmed };
    const replyId = uid();
    setMessages((m) => [
      ...m,
      userMsg,
      { id: replyId, role: "assistant", content: "" },
    ]);
    setInput("");
    setBusy(true);
    cancelled.current = false;

    for await (const chunk of streamAssistantReply(trimmed, brand)) {
      if (cancelled.current) break;
      setMessages((m) =>
        m.map((msg) =>
          msg.id === replyId
            ? { ...msg, content: msg.content + chunk }
            : msg,
        ),
      );
    }
    setBusy(false);
  }

  const empty = messages.length === 0;

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col">
      {/* messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-ink">
              <Sparkle weight="fill" className="size-7" />
            </span>
            <h1 className="mt-6 text-[clamp(1.6rem,4vw,2.2rem)] font-semibold tracking-[-0.02em]">
              What are we making today?
            </h1>
            <p className="mt-2 max-w-sm text-[15px] text-muted">
              I know {brand.brand} and how you sound. Ask for a draft, a plan, or
              a second opinion.
            </p>
            <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
              {starterPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-xl border border-line bg-surface px-4 py-3 text-left text-[14px] text-muted transition-colors hover:border-faint hover:text-ink"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-6 py-2">
            {messages.map((m) => (
              <Bubble key={m.id} message={m} reduce={reduce} />
            ))}
          </div>
        )}
      </div>

      {/* composer */}
      <div className="mx-auto w-full max-w-2xl pt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 focus-within:border-faint"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Message your assistant..."
            className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] text-ink placeholder:text-faint focus:outline-none"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => (cancelled.current = true)}
              aria-label="Stop"
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink"
            >
              <Stop weight="fill" className="size-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send"
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink transition-opacity disabled:opacity-40"
            >
              <ArrowUp weight="bold" className="size-4" />
            </button>
          )}
        </form>
        <p className="mt-2 text-center text-[12px] text-faint">
          Responses are generated. Review before publishing.
        </p>
      </div>
    </div>
  );
}

function Bubble({
  message,
  reduce,
}: {
  message: ChatMessage;
  reduce: boolean | null;
}) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={isUser ? "flex justify-end" : "flex gap-3"}
    >
      {!isUser && (
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-ink">
          <Sparkle weight="fill" className="size-4" />
        </span>
      )}
      <div
        className={
          isUser
            ? "max-w-[80%] rounded-2xl rounded-br-md bg-surface-2 px-4 py-2.5 text-[15px] text-ink"
            : "max-w-[88%] whitespace-pre-wrap text-[15px] leading-relaxed text-ink"
        }
      >
        {message.content || (
          <span className="inline-flex gap-1 align-middle">
            <Dot reduce={reduce} delay={0} />
            <Dot reduce={reduce} delay={0.15} />
            <Dot reduce={reduce} delay={0.3} />
          </span>
        )}
      </div>
    </motion.div>
  );
}

function Dot({ reduce, delay }: { reduce: boolean | null; delay: number }) {
  return (
    <motion.span
      className="inline-block size-1.5 rounded-full bg-faint"
      animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1, repeat: Infinity, delay }}
    />
  );
}
