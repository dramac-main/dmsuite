"use client";

import Link from "next/link";
import { type Tool, statusConfig } from "@/data/tools";
import { iconMap, IconArrowRight } from "@/components/icons";
import { groupHoverBg10 } from "@/lib/colors";

interface ToolCardProps {
  tool: Tool;
  categoryId: string;
  accentColor?: string; // e.g. "primary-500"
}

export default function ToolCard({ tool, categoryId, accentColor }: ToolCardProps) {
  const Icon = iconMap[tool.icon];
  const badge = statusConfig[tool.status];
  const isReady = tool.status === "ready";
  const hoverBg = groupHoverBg10[accentColor || "primary-500"] || groupHoverBg10["primary-500"];

  const cardClasses = `
    group relative flex flex-col rounded-xl border p-4
    transition-all duration-200
    ${isReady
      ? "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 cursor-pointer hover:-translate-y-0.5"
      : "border-gray-200/50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50 cursor-default opacity-75"
    }
  `;

  const cardContent = (
    <>
      {/* Top row: Icon + Badge */}
      <div className="flex items-start justify-between mb-3">
        <div
          className={`
            size-10 rounded-lg flex items-center justify-center transition-colors
            ${isReady
              ? `bg-gray-100 dark:bg-gray-800 ${hoverBg}`
              : "bg-gray-100/50 dark:bg-gray-800/50"
            }
          `}
        >
          {Icon && (
            <Icon
              className={`size-5 transition-colors ${
                isReady
                  ? "text-gray-600 dark:text-gray-400 group-hover:text-primary-500"
                  : "text-gray-400 dark:text-gray-600"
              }`}
            />
          )}
        </div>

        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.625rem] font-semibold ${badge.bgClass} ${badge.textClass}`}
        >
          <span className={`size-1.5 rounded-full ${badge.dotClass}`} />
          {badge.label}
        </span>
      </div>

      {/* Tool name */}
      <h3
        className={`text-sm font-semibold mb-1 ${
          isReady ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-500"
        }`}
      >
        {tool.name}
      </h3>

      {/* Description */}
      <p
        className={`text-xs leading-relaxed flex-1 ${
          isReady ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-600"
        }`}
      >
        {tool.description}
      </p>

      {/* Arrow indicator on hover */}
      {isReady && (
        <div className="flex items-center gap-1 mt-3 text-xs font-medium text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Open tool</span>
          <IconArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}
    </>
  );

  if (isReady) {
    return (
      <Link href={`/tools/${categoryId}/${tool.id}`} className={cardClasses}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={cardClasses}>
      {cardContent}
    </div>
  );
}
