"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { getAllToolsFlat, type FlatTool } from "@/data/tools";
import { usePreferencesStore } from "@/stores/preferences";
import { getIcon, IconArrowRight } from "@/components/icons";

const SESSION_KEY = "dmsuite-session-ts";

/**
 * "Welcome back" continuity prompt — shown on dashboard when the user returns
 * after being away (30+ min gap) and has a recent tool to continue with.
 * Dismissable per session.
 */
export default function SessionContinuity() {
  const [dismissed, setDismissed] = useState(true); // hidden by default until we check
  const recentIds = usePreferencesStore((s) => s.recentTools);

  const lastTool: FlatTool | null = useMemo(() => {
    if (recentIds.length === 0) return null;
    const all = getAllToolsFlat();
    const lookup = new Map(all.map((t) => [t.id, t]));
    return lookup.get(recentIds[0]) ?? null;
  }, [recentIds]);

  useEffect(() => {
    // Determine if user has been away long enough
    const lastTs = parseInt(sessionStorage.getItem(SESSION_KEY) ?? "0", 10);
    const now = Date.now();
    const gap = now - lastTs;
    // Show prompt if last session was >30 min ago (or never)
    if (lastTool && gap > 30 * 60 * 1000) {
      setDismissed(false);
    }
    sessionStorage.setItem(SESSION_KEY, now.toString());
  }, [lastTool]);

  if (dismissed || !lastTool) return null;

  const Icon = getIcon(lastTool.icon);

  return (
    <div className="mb-6 rounded-xl border border-primary-500/20 bg-primary-500/5 backdrop-blur-sm p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="size-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
        <Icon className="size-5 text-primary-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          Welcome back! Continue where you left off?
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
          You were working on <span className="text-primary-500 font-medium">{lastTool.name}</span>
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/tools/${lastTool.categoryId}/${lastTool.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600 transition-colors"
        >
          Continue
          <IconArrowRight className="size-3" />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="size-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
