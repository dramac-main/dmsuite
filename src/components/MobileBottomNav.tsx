"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  IconHome,
  IconSearch,
  IconSparkles,
  IconClock,
  IconMenu,
} from "@/components/icons";

interface MobileBottomNavProps {
  onSearchClick?: () => void;
  onMenuClick?: () => void;
}

const tabs = [
  { id: "home", label: "Home", href: "/dashboard", icon: IconHome },
  { id: "search", label: "Search", href: null, icon: IconSearch },
  { id: "create", label: "Create", href: null, icon: IconSparkles },
  { id: "recents", label: "Recents", href: "/dashboard", icon: IconClock },
  { id: "menu", label: "Menu", href: null, icon: IconMenu },
] as const;

/**
 * Mobile bottom navigation bar — visible only on screens < lg (1024px).
 * Provides quick access to Dashboard, Search, Create, Recents, and Sidebar.
 * Hidden when the virtual keyboard is likely open.
 */
export default function MobileBottomNav({
  onSearchClick,
  onMenuClick,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Detect virtual keyboard via visualViewport resize
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const check = () => {
      // If viewport height is significantly smaller than window, keyboard is likely open
      setKeyboardOpen(vv.height < window.innerHeight * 0.75);
    };

    vv.addEventListener("resize", check);
    return () => vv.removeEventListener("resize", check);
  }, []);

  if (keyboardOpen) return null;

  const activeTab =
    pathname === "/dashboard"
      ? "home"
      : pathname.startsWith("/tools")
        ? "create"
        : "home";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 lg:hidden z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;

          if (tab.href) {
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors min-w-0 ${
                  isActive
                    ? "text-primary-500"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="size-5" />
                <span className="text-[10px] font-medium leading-none">
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "search") onSearchClick?.();
                if (tab.id === "menu") onMenuClick?.();
                if (tab.id === "create") onSearchClick?.(); // opens command palette
              }}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors min-w-0 ${
                tab.id === "create"
                  ? "text-primary-500"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
              aria-label={tab.label}
            >
              {tab.id === "create" ? (
                <div className="size-9 rounded-full bg-primary-500 flex items-center justify-center -mt-3 shadow-lg shadow-primary-500/30">
                  <Icon className="size-5 text-gray-950" />
                </div>
              ) : (
                <Icon className="size-5" />
              )}
              <span className="text-[10px] font-medium leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
