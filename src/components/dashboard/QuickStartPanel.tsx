"use client";

import { quickStartTemplates, type QuickStartTemplate } from "@/data/quick-start-templates";
import { getIcon } from "@/components/icons";

interface QuickStartPanelProps {
  toolId: string;
  onSelect: (template: QuickStartTemplate) => void;
}

/**
 * Quick Start panel — shows preset template options for a given tool.
 * Workspaces can render this to give users a fast starting point.
 */
export default function QuickStartPanel({ toolId, onSelect }: QuickStartPanelProps) {
  const templates = quickStartTemplates[toolId];
  if (!templates || templates.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">Quick Start</h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((tpl) => {
          const Icon = getIcon(tpl.icon);
          return (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl)}
              className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:border-primary-500/20 hover:bg-primary-500/5 transition-all text-left group"
            >
              <div className="size-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0 group-hover:bg-primary-500/20 transition-colors">
                <Icon className="size-4 text-primary-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                  {tpl.label}
                </p>
                <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">
                  {tpl.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
