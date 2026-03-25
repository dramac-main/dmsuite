"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { type Tool, statusConfig } from "@/data/tools";
import { getIcon, IconArrowRight, IconStar } from "@/components/icons";
import { getToolCreditCost } from "@/data/credit-costs";
import { usePreferencesStore } from "@/stores/preferences";
import { toast } from "@/stores/toast";

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
  const isFav = usePreferencesStore((s) => s.favoriteTools.includes(tool.id));
  const toggleFavorite = usePreferencesStore((s) => s.toggleFavorite);

  // ── Context menu state ──
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toolUrl = `/tools/${categoryId}/${tool.id}`;

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!isReady) return;
      e.preventDefault();
      setCtxMenu({ x: e.clientX, y: e.clientY });
    },
    [isReady]
  );

  useEffect(() => {
    if (!ctxMenu) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setCtxMenu(null);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setCtxMenu(null); };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("mousedown", close); window.removeEventListener("keydown", esc); };
  }, [ctxMenu]);

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
          {/* Favorite star button */}
          {isReady && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(tool.id);
                toast.success(isFav ? `Removed ${tool.name} from favorites` : `Added ${tool.name} to favorites`);
              }}
              className={`size-7 rounded-lg flex items-center justify-center transition-all duration-200
                ${isFav
                  ? "text-amber-400 hover:text-amber-500 bg-amber-400/10"
                  : "text-gray-300 dark:text-gray-600 hover:text-amber-400 dark:hover:text-amber-400 opacity-0 group-hover:opacity-100"
                }`}
              aria-label={isFav ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          )}
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
      <>
        <Link href={toolUrl} className={cardClasses} onContextMenu={handleContextMenu} title={`${tool.name} — ${tool.description}`}>
          {cardContent}
        </Link>
        {ctxMenu && (
          <div
            ref={menuRef}
            className="fixed z-[200] w-48 rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl py-1 text-sm"
            style={{ top: ctxMenu.y, left: ctxMenu.x }}
          >
            <a
              href={toolUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              onClick={() => setCtxMenu(null)}
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Open in new tab
            </a>
            <button
              onClick={() => { toggleFavorite(tool.id); toast.success(isFav ? "Removed from favorites" : "Added to favorites"); setCtxMenu(null); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <IconStar className="size-4" />
              {isFav ? "Remove from favorites" : "Add to favorites"}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin + toolUrl);
                toast.success("Link copied!");
                setCtxMenu(null);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy link
            </button>
          </div>
        )}
      </>
    );
  }

  return <div className={cardClasses}>{cardContent}</div>;
}
