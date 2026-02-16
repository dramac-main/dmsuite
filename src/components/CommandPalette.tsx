"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toolCategories, type FlatTool } from "@/data/tools";
import { usePreferencesStore } from "@/stores";
import { useTheme } from "@/components/ThemeProvider";
import { iconMap, IconSearch, IconX, IconArrowRight, IconClock, IconStar, IconSparkles } from "@/components/icons";
import { Kbd } from "@/components/ui";

/* ── Command Palette ─────────────────────────────────────────
   Global search overlay triggered by Cmd+K / Ctrl+K.
   Searches 250+ tools with fuzzy matching, shows recents & favorites.
   ──────────────────────────────────────────────────────────── */

/** Action items (non-tool quick actions) */
const quickActions = [
  { id: "action:dashboard", label: "Go to Dashboard", icon: "grid", href: "/dashboard" },
  { id: "action:theme", label: "Toggle Dark/Light Mode", icon: "settings", action: "toggle-theme" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { recentTools, favoriteTools, addRecentTool } = usePreferencesStore();
  const { toggleTheme } = useTheme();

  // ── Keyboard shortcut: Cmd/Ctrl + K ──────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => {
          const next = !prev;
          if (next) {
            setQuery("");
            setSelectedIndex(0);
          }
          return next;
        });
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      // Small delay for animation
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ── Build result list ────────────────────────────────────
  const allToolsFlat = useMemo(() => {
    return toolCategories.flatMap((cat) =>
      cat.tools.map((tool) => ({
        ...tool,
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        colorClass: cat.colorClass,
        textColorClass: cat.textColorClass,
      }))
    );
  }, []);

  type EnrichedTool = FlatTool & { categoryIcon: string; colorClass: string; textColorClass: string };

  const results = useMemo(() => {
    if (query.trim()) {
      // Search mode
      const q = query.toLowerCase().trim();
      return allToolsFlat.filter(
        (tool) =>
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          tool.categoryName.toLowerCase().includes(q)
      ).slice(0, 20);
    }
    return [];
  }, [query, allToolsFlat]);

  // Recent tools (when no query)
  const recentToolsList = useMemo(() => {
    if (query.trim()) return [];
    return recentTools
      .map((id) => allToolsFlat.find((t) => t.id === id))
      .filter(Boolean) as EnrichedTool[];
  }, [query, recentTools, allToolsFlat]);

  // Favorite tools (when no query)
  const favoriteToolsList = useMemo(() => {
    if (query.trim()) return [];
    return favoriteTools
      .map((id) => allToolsFlat.find((t) => t.id === id))
      .filter(Boolean) as EnrichedTool[];
  }, [query, favoriteTools, allToolsFlat]);

  // Build unified items list for keyboard navigation
  type PaletteItem =
    | { type: "tool"; tool: EnrichedTool }
    | { type: "action"; id: string; label: string; icon: string; href?: string; action?: string };

  const items = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = [];

    if (query.trim()) {
      // Search results
      results.forEach((tool) => list.push({ type: "tool", tool }));
    } else {
      // Favorites
      favoriteToolsList.forEach((tool) => list.push({ type: "tool", tool }));
      // Recents
      recentToolsList.forEach((tool) => list.push({ type: "tool", tool }));
      // Quick actions
      quickActions.forEach((a) => list.push({ type: "action", ...a }));
    }

    return list;
  }, [query, results, favoriteToolsList, recentToolsList]);

  // ── Navigate to tool ─────────────────────────────────────
  const navigateToTool = useCallback(
    (tool: EnrichedTool) => {
      addRecentTool(tool.id);
      router.push(`/tools/${tool.categoryId}/${tool.id}`);
      setOpen(false);
    },
    [router, addRecentTool]
  );

  const executeItem = useCallback(
    (item: PaletteItem) => {
      if (item.type === "tool") {
        navigateToTool(item.tool);
      } else if (item.type === "action") {
        if (item.href) {
          router.push(item.href);
        } else if (item.action === "toggle-theme") {
          toggleTheme();
        }
        setOpen(false);
      }
    },
    [navigateToTool, router, toggleTheme]
  );

  // ── Keyboard navigation ──────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (items[selectedIndex]) {
            executeItem(items[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
      }
    },
    [items, selectedIndex, executeItem]
  );

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // ── Render ────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-400 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-xl mx-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden"
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <IconSearch className="size-5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search 250+ tools, actions…"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                className="flex-1 bg-transparent text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none"
              />
              <button
                onClick={() => setOpen(false)}
                className="flex items-center justify-center size-6 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <IconX className="size-3.5" />
              </button>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-80 overflow-y-auto overscroll-contain">
              {/* No query — show favorites, recents, actions */}
              {!query.trim() && (
                <>
                  {/* Favorites */}
                  {favoriteToolsList.length > 0 && (
                    <div>
                      <div className="px-4 pt-3 pb-1.5">
                        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-gray-400">
                          <IconStar className="size-3 inline mr-1 -mt-0.5" />
                          Favorites
                        </span>
                      </div>
                      {favoriteToolsList.map((tool, i) => {
                        const idx = i;
                        return (
                          <ToolResultItem
                            key={tool.id}
                            tool={tool}
                            selected={selectedIndex === idx}
                            onSelect={() => navigateToTool(tool)}
                            onHover={() => setSelectedIndex(idx)}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Recents */}
                  {recentToolsList.length > 0 && (
                    <div>
                      <div className="px-4 pt-3 pb-1.5">
                        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-gray-400">
                          <IconClock className="size-3 inline mr-1 -mt-0.5" />
                          Recent
                        </span>
                      </div>
                      {recentToolsList.map((tool, i) => {
                        const idx = favoriteToolsList.length + i;
                        return (
                          <ToolResultItem
                            key={tool.id}
                            tool={tool}
                            selected={selectedIndex === idx}
                            onSelect={() => navigateToTool(tool)}
                            onHover={() => setSelectedIndex(idx)}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div>
                    <div className="px-4 pt-3 pb-1.5">
                      <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-gray-400">
                        Quick Actions
                      </span>
                    </div>
                    {quickActions.map((action, i) => {
                      const idx = favoriteToolsList.length + recentToolsList.length + i;
                      const ActionIcon = iconMap[action.icon];
                      return (
                        <button
                          key={action.id}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            selectedIndex === idx
                              ? "bg-primary-500/10 text-primary-500"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          }`}
                          onClick={() => executeItem({ type: "action", ...action })}
                          onMouseEnter={() => setSelectedIndex(idx)}
                        >
                          {ActionIcon && <ActionIcon className="size-4 shrink-0" />}
                          <span className="text-sm font-medium">{action.label}</span>
                          <IconArrowRight className="size-3 ml-auto opacity-40" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Empty state hint */}
                  {favoriteToolsList.length === 0 && recentToolsList.length === 0 && (
                    <div className="px-4 py-6 text-center">
                      <IconSparkles className="size-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">
                        Start typing to search 250+ AI tools
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Search results */}
              {query.trim() && results.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1.5">
                    <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-gray-400">
                      Tools — {results.length} result{results.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {results.map((tool, i) => (
                    <ToolResultItem
                      key={tool.id}
                      tool={tool}
                      selected={selectedIndex === i}
                      onSelect={() => navigateToTool(tool)}
                      onHover={() => setSelectedIndex(i)}
                    />
                  ))}
                </div>
              )}

              {/* No results */}
              {query.trim() && results.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <IconSearch className="size-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500">
                    No tools matching &quot;{query}&quot;
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center gap-3 text-[0.6875rem] text-gray-400">
                <span className="flex items-center gap-1">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  <span className="ml-0.5">Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <Kbd>↵</Kbd>
                  <span className="ml-0.5">Open</span>
                </span>
                <span className="flex items-center gap-1">
                  <Kbd>Esc</Kbd>
                  <span className="ml-0.5">Close</span>
                </span>
              </div>
              <span className="text-[0.6875rem] text-gray-400">DMSuite</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Tool Result Item ────────────────────────────────────── */
interface ToolResultItemProps {
  tool: FlatTool & { categoryIcon: string; colorClass: string; textColorClass: string };
  selected: boolean;
  onSelect: () => void;
  onHover: () => void;
}

function ToolResultItem({ tool, selected, onSelect, onHover }: ToolResultItemProps) {
  const ToolIcon = iconMap[tool.icon];
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        selected
          ? "bg-primary-500/10"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
      onClick={onSelect}
      onMouseEnter={onHover}
    >
      <div
        className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
          selected ? "bg-primary-500/20" : "bg-gray-100 dark:bg-gray-800"
        }`}
      >
        {ToolIcon && (
          <ToolIcon className={`size-4 ${selected ? "text-primary-500" : tool.textColorClass}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium truncate ${
              selected ? "text-primary-500" : "text-gray-900 dark:text-white"
            }`}
          >
            {tool.name}
          </span>
          {tool.supportsPartEdit && (
            <span className="shrink-0 text-[0.6rem] font-semibold px-1.5 py-0.5 rounded bg-secondary-500/10 text-secondary-500">
              Part-Edit
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">{tool.categoryName}</p>
      </div>
      <IconArrowRight className={`size-3 shrink-0 ${selected ? "text-primary-500" : "text-gray-300 dark:text-gray-600"}`} />
    </button>
  );
}
