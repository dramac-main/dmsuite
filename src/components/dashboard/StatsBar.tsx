"use client";

import { hubStats } from "@/data/tools";
import { getIcon } from "@/components/icons";
import { useAnalyticsStore } from "@/stores/analytics";
import { usePreferencesStore } from "@/stores/preferences";

export default function StatsBar() {
  const totalOpens = useAnalyticsStore((s) => s.getTotalOpens());
  const totalHours = useAnalyticsStore((s) => s.getTotalHours());
  const favCount = usePreferencesStore((s) => s.favoriteTools.length);

  // Merge static hub stats with dynamic analytics
  const dynamicStats = [
    ...hubStats,
    ...(totalOpens > 0
      ? [
          {
            label: "Sessions",
            value: totalOpens.toString(),
            icon: "clock" as const,
            change: `${totalHours}h total time`,
            changeType: "up" as const,
          },
        ]
      : []),
    ...(favCount > 0
      ? [
          {
            label: "Favorites",
            value: favCount.toString(),
            icon: "star" as const,
            change: "Quick access",
            changeType: "up" as const,
          },
        ]
      : []),
  ];
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {dynamicStats.map((stat) => {
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

            {/* Change indicator */}
            {stat.change && (
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className={`inline-block size-1.5 rounded-full ${
                    stat.changeType === "up"
                      ? "bg-success"
                      : stat.changeType === "down"
                        ? "bg-error"
                        : "bg-gray-400"
                  }`}
                />
                <span className="text-xs text-gray-400">{stat.change}</span>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
