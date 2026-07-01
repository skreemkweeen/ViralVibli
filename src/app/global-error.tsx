"use client";

import { useEffect } from "react";
import { reporter } from "@/lib/observability";

/**
 * Last-resort boundary for errors thrown outside every RootLayout — usually a
 * bug in a Provider. Must render its own <html> and <body>. Tokens aren't
 * available here since globals.css may have failed to load; use inline styles.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reporter.captureException(error, {
      digest: error.digest,
      scope: "global",
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          background: "#0a0a0b",
          color: "#f5f5f3",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
            The workspace crashed
          </h1>
          <p style={{ color: "#a6a6ad", fontSize: 14, margin: "0 0 24px" }}>
            Something unexpected happened. Refreshing usually fixes it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#c8f04e",
              color: "#0a0a0b",
              padding: "10px 22px",
              borderRadius: 999,
              border: "none",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Reload workspace
          </button>
        </div>
      </body>
    </html>
  );
}
