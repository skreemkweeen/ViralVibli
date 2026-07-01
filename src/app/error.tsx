"use client";

import { useEffect } from "react";
import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { reporter } from "@/lib/observability";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reporter.captureException(error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <span className="grid size-14 place-items-center rounded-2xl border border-red-500/30 bg-red-500/[0.06] text-red-400">
        <WarningCircle weight="fill" className="size-6" />
      </span>
      <div className="space-y-1.5">
        <h2 className="text-[18px] font-semibold text-ink">
          Something went wrong on this page
        </h2>
        <p className="max-w-md text-[14px] text-muted">
          The rest of your workspace is still fine. Try again, or head back to
          the dashboard.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[11px] text-faint">
            ref {error.digest}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={reset} size="md">
          <ArrowClockwise weight="bold" className="size-4" />
          Try again
        </Button>
        <Button href="/dashboard" variant="ghost" size="md">
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
