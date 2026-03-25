"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  IconHome,
  IconSearch,
  IconSparkles,
  IconClock,
  IconMenu,
  IconArrowRight,
} from "@/components/icons";
import { getIcon } from "@/components/icons";
import { usePreferencesStore } from "@/stores/preferences";
import { getAllToolsFlat, type FlatTool } from "@/data/tools";

interface MobileBottomNavProps {
  onSearchClick?: () => void;
  onMenuClick?: () => void;
}

const tabs = [
  { id: "home", label: "Home", href: "/dashboard", icon: IconHome },
  { id: "search", label: "Search", href: null, icon: IconSearch },
  { id: "create", label: "Create", href: null, icon: IconSparkles },
  { id: "recents", label: "Recents", href: null, icon: IconClock },
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
  const router = useRouter();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [showRecents, setShowRecents] = useState(false);

  const recentIds = usePreferencesStore((s) => s.recentTools);
  const recentTools: FlatTool[] = useMemo(() => {
    if (recentIds.length === 0) return [];
    const all = getAllToolsFlat();
    const lookup = new Map(all.map((t) => [t.id, t]));
    return recentIds
      .map((id) => lookup.get(id))
      .filter((t): t is FlatTool => !!t)
      .slice(0, 10);
  }, [recentIds]);

  // Detect virtual keyboard via visualViewport resize
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const check = () => {
      setKeyboardOpen(vv.height < window.innerHeight * 0.75);
    };

    vv.addEventListener("resize", check);
    return () => vv.removeEventListener("resize", check);
  }, []);

  // Close recents sheet when navigating
  useEffect(() => {
    setShowRecents(false);
  }, [pathname]);

  if (keyboardOpen) return null;

  const activeTab =
    pathname === "/dashboard"
      ? "home"
      : pathname.startsWith("/tools")
        ? "create"
        : "home";

  return (
    <>
      {/* ── Recents bottom sheet ── */}
      {showRecents && (
        <div className="fixed inset-0 z-40 lg:hidden" aria-label="Recent tools">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowRecents(false)}
          />
          {/* Sheet */}
          <div className="absolute bottom-16 left-0 right-0 max-h-[60vh] rounded-t-2xl border-t border-white/10 dark:border-white/[0.06] bg-white dark:bg-gray-900 overflow-y-auto"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-4 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconClock className="size-4 text-primary-500" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Recently Used
                  </h3>
                </div>
                <button
                  onClick={() => setShowRecents(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Close
                </button>
              </div>
            </div>

            {recentTools.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <IconClock className="size-8 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  No recent tools yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
                  Tools you use will appear here
                </p>
              </div>
            ) : (
              <div className="p-2">
                {recentTools.map((tool) => {
                  const ToolIcon = getIcon(tool.icon);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        setShowRecents(false);
                        router.push(`/tools/${tool.categoryId}/${tool.id}`);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="size-9 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                        <ToolIcon className="size-4.5 text-primary-500" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {tool.name}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {tool.categoryName}
                        </p>
                      </div>
                      <IconArrowRight className="size-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom navigation bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 lg:hidden z-30
          bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl
          border-t border-gray-200/60 dark:border-white/[0.06]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab || (tab.id === "recents" && showRecents);

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
                  if (tab.id === "recents") setShowRecents((v) => !v);
                }}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors min-w-0 ${
                  tab.id === "create"
                    ? "text-primary-500"
                    : isActive
                      ? "text-primary-500"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
                aria-label={tab.label}
              >
                {tab.id === "create" ? (
                  <div className="size-12 rounded-2xl bg-linear-to-br from-primary-500 to-secondary-500 flex items-center justify-center -mt-5 shadow-xl shadow-primary-500/30 ring-4 ring-white dark:ring-gray-950">
                    <Icon className="size-5 text-white" />
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Icon className="size-5" />
                      {tab.id === "recents" && recentIds.length > 0 && (
                        <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary-500" />
                      )}
                    </div>
                  </>
                )}
                <span className="text-[10px] font-medium leading-none">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
