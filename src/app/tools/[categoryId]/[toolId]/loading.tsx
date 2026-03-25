"use client";

/**
 * Workspace loading skeleton — shown while the dynamic workspace component loads.
 * Mimics the workspace header + a content area with pulse animation.
 */
export default function ToolWorkspaceLoading() {
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-950 animate-pulse">
      {/* Header skeleton */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-950 flex items-center gap-3 px-4">
        <div className="size-6 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="h-3.5 w-32 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="size-8 rounded-full bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>

      {/* Toolbar skeleton */}
      <div className="h-10 border-b border-gray-200 dark:border-gray-800/40 flex items-center gap-2 px-4">
        <div className="h-6 w-20 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-6 w-20 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-6 w-20 rounded bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Content skeleton */}
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="h-40 rounded-xl bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  );
}
