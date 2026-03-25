"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getAllToolsFlat, type FlatTool } from "@/data/tools";
import { usePreferencesStore } from "@/stores/preferences";
import { getIcon, IconArrowRight, IconStar } from "@/components/icons";
import EmptyState from "@/components/dashboard/EmptyState";

/**
 * Favorite Tools — horizontal scrollable strip.
 * Pulls from the preferences store (persisted in localStorage).
 * Shows empty state illustration when user has no favorites.
 */
export default function FavoriteTools() {
  const favoriteIds = usePreferencesStore((s) => s.favoriteTools);

  const favoriteTools: FlatTool[] = useMemo(() => {
    if (favoriteIds.length === 0) return [];
    const all = getAllToolsFlat();
    const lookup = new Map(all.map((t) => [t.id, t]));
    return favoriteIds
      .map((id) => lookup.get(id))
      .filter((t): t is FlatTool => !!t);
  }, [favoriteIds]);

  if (favoriteTools.length === 0) {
    return (
      <section className="mb-8" data-tour="favorites">
        <div className="flex items-center gap-2 mb-4">
          <IconStar className="size-5 text-amber-400" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            My Favorites
          </h2>
        </div>
        <EmptyState
          icon={<IconStar className="size-7 text-amber-400/60" />}
          title="No favorites yet"
          description="Click the star icon on any tool card to save it here for quick access."
        />
      </section>
    );
  }

  return (
    <section className="mb-8" data-tour="favorites">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconStar className="size-5 text-amber-400" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            My Favorites
          </h2>
        </div>
        <span className="text-xs text-gray-400">
          {favoriteTools.length} tool{favoriteTools.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Horizontal scrollable cards */}
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
        {favoriteTools.map((tool) => {
          const Icon = getIcon(tool.icon);
          return (
            <Link
              key={tool.id}
              href={`/tools/${tool.categoryId}/${tool.id}`}
              className="group flex-none w-56 sm:w-64 snap-start
                rounded-2xl border border-amber-400/20 dark:border-amber-400/10
                bg-white/60 dark:bg-gray-900/40 backdrop-blur-lg p-4 sm:p-5
                hover:border-amber-400/40 dark:hover:border-amber-400/30
                hover:shadow-xl hover:shadow-amber-400/5 dark:hover:shadow-amber-400/10
                transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-xl bg-amber-400/10 dark:bg-amber-400/10
                  flex items-center justify-center shrink-0
                  group-hover:bg-amber-400/20 group-hover:shadow-lg group-hover:shadow-amber-400/10 transition-all duration-300">
                  <Icon className="size-5 text-amber-500 dark:text-amber-400 transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
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
              <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-amber-500 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
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
