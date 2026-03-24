"use client";

import Link from "next/link";
import { type Tool, statusConfig } from "@/data/tools";
import { getIcon, IconArrowRight } from "@/components/icons";
import { getToolCreditCost } from "@/data/credit-costs";

interface ToolCardProps {
  tool: Tool;
  categoryId: string;
  accentColor?: string;
}

export default function ToolCard({ tool, categoryId }: ToolCardProps) {
  const Icon = getIcon(tool.icon);
  const badge = statusConfig[tool.status];
  const isReady = tool.status === "ready";
  const creditCost = getToolCreditCost(tool.id);

  const cardClasses = `
    group relative flex flex-col rounded-2xl p-4 sm:p-5
    transition-all duration-300 ease-out
    ${isReady
      ? `border border-white/10 dark:border-white/[0.06]
         bg-white/60 dark:bg-gray-900/40 backdrop-blur-lg
         hover:border-primary-500/30 dark:hover:border-primary-500/20
         hover:shadow-xl hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10
         hover:-translate-y-1 cursor-pointer`
      : `border border-gray-200/30 dark:border-gray-800/30
         bg-gray-50/40 dark:bg-gray-900/20 backdrop-blur-sm
         cursor-default opacity-60`
    }
  `;

  const cardContent = (
    <>
      {/* Top row: Icon + Badges */}
      <div className="flex items-start justify-between mb-4">
        <div className={`
          size-11 rounded-xl flex items-center justify-center transition-all duration-300
          ${isReady
            ? "bg-primary-500/10 dark:bg-primary-500/10 group-hover:bg-primary-500/20 group-hover:shadow-lg group-hover:shadow-primary-500/10"
            : "bg-gray-100/50 dark:bg-gray-800/30"
          }
        `}>
          <Icon className={`size-5 transition-colors duration-300 ${
            isReady
              ? "text-primary-500 dark:text-primary-400"
              : "text-gray-400 dark:text-gray-600"
          }`} />
        </div>

        <div className="flex items-center gap-1.5">
          {isReady && creditCost > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-semibold bg-secondary-500/10 text-secondary-500 dark:text-secondary-400">
              {creditCost} cr
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.625rem] font-semibold ${badge.bgClass} ${badge.textClass}`}>
            <span className={`size-1.5 rounded-full ${badge.dotClass}`} />
            {badge.label}
          </span>
        </div>
      </div>

      {/* Tool name */}
      <h3 className={`text-sm font-semibold mb-1.5 transition-colors ${
        isReady ? "text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-300" : "text-gray-500 dark:text-gray-500"
      }`}>
        {tool.name}
      </h3>

      {/* Description */}
      <p className={`text-xs leading-relaxed flex-1 ${
        isReady ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-600"
      }`}>
        {tool.description}
      </p>

      {/* Arrow indicator on hover */}
      {isReady && (
        <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-primary-500 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
          <span>Open tool</span>
          <IconArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
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

  return <div className={cardClasses}>{cardContent}</div>;
}
