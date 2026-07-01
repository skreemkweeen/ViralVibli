"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Sparkle,
  ArrowUp,
  Stop,
  X,
  Brain,
  Lightbulb,
  ArrowsClockwise,
  Question,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import {
  streamAssistantReply,
  type ChatMessage,
} from "@/lib/ai/client";
import { useWorkspaceContext } from "@/lib/context/workspace";
import { useAuth } from "@/lib/auth/auth-provider";
import { useWorkspace } from "@/lib/workspace/store";
import { appModules } from "@/lib/modules/registry";
import { tracker } from "@/lib/observability";

let counter = 0;
const uid = () => `d${++counter}-${Date.now()}`;

type QuickAction = {
  id: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  prompt: (ctx: { moduleName: string; brand: string }) => string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "brainstorm",
    label: "Brainstorm",
    hint: "New angles for what I'm working on",
    icon: <Lightbulb className="size-3.5" weight="fill" />,
    prompt: ({ moduleName, brand }) =>
      `I'm in ${moduleName} working for ${brand}. Give me five distinct creative angles I haven't tried yet. Each in one line.`,
  },
  {
    id: "rewrite",
    label: "Rewrite",
    hint: "Sharpen the current output",
    icon: <ArrowsClockwise className="size-3.5" weight="bold" />,
    prompt: ({ moduleName, brand }) =>
      `Rewrite my latest ${moduleName} draft in the ${brand} voice — tighter, more specific, more human. Keep the same intent.`,
  },
  {
    id: "critique",
    label: "Critique",
    hint: "Honest professional feedback",
    icon: <Brain className="size-3.5" weight="fill" />,
    prompt: ({ moduleName, brand }) =>
      `Give me a senior creative director's critique of my latest ${moduleName} work for ${brand}. Three specific things to change. No filler.`,
  },
  {
    id: "explain",
    label: "Explain",
    hint: "Why this is landing / not landing",
    icon: <Question className="size-3.5" weight="bold" />,
    prompt: ({ moduleName }) =>
      `Explain what makes a great ${moduleName} output work. Reference specific frameworks, then apply them to what I'm working on right now.`,
  },
];

function moduleFromPath(pathname: string): { id: string; name: string } {
  if (pathname.startsWith("/vision")) return { id: "vision", name: "Vision Studio" };
  if (pathname.startsWith("/story")) return { id: "story", name: "Story Studio" };
  if (pathname.startsWith("/vault")) return { id: "vault", name: "Prompt Vault" };
  if (pathname.startsWith("/assistant")) return { id: "assistant", name: "AI Assistant" };
  if (pathname.startsWith("/projects")) return { id: "projects", name: "Projects" };
  if (pathname.startsWith("/settings")) return { id: "settings", name: "Settings" };
  const registered = appModules.find((m) => pathname.startsWith(m.href));
  if (registered) return { id: registered.id, name: registered.name };
  return { id: "dashboard", name: "your workspace" };
}

/**
 * Persistent AI Dock — one component, mounted once by AppShell, available on
 * every authenticated route. Streams from the same /api/assistant/chat route
 * the full assistant uses, so context, cancellation, and abort semantics are
 * identical. Never duplicates infrastructure.
 */
export function AIDock({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { profile, recordActivity } = useWorkspace();
  const reduce = useReducedMotion();

  const brand =
    profile.brand !== "Your Brand" ? profile.brand : (user?.name ?? "your brand");
  const context = useWorkspaceContext(user?.name, brand, profile.voice);
  const currentModule = useMemo(() => moduleFromPath(pathname), [pathname]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [messages, reduce]);

  // Focus the composer on open
  useEffect(() => {
    if (open) requestAnimationFrame(() => textareaRef.current?.focus());
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

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

      const historyForApi = [...messages, userMsg];
      recordActivity("chat-sent", trimmed.slice(0, 60), "dock", pathname);
      tracker.track("ai_dock.message.sent", {
        module: currentModule.id,
        chars: trimmed.length,
      });

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
    [busy, messages, context, currentModule.id, pathname, recordActivity],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setBusy(false);
  }, []);

  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      const prompt = action.prompt({
        moduleName: currentModule.name,
        brand,
      });
      void send(prompt);
    },
    [brand, currentModule.name, send],
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim (mobile only — desktop keeps the workspace visible) */}
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />

          <motion.aside
            role="complementary"
            aria-label="AI Dock"
            initial={reduce ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: 24 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 z-[75] flex w-full max-w-[420px] flex-col border-l border-line bg-surface shadow-[0_20px_80px_-20px_rgba(0,0,0,0.6)]"
          >
            {/* Header */}
            <header className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-ink">
                  <Sparkle weight="fill" className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink">AI Dock</p>
                  <p className="truncate text-[11px] text-faint">
                    {currentModule.name} · thinks in {profile.voice}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close AI dock"
                className="grid size-8 cursor-pointer place-items-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <X className="size-4" />
              </button>
            </header>

            {/* Quick actions */}
            <div className="border-b border-line-soft px-4 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-faint">
                Quick actions
              </p>
              <div
                className="grid grid-cols-2 gap-1.5"
                role="group"
                aria-label="AI quick actions"
              >
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => handleQuickAction(action)}
                    disabled={busy}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-bg px-2.5 py-2 text-left transition-colors hover:border-faint hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    title={action.hint}
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded border border-line-soft bg-surface text-accent-fg">
                      {action.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-medium text-ink">
                        {action.label}
                      </span>
                      <span className="block truncate text-[10.5px] text-faint">
                        {action.hint}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation */}
            <div
              ref={scrollRef}
              role="log"
              aria-live="polite"
              aria-label="AI dock conversation"
              className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <span className="grid size-10 place-items-center rounded-xl border border-line bg-bg text-faint">
                    <MagnifyingGlass className="size-4" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-[13px] font-medium text-ink">
                      Ask anything from any studio
                    </p>
                    <p className="max-w-[240px] text-[11.5px] leading-relaxed text-muted">
                      The dock knows your brand, your voice, and where you are
                      in the app. Pick a quick action or type a request.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m) => (
                    <DockBubble key={m.id} message={m} reduce={reduce} />
                  ))}
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-line px-3 py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(input);
                }}
                className="flex items-end gap-2 rounded-xl border border-line bg-bg p-1.5 focus-within:border-faint"
              >
                <label className="sr-only" htmlFor="ai-dock-input">
                  Message the AI dock
                </label>
                <textarea
                  id="ai-dock-input"
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
                  placeholder="Ask, rewrite, critique, brainstorm…"
                  className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] text-ink placeholder:text-faint focus:outline-none"
                />
                {busy ? (
                  <button
                    type="button"
                    onClick={stop}
                    aria-label="Stop generation"
                    className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg bg-surface-2 text-ink transition-colors hover:bg-surface active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    <Stop weight="fill" className="size-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    aria-label="Send"
                    className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg bg-accent text-accent-ink transition-opacity hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                  >
                    <ArrowUp weight="bold" className="size-3.5" />
                  </button>
                )}
              </form>
              {error ? (
                <p role="alert" className="mt-1.5 text-center text-[11px] text-red-400">
                  {error}
                </p>
              ) : (
                <p className="mt-1.5 text-center text-[11px] text-faint">
                  ⌘J to toggle · Enter to send
                </p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function DockBubble({
  message,
  reduce,
}: {
  message: ChatMessage;
  reduce: boolean | null;
}) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={isUser ? "flex justify-end" : "flex gap-2.5"}
    >
      {!isUser && (
        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-accent text-accent-ink">
          <Sparkle weight="fill" className="size-3" />
        </span>
      )}
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-xl rounded-br-md bg-surface-2 px-3 py-2 text-[13px] leading-relaxed text-ink"
            : "max-w-[92%] text-[13px] leading-relaxed text-ink"
        }
      >
        {message.content ? (
          isUser ? (
            message.content
          ) : (
            <DockAssistantText text={message.content} />
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

function DockAssistantText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => (
        <p key={i} className={line === "" ? "h-2" : undefined}>
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
      className="inline-block size-1 rounded-full bg-faint"
      animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1, repeat: Infinity, delay }}
    />
  );
}

/** Persistent floating trigger — always visible when the dock is closed. */
export function AIDockTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open AI dock (Cmd+J)"
      title="Ask AI · ⌘J"
      className="fixed bottom-5 right-5 z-[60] grid size-12 cursor-pointer place-items-center rounded-full bg-accent text-accent-ink shadow-[0_10px_30px_-8px_rgba(200,240,78,0.5)] transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/30"
    >
      <Sparkle weight="fill" className="size-5" />
    </button>
  );
}
