"use client";

import { useState } from "react";
import { type ToolCategory } from "@/data/tools";
import { iconMap, IconChevronDown } from "@/components/icons";
import { bgOpacity10 } from "@/lib/colors";
import ToolCard from "./ToolCard";

interface CategorySectionProps {
  category: ToolCategory;
  defaultExpanded?: boolean;
}

export default function CategorySection({
  category,
  defaultExpanded = true,
}: CategorySectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const Icon = iconMap[category.icon];
  const iconBg = bgOpacity10[category.colorClass] || "bg-gray-500/10";

  const readyCount = category.tools.filter((t) => t.status === "ready").length;
  const betaCount = category.tools.filter((t) => t.status === "beta").length;

  return (
    <section id={category.id} className="mb-8 scroll-mt-24">
      {/* Category header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 group mb-4"
      >
        {/* Category icon */}
        <div
          className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
        >
          {Icon && <Icon className={`size-5 ${category.textColorClass}`} />}
        </div>

        {/* Title + description */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
              {category.name}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {category.tools.length} tools
              </span>
              {readyCount > 0 && (
                <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                  {readyCount} ready
                </span>
              )}
              {betaCount > 0 && (
                <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                  {betaCount} beta
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {category.description}
          </p>
        </div>

        {/* Expand/collapse */}
        <IconChevronDown
          className={`size-5 text-gray-400 shrink-0 transition-transform duration-200
            ${expanded ? "rotate-180" : ""}
          `}
        />
      </button>

      {/* Tool grid */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {category.tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              categoryId={category.id}
              accentColor={category.colorClass.replace("bg-", "")}
            />
          ))}
        </div>
      )}
    </section>
  );
}
