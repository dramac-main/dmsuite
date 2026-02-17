"use client";

import { useState, useEffect, useMemo } from "react";
import { IconX, IconSearch } from "@/components/icons";
import { Kbd } from "@/components/ui";
import {
  GLOBAL_SHORTCUTS,
  CANVAS_SHORTCUTS,
  WORKSPACE_SHORTCUTS,
  formatShortcut,
  type Shortcut,
} from "@/lib/shortcuts";

/**
 * Keyboard shortcuts help modal.
 * Triggered by pressing `?` or the "Keyboard Shortcuts" button.
 * Listens for the `dmsuite:shortcuts-help` custom event.
 */
export default function ShortcutsHelpModal() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Listen for custom event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("dmsuite:shortcuts-help", handler);
    return () => window.removeEventListener("dmsuite:shortcuts-help", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Group shortcuts by scope
  const sections = useMemo(() => {
    const q = search.toLowerCase();
    const filter = (list: Shortcut[]) =>
      q ? list.filter((s) => s.description.toLowerCase().includes(q) || s.action.includes(q)) : list;

    const workspaceAll = Object.entries(WORKSPACE_SHORTCUTS).flatMap(([tool, shortcuts]) =>
      shortcuts.map((s) => ({ ...s, description: `[${tool}] ${s.description}` }))
    );

    return [
      { title: "Global", items: filter(GLOBAL_SHORTCUTS) },
      { title: "Canvas", items: filter(CANVAS_SHORTCUTS) },
      { title: "Tool-Specific", items: filter(workspaceAll) },
    ].filter((s) => s.items.length > 0);
  }, [search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-700 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <IconX className="size-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold uppercase text-gray-400 mb-3 tracking-wider">
                {section.title}
              </h3>
              <div className="space-y-1.5">
                {section.items.map((shortcut) => (
                  <div
                    key={`${shortcut.action}-${shortcut.key}`}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <Kbd>{formatShortcut(shortcut)}</Kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {sections.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              No shortcuts match &quot;{search}&quot;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
