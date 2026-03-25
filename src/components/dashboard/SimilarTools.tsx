"use client";

import Link from "next/link";
import { useMemo } from "react";
import { toolCategories, type Tool } from "@/data/tools";
import { getIcon, IconArrowRight } from "@/components/icons";

interface SimilarToolsProps {
  categoryId: string;
  currentToolId: string;
  max?: number;
}

/**
 * Shows related tools from the same category on workspace pages.
 * Displays up to `max` (default 4) ready tools excluding the current one.
 */
export default function SimilarTools({ categoryId, currentToolId, max = 4 }: SimilarToolsProps) {
  const similar: Tool[] = useMemo(() => {
    const cat = toolCategories.find((c) => c.id === categoryId);
    if (!cat) return [];
    return cat.tools
      .filter((t) => t.id !== currentToolId && t.status === "ready")
      .slice(0, max);
  }, [categoryId, currentToolId, max]);

  if (similar.length === 0) return null;

  return (
    <div className="border-t border-gray-200 dark:border-gray-800/60 pt-3 mt-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
        Similar Tools
      </p>
      <div className="space-y-0.5">
        {similar.map((tool) => {
          const Icon = getIcon(tool.icon);
          return (
            <Link
              key={tool.id}
              href={`/tools/${categoryId}/${tool.id}`}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors group"
            >
              <div className="size-6 rounded-md bg-primary-500/10 flex items-center justify-center shrink-0">
                <Icon className="size-3 text-primary-400" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1 group-hover:text-primary-500 transition-colors">
                {tool.name}
              </span>
              <IconArrowRight className="size-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
