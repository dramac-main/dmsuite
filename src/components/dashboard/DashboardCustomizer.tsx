"use client";

import { useState, useRef, useEffect } from "react";
import { usePreferencesStore } from "@/stores/preferences";

const SECTIONS = [
  { id: "favorites", label: "My Favorites" },
  { id: "recent", label: "Recently Used" },
  { id: "projects", label: "Active Projects" },
  { id: "quick-access", label: "Quick Access" },
  { id: "whats-new", label: "What's New" },
  { id: "explore", label: "Explore Collections" },
] as const;

/**
 * Dashboard customization popover — lets users toggle visibility of dashboard sections.
 * Triggered by a gear icon button placed on the dashboard.
 */
export default function DashboardCustomizer() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const hiddenSections = usePreferencesStore((s) => s.hiddenSections);
  const toggleSection = usePreferencesStore((s) => s.toggleSection);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("mousedown", close); window.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-colors"
        aria-label="Customize dashboard"
        title="Customize dashboard sections"
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Customize Dashboard</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Show or hide dashboard sections</p>
          </div>
          <div className="p-2 space-y-0.5">
            {SECTIONS.map((section) => {
              const isHidden = hiddenSections.includes(section.id);
              return (
                <button
                  key={section.id}
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className={`text-sm ${isHidden ? "text-gray-500" : "text-gray-200"}`}>
                    {section.label}
                  </span>
                  <div className={`relative w-8 h-[18px] rounded-full transition-colors ${isHidden ? "bg-gray-700" : "bg-primary-500"}`}>
                    <div className={`absolute top-0.5 size-3.5 rounded-full bg-white transition-transform ${isHidden ? "left-0.5" : "left-[18px]"}`} />
                  </div>
                </button>
              );
            })}
          </div>
          <div className="px-4 py-2 border-t border-white/5">
            <p className="text-[10px] text-gray-500">Changes are saved automatically</p>
          </div>
        </div>
      )}
    </div>
  );
}
