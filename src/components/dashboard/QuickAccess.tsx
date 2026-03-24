"use client";

import Link from "next/link";
import { featuredToolIds, getAllToolsFlat, type FlatTool } from "@/data/tools";
import { getIcon, IconArrowRight, IconStar } from "@/components/icons";

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
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
        {featuredTools.map((tool) => {
          const Icon = getIcon(tool.icon);
          return (
            <Link
              key={tool.id}
              href={`/tools/${tool.categoryId}/${tool.id}`}
              className="group flex-none w-56 sm:w-64 snap-start
                rounded-2xl border border-white/10 dark:border-white/[0.06]
                bg-white/60 dark:bg-gray-900/40 backdrop-blur-lg p-4 sm:p-5
                hover:border-primary-500/30 dark:hover:border-primary-500/20
                hover:shadow-xl hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10
                transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-xl bg-primary-500/10 dark:bg-primary-500/10
                  flex items-center justify-center shrink-0
                  group-hover:bg-primary-500/20 group-hover:shadow-lg group-hover:shadow-primary-500/10 transition-all duration-300">
                  <Icon className="size-5 text-primary-500 dark:text-primary-400 transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
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
              <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-primary-500 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                <span>Launch</span>
                <IconArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
