"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Sparkle,
  Stop,
  Brain,
  Vault,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import {
  streamAssistantReply,
  starterPrompts,
  type ChatMessage,
} from "@/lib/ai/client";
import { useWorkspaceContext } from "@/lib/context/workspace";
import { useAuth } from "@/lib/auth/auth-provider";

let counter = 0;
const uid = () => `m${++counter}-${Date.now()}`;

export function Assistant() {
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const context = useWorkspaceContext(
    user?.name,
    user?.name ?? "your brand",
    "calm, warm",
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [messages, reduce]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setError(null);

      const userMsg: ChatMessage = { id: uid(), role: "user", content: trimmed };
      const replyId = uid();

      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: replyId, role: "assistant", content: "" },
      ]);
      setInput("");
      setBusy(true);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Snapshot messages before adding the placeholder
      const historyForApi = [...messages, userMsg];

      try {
        for await (const chunk of streamAssistantReply(
          historyForApi,
          context,
          controller.signal,
        )) {
          if (controller.signal.aborted) break;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === replyId ? { ...m, content: m.content + chunk } : m,
            ),
          );
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyId && !m.content
              ? { ...m, content: "Something went wrong. Please try again." }
              : m,
          ),
        );
        setError("Reply failed");
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, context],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setBusy(false);
  }, []);

  const empty = messages.length === 0;

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col">
      {/* scroll container */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {empty ? (
          <EmptyState
            userName={user?.name ?? "Creator"}
            context={context}
            onPrompt={send}
            reduce={reduce}
          />
        ) : (
          <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
            {messages.map((m) => (
              <Bubble key={m.id} message={m} reduce={reduce} />
            ))}
          </div>
        )}
      </div>

      {/* composer */}
      <div className="mx-auto w-full max-w-2xl px-4 pb-4 pt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 focus-within:border-faint"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            placeholder="Ask anything, get content instantly..."
            className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] text-ink placeholder:text-faint focus:outline-none"
          />
          {busy ? (
            <button
              type="button"
              onClick={stop}
              aria-label="Stop generation"
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink transition-colors hover:bg-surface"
            >
              <Stop weight="fill" className="size-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message"
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink transition-opacity disabled:opacity-40"
            >
              <ArrowUp weight="bold" className="size-4" />
            </button>
          )}
        </form>
        {error ? (
          <p className="mt-2 text-center text-[12px] text-red-400">{error}</p>
        ) : (
          <p className="mt-2 text-center text-[12px] text-faint">
            Responses are AI-generated. Review before publishing.
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  userName,
  context,
  onPrompt,
  reduce,
}: {
  userName: string;
  context: ReturnType<typeof useWorkspaceContext>;
  onPrompt: (text: string) => void;
  reduce: boolean | null;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <motion.span
        initial={reduce ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="grid size-16 place-items-center rounded-2xl bg-accent text-accent-ink"
      >
        <Sparkle weight="fill" className="size-8" />
      </motion.span>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="mt-6 text-[clamp(1.5rem,4vw,2rem)] font-semibold tracking-[-0.02em]">
          What are we making today?
        </h1>
        <p className="mt-2 max-w-sm text-[15px] text-muted">
          Your creative partner for {userName}. Ask for a draft, a plan, a hook,
          or a full campaign.
        </p>

        {/* Workspace context pill */}
        {(context.vaultCount !== undefined || context.pinnedPrompts?.length) && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {context.vaultCount !== undefined && context.vaultCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[12px] text-faint">
                <Vault className="size-3" />
                {context.vaultCount} prompts in Vault
              </span>
            )}
            {context.pinnedPrompts && context.pinnedPrompts.length > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[12px] text-faint">
                <Brain className="size-3" />
                {context.pinnedPrompts.length} pinned prompt{context.pinnedPrompts.length !== 1 ? "s" : ""} loaded
              </span>
            )}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {starterPrompts.map((p) => (
          <button
            key={p}
            onClick={() => onPrompt(p)}
            className="rounded-xl border border-line bg-surface px-4 py-3 text-left text-[14px] text-muted transition-colors hover:border-faint hover:text-ink"
          >
            {p}
          </button>
        ))}
      </motion.div>
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
            : "max-w-[88%] text-[15px] leading-relaxed text-ink"
        }
      >
        {message.content ? (
          isUser ? (
            message.content
          ) : (
            <AssistantText text={message.content} />
          )
        ) : (
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

function AssistantText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => (
        <p key={i} className={line === "" ? "h-3" : undefined}>
          {renderInline(line)}
        </p>
      ))}
    </div>
  );
}

function renderInline(line: string): React.ReactNode {
  const parts = line.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
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
