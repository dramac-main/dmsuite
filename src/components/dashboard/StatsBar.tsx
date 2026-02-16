"use client";

import { hubStats } from "@/data/tools";
import { iconMap } from "@/components/icons";

export default function StatsBar() {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {hubStats.map((stat) => {
        const Icon = iconMap[stat.icon];
        return (
          <div
            key={stat.label}
            className="group relative rounded-xl border border-gray-200 dark:border-gray-800
              bg-white dark:bg-gray-900 p-4 sm:p-5
              hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5
              transition-all duration-200"
          >
            {/* Icon */}
            <div className="size-10 rounded-lg bg-gray-100 dark:bg-gray-800
              flex items-center justify-center mb-3
              group-hover:bg-primary-500/10 transition-colors">
              {Icon && (
                <Icon className="size-5 text-gray-500 dark:text-gray-400
                  group-hover:text-primary-500 transition-colors" />
              )}
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
