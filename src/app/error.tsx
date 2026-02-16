"use client";

import { useEffect } from "react";
import Link from "next/link";
import { IconRefresh } from "@/components/icons";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting (Sentry, etc.) when configured
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center max-w-md">
        <div className="relative mb-6">
          <span className="text-8xl sm:text-9xl font-black text-gray-200 dark:text-gray-800 select-none">
            500
          </span>
          <span className="absolute inset-0 flex items-center justify-center text-8xl sm:text-9xl font-black text-error/20">
            500
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
          Something went wrong
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          An unexpected error occurred. Our team has been notified.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 h-10 px-5 bg-primary-500 text-gray-950 font-semibold rounded-xl hover:bg-primary-400 transition-colors shadow-lg shadow-primary-500/20"
          >
            <IconRefresh className="size-4" />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 h-10 px-5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Go Home
          </Link>
        </div>

        {process.env.NODE_ENV === "development" && error?.message && (
          <details className="mt-8 text-left rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
            <summary className="text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer">
              Error Details
            </summary>
            <pre className="mt-3 text-xs text-error font-mono whitespace-pre-wrap wrap-break-word">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
