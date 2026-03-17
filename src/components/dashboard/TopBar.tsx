"use client";

import ThemeSwitch from "@/components/ThemeSwitch";
import { IconBell, IconMenu, IconSparkles } from "@/components/icons";
import { interactive, typography, recipes, layout } from "@/lib/design-system";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onMenuClick?: () => void;
  title?: string;
}

export default function TopBar({ onMenuClick, title = "Dashboard" }: TopBarProps) {
  return (
    <header className={cn("flex items-center justify-between mb-4", layout.topBarHeight)}>
      {/* Left: breadcrumb + title */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className={cn(interactive.iconButton, "lg:hidden")}
          aria-label="Open menu"
        >
          <IconMenu className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <h1 className={typography.pageTitle}>
            {title}
          </h1>
          <div className={cn(recipes.aiBadge, "hidden sm:flex")}>
            <IconSparkles className="size-3 text-primary-500" />
            <span className="text-[0.625rem] font-semibold text-primary-600 dark:text-primary-400">AI</span>
          </div>
        </div>
      </div>

      {/* Right: Utility icons */}
      <div className="flex items-center gap-2">
        <ThemeSwitch />

        <button
          className={cn(interactive.iconButton, "relative")}
          aria-label="Notifications"
        >
          <IconBell className="size-5" />
          {/* Notification dot */}
          <span className={recipes.notifDot} />
        </button>

        {/* User avatar */}
        <div className={recipes.avatar}>
          DM
        </div>
      </div>
    </header>
  );
}
