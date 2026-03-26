"use client";

import { useState, useEffect, useMemo } from "react";
import { getIcon } from "@/components/icons";
import { useAnalyticsStore } from "@/stores/analytics";
import { useProjectStore } from "@/stores/projects";
import { useExportHistoryStore } from "@/stores/export-history";
import { useUser } from "@/hooks/useUser";

interface StatCard {
  label: string;
  value: string;
  icon: string;
  hint: string;
  hintType: "up" | "neutral";
}

/* SSR-safe defaults — must match what the server renders so hydration succeeds */
const SSR_STATS: StatCard[] = [
  { label: "Credits", value: "—", icon: "zap", hint: "Loading…", hintType: "neutral" },
  { label: "Projects", value: "0", icon: "folder", hint: "Start a project", hintType: "neutral" },
  { label: "Exports", value: "0", icon: "download", hint: "Nothing yet", hintType: "neutral" },
  { label: "Activity", value: "—", icon: "clock", hint: "No sessions yet", hintType: "neutral" },
];

export default function StatsBar() {
  /* Gate all store/hook reads behind a mounted flag so SSR and first
     client render produce identical output (prevents React #418). */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { profile } = useUser();
  /* Select the raw record — stable reference unless data actually changes.
     Computing derived values in selectors that return new arrays/objects
     breaks zustand v5 Object.is equality and causes infinite re-renders. */
  const toolUsage = useAnalyticsStore((s) => s.toolUsage);
  const { totalOpens, totalHours, topToolId } = useMemo(() => {
    const entries = Object.entries(toolUsage);
    const opens = entries.reduce((sum, [, u]) => sum + u.opens, 0);
    const hours = Math.round((entries.reduce((sum, [, u]) => sum + u.totalSeconds, 0) / 3600) * 10) / 10;
    const top = entries.sort(([, a], [, b]) => b.opens - a.opens)[0];
    return { totalOpens: opens, totalHours: hours, topToolId: top?.[0] ?? null };
  }, [toolUsage]);
  const projectCount = useProjectStore((s) => s.projects.length);
  const exportCount = useExportHistoryStore((s) => s.exports.length);

  const credits = profile?.credits ?? 0;
  const plan = profile?.plan ?? "free";

  const stats: StatCard[] = mounted
    ? [
        {
          label: "Credits",
          value: credits.toLocaleString(),
          icon: "zap",
          hint: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`,
          hintType: "up",
        },
        {
          label: "Projects",
          value: projectCount.toString(),
          icon: "folder",
          hint: projectCount === 0 ? "Start a project" : "In progress",
          hintType: projectCount === 0 ? "neutral" : "up",
        },
        {
          label: "Exports",
          value: exportCount.toString(),
          icon: "download",
          hint: exportCount === 0 ? "Nothing yet" : "Files created",
          hintType: exportCount === 0 ? "neutral" : "up",
        },
        {
          label: "Activity",
          value: totalOpens > 0 ? `${totalHours}h` : "—",
          icon: "clock",
          hint:
            totalOpens > 0
              ? `${totalOpens} sessions` +
                (topToolId
                  ? ` · Top: ${topToolId.replace(/-/g, " ")}`
                  : "")
              : "No sessions yet",
          hintType: totalOpens > 0 ? "up" : "neutral",
        },
      ]
    : SSR_STATS;

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {stats.map((stat) => {
        const Icon = getIcon(stat.icon);
        return (
          <div
            key={stat.label}
            className="group relative rounded-2xl overflow-hidden
              border border-white/10 dark:border-white/[0.06]
              bg-white/60 dark:bg-gray-900/40 backdrop-blur-lg
              p-4 sm:p-5
              hover:border-primary-500/20 dark:hover:border-primary-500/15
              hover:shadow-xl hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10
              transition-all duration-300"
          >
            {/* Subtle gradient accent top edge */}
            <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-primary-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Icon */}
            <div className="size-10 rounded-xl bg-primary-500/10 dark:bg-primary-500/10
              flex items-center justify-center mb-3
              group-hover:bg-primary-500/20 group-hover:shadow-lg group-hover:shadow-primary-500/10
              transition-all duration-300">
              <Icon className="size-5 text-primary-500 dark:text-primary-400 transition-colors" />
            </div>

            {/* Value */}
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {stat.value}
            </p>

            {/* Label */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {stat.label}
            </p>

            {/* Hint */}
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`inline-block size-1.5 rounded-full ${
                  stat.hintType === "up" ? "bg-success" : "bg-gray-400"
                }`}
              />
              <span className="text-xs text-gray-400 truncate">{stat.hint}</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
