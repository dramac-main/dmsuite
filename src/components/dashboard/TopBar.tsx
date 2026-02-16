"use client";

import ThemeSwitch from "@/components/ThemeSwitch";
import { IconBell, IconMenu, IconSparkles } from "@/components/icons";

interface TopBarProps {
  onMenuClick?: () => void;
  title?: string;
}

export default function TopBar({ onMenuClick, title = "Dashboard" }: TopBarProps) {
  return (
    <header className="flex items-center justify-between h-16 mb-4">
      {/* Left: breadcrumb + title */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center size-9 rounded-lg
            text-gray-500 hover:text-gray-700 dark:hover:text-gray-200
            hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Open menu"
        >
          <IconMenu className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {title}
          </h1>
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-500/10">
            <IconSparkles className="size-3 text-primary-500" />
            <span className="text-[0.625rem] font-semibold text-primary-600 dark:text-primary-400">AI</span>
          </div>
        </div>
      </div>

      {/* Right: Utility icons */}
      <div className="flex items-center gap-2">
        <ThemeSwitch />

        <button
          className="flex items-center justify-center size-9 rounded-lg
            text-gray-500 hover:text-gray-700 dark:hover:text-gray-200
            hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
          aria-label="Notifications"
        >
          <IconBell className="size-5" />
          {/* Notification dot */}
          <span className="absolute top-2 right-2 size-2 rounded-full bg-primary-500 ring-2 ring-white dark:ring-gray-900" />
        </button>

        {/* User avatar */}
        <div
          className="size-8 rounded-lg bg-linear-to-br from-primary-400 to-secondary-500
            flex items-center justify-center text-xs font-bold text-gray-950 cursor-pointer
            ring-2 ring-transparent hover:ring-primary-500/30 transition-all"
        >
          DM
        </div>
      </div>
    </header>
  );
}
