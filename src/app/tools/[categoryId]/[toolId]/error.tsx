"use client";

import { useEffect } from "react";
import Link from "next/link";
import { IconRefresh } from "@/components/icons";

export default function ToolWorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Tool workspace error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-error/10 border border-error/20">
          <svg className="size-8 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
          This workspace hit a snag
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Something unexpected happened while loading this tool. You can try
          again or head back to the dashboard.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 h-10 px-5 bg-primary-500 text-gray-950 font-semibold rounded-xl hover:bg-primary-400 transition-colors shadow-lg shadow-primary-500/20"
          >
            <IconRefresh className="size-4" />
            Retry
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 h-10 px-5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {process.env.NODE_ENV === "development" && error?.message && (
          <details className="mt-6 text-left rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
            <summary className="text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer">
              Error Details
            </summary>
            <pre className="mt-3 text-xs text-error font-mono whitespace-pre-wrap break-words">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
