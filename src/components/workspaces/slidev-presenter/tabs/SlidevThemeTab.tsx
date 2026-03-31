"use client";

// =============================================================================
// DMSuite — Slidev Theme Tab: Visual theme picker
// =============================================================================

import React from "react";
import { SLIDEV_THEMES, type SlidevTheme } from "@/lib/slidev/themes";
import { SectionLabel } from "@/components/workspaces/shared/WorkspaceUIKit";

interface SlidevThemeTabProps {
  currentThemeId: string;
  onThemeChange: (id: string) => void;
}

function ThemeCard({
  theme,
  isActive,
  onClick,
}: {
  theme: SlidevTheme;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-full rounded-xl overflow-hidden transition-all border-2 text-left ${
        isActive
          ? "border-primary-500 ring-2 ring-primary-500/20 shadow-lg"
          : "border-gray-700 hover:border-gray-500"
      }`}
    >
      {/* Preview */}
      <div
        className="relative p-4 h-28"
        style={{ background: theme.bg }}
      >
        {/* Title preview */}
        <div
          className="text-sm font-bold mb-1 truncate"
          style={{ color: theme.textPrimary, fontFamily: theme.headingFont }}
        >
          Slide Title
        </div>
        <div
          className="text-[10px] mb-2"
          style={{ color: theme.textSecondary, fontFamily: theme.bodyFont }}
        >
          Content text preview
        </div>

        {/* Code preview */}
        <div
          className="rounded px-2 py-1 text-[9px]"
          style={{
            background: theme.bgCode,
            color: theme.textCode,
            fontFamily: theme.monoFont,
          }}
        >
          {"const x = 42;"}
        </div>

        {/* Accent bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ background: theme.accent }}
        />
      </div>

      {/* Name */}
      <div
        className={`px-3 py-2 text-xs font-medium flex items-center justify-between ${
          isActive
            ? "bg-primary-500/10 text-primary-400"
            : "bg-gray-800 text-gray-300"
        }`}
      >
        <span>{theme.name}</span>
        {isActive && (
          <span className="text-[10px] bg-primary-500/20 px-1.5 py-0.5 rounded">
            Active
          </span>
        )}
      </div>
    </button>
  );
}

export default function SlidevThemeTab({
  currentThemeId,
  onThemeChange,
}: SlidevThemeTabProps) {
  const darkThemes = SLIDEV_THEMES.filter((t) => t.isDark);
  const lightThemes = SLIDEV_THEMES.filter((t) => !t.isDark);

  return (
    <div className="flex flex-col h-full gap-4 overflow-y-auto pr-1 custom-scrollbar">
      {/* Dark themes */}
      <div>
        <SectionLabel>Dark Themes ({darkThemes.length})</SectionLabel>
        <div className="grid grid-cols-1 gap-2 mt-2">
          {darkThemes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={theme.id === currentThemeId}
              onClick={() => onThemeChange(theme.id)}
            />
          ))}
        </div>
      </div>

      {/* Light themes */}
      {lightThemes.length > 0 && (
        <div>
          <SectionLabel>Light Themes ({lightThemes.length})</SectionLabel>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {lightThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isActive={theme.id === currentThemeId}
                onClick={() => onThemeChange(theme.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Theme info */}
      <div className="mt-2 p-3 rounded-lg bg-gray-800/50 border border-gray-700 text-xs text-gray-400 space-y-1">
        <div className="font-medium text-gray-300">Theme Tips</div>
        <p>
          Set theme in your markdown headmatter:
        </p>
        <pre className="text-[10px] bg-gray-900 p-1.5 rounded font-mono text-primary-400">
          {`---\ntheme: ${currentThemeId}\n---`}
        </pre>
      </div>
    </div>
  );
}
