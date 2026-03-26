"use client";

import { getIcon } from "@/components/icons";
import { useAnalyticsStore } from "@/stores/analytics";
import { usePreferencesStore } from "@/stores/preferences";
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

export default function StatsBar() {
  const { profile } = useUser();
  const totalOpens = useAnalyticsStore((s) => s.getTotalOpens());
  const totalHours = useAnalyticsStore((s) => s.getTotalHours());
  const topTools = useAnalyticsStore((s) => s.getTopTools(1));
  const favCount = usePreferencesStore((s) => s.favoriteTools.length);
  const projectCount = useProjectStore((s) => s.projects.length);
  const exportCount = useExportHistoryStore((s) => s.exports.length);

  const credits = profile?.credits ?? 0;
  const plan = profile?.plan ?? "free";

  const stats: StatCard[] = [
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
            (topTools[0] ? ` · Top: ${topTools[0].toolId.replace(/-/g, " ")}` : "")
          : "No sessions yet",
      hintType: totalOpens > 0 ? "up" : "neutral",
    },
  ];

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
