"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors for inspection
    console.error("[DevDash App Error Boundary]", error);
  }, [error]);

  return (
    <div className="flex-1 min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 bg-canvas text-ink">
      <div className="w-full max-w-md p-8 rounded-xl bg-surface-1 border border-semantic-error/30 shadow-2xl text-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-semantic-error/10 border border-semantic-error/20 flex items-center justify-center mx-auto text-semantic-error">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-[-0.6px] text-ink">
            Something went wrong
          </h2>
          <p className="text-xs text-ink-muted leading-relaxed">
            An unexpected error occurred while rendering this view. Your data is
            safe and the system recorded the event.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 rounded-lg bg-surface-2 border border-hairline text-left text-xs font-mono text-ink-subtle overflow-x-auto max-h-32">
            <code>{error.message}</code>
          </div>
        )}

        <div className="pt-2 flex items-center justify-center gap-2.5">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-tight shadow-sm shadow-primary/25 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-ink-tertiary" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
