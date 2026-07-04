"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { Wordmark } from "@/components/site/wordmark";

/**
 * Demo sign-in. With no auth vendor configured this routes straight into the
 * workspace. CLERK SEAM: render Clerk's <SignIn /> here (or set this route as
 * Clerk's signInUrl) when keys are configured; see docs/auth.md.
 */
export default function SignInPage() {
  const router = useRouter();

  return (
    <main className="relative flex min-h-dvh items-center justify-center px-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 size-[520px] -translate-x-1/2 rounded-full opacity-[0.12] blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, var(--color-accent) 0%, transparent 65%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-[13px] text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          Back home
        </Link>

        <div className="rounded-2xl border border-line bg-surface p-8">
          <Wordmark />
          <h1 className="mt-6 text-[22px] font-semibold tracking-[-0.02em]">
            Welcome back
          </h1>
          <p className="mt-1.5 text-[14px] text-muted">
            Sign in to your workspace, or start free.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push("/dashboard");
            }}
            className="mt-6 space-y-3"
          >
            <label className="block">
              <span className="mb-1.5 block text-[13px] text-muted">Email</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@studio.com"
                className="h-11 w-full rounded-xl border border-line bg-bg px-3.5 text-[14px] text-ink placeholder:text-faint focus:border-faint focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] text-muted">
                Password
              </span>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-line bg-bg px-3.5 text-[14px] text-ink placeholder:text-faint focus:border-faint focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="h-11 w-full rounded-full bg-accent text-[14px] font-medium text-accent-ink transition-colors hover:bg-[#d6f56b]"
            >
              Continue
            </button>
          </form>

          <p className="mt-5 text-center text-[13px] text-faint">
            New here?{" "}
            <button
              onClick={() => router.push("/dashboard")}
              className="text-accent-fg hover:underline"
            >
              Start free
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
