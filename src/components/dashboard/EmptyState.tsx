"use client";

import { type ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

/**
 * Shared empty-state illustration card for dashboard sections.
 * Shows a soft icon, message, and optional CTA when a section has no data.
 */
export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6 rounded-2xl border border-dashed border-gray-300/40 dark:border-white/[0.06] bg-white/30 dark:bg-gray-900/20 backdrop-blur-sm">
      <div className="size-14 rounded-2xl bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
