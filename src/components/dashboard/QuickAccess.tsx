"use client";

import Link from "next/link";
import { featuredToolIds, getAllToolsFlat, type FlatTool } from "@/data/tools";
import { iconMap, IconArrowRight, IconStar } from "@/components/icons";

const featuredTools: FlatTool[] = getAllToolsFlat().filter((t) =>
  featuredToolIds.includes(t.id)
);

export default function QuickAccess() {
  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconStar className="size-5 text-primary-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            Quick Access
          </h2>
        </div>
        <span className="text-xs text-gray-400">Featured tools</span>
      </div>

      {/* Horizontal scrollable cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
        {featuredTools.map((tool) => {
          const Icon = iconMap[tool.icon];
          return (
            <Link
              key={tool.id}
              href={`/tools/${tool.categoryId}/${tool.id}`}
              className="group flex-none w-52 sm:w-60 snap-start
                rounded-xl border border-gray-200 dark:border-gray-800
                bg-white dark:bg-gray-900 p-4
                hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5
                transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="size-9 rounded-lg bg-gray-100 dark:bg-gray-800
                  flex items-center justify-center shrink-0
                  group-hover:bg-primary-500/10 transition-colors">
                  {Icon && (
                    <Icon className="size-4 text-gray-500 dark:text-gray-400
                      group-hover:text-primary-500 transition-colors" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {tool.name}
                  </p>
                  <p className="text-[0.625rem] text-gray-400 truncate">
                    {tool.categoryName}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                {tool.description}
              </p>
              <div className="flex items-center gap-1 mt-3 text-xs font-medium text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Launch</span>
                <IconArrowRight className="size-3" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
