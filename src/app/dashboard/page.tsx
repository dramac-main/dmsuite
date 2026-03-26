"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { toolCategories } from "@/data/tools";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import HeroBanner from "@/components/dashboard/HeroBanner";
import StatsBar from "@/components/dashboard/StatsBar";
import QuickAccess from "@/components/dashboard/QuickAccess";
import RecentTools from "@/components/dashboard/RecentTools";
import FavoriteTools from "@/components/dashboard/FavoriteTools";
import WhatsNew from "@/components/dashboard/WhatsNew";
import ActiveProjects from "@/components/dashboard/ActiveProjects";
import ExploreSection from "@/components/dashboard/ExploreSection";
import OnboardingTour from "@/components/dashboard/OnboardingTour";
import CategoryToolbar, { type SortOption, type FilterStatus } from "@/components/dashboard/CategoryToolbar";
import CategorySection from "@/components/dashboard/CategorySection";
import DashboardCustomizer from "@/components/dashboard/DashboardCustomizer";
import SessionContinuity from "@/components/dashboard/SessionContinuity";
import { Skeleton } from "@/components/ui";
import { useSidebarStore } from "@/stores/sidebar";
import { usePreferencesStore } from "@/stores/preferences";
import { useNotificationStore, notify } from "@/stores/notifications";
import { sidebar as sidebarConfig, surfaces, layout } from "@/lib/design-system";
import { cn } from "@/lib/utils";

function SectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-48 rounded-lg bg-gray-200 dark:bg-gray-800" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const pinned = useSidebarStore((s) => s.pinned);
  const openMobile = useSidebarStore((s) => s.openMobile);
  const hiddenSections = usePreferencesStore((s) => s.hiddenSections);
  const notifications = useNotificationStore((s) => s.notifications);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  // Welcome notification for first-time visitors
  useEffect(() => {
    if (notifications.length === 0) {
      notify.info(
        "Welcome to DMSuite!",
        "Your AI-powered creative suite is ready. Explore 116+ tools for design, business documents, and marketing.",
        "/dashboard",
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredCategories = useMemo(() => {
    return toolCategories
      .map((cat) => {
        let tools = cat.tools;
        if (filterStatus !== "all") {
          tools = tools.filter((t) =>
            filterStatus === "ready"
              ? t.status === "ready"
              : filterStatus === "beta"
                ? t.status === "beta"
                : t.status === "coming-soon"
          );
        }
        if (sortBy === "name-asc") tools = [...tools].sort((a, b) => a.name.localeCompare(b.name));
        else if (sortBy === "name-desc") tools = [...tools].sort((a, b) => b.name.localeCompare(a.name));
        else if (sortBy === "status") {
          const order = { ready: 0, beta: 1, "coming-soon": 2 };
          tools = [...tools].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
        }
        return { ...cat, tools };
      })
      .filter((cat) => cat.tools.length > 0);
  }, [sortBy, filterStatus]);

  const totalFilteredTools = filteredCategories.reduce((a, c) => a + c.tools.length, 0);

  return (
    <div className={cn("min-h-dvh relative", surfaces.page, "transition-colors")}>
      {/* ── Ambient gradient background ── */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-primary-500/[0.04] dark:bg-primary-500/[0.06] blur-[120px]" />
        <div className="absolute -bottom-[30%] -left-[20%] w-[60%] h-[60%] rounded-full bg-secondary-500/[0.04] dark:bg-secondary-500/[0.06] blur-[120px]" />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main
        id="main-content"
        className={cn(
          "min-h-dvh",
          sidebarConfig.transition,
          pinned ? sidebarConfig.mainMarginExpanded : sidebarConfig.mainMarginCollapsed
        )}
      >
        <div className={layout.container}>
          {/* Top Bar */}
          <TopBar onMenuClick={openMobile} title="AI Suite" />

          {/* Hero Banner with Search */}
          <HeroBanner />

          {/* Session continuity prompt */}
          <SessionContinuity />

          {/* Stats Overview */}
          <Suspense fallback={<div className="h-24 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse mb-6" />}>
            <StatsBar />
          </Suspense>

          {/* Favorite Tools */}
          {!hiddenSections.includes("favorites") && (
            <Suspense fallback={null}>
              <FavoriteTools />
            </Suspense>
          )}

          {/* Recently Used */}
          {!hiddenSections.includes("recent") && (
            <Suspense fallback={null}>
              <RecentTools />
            </Suspense>
          )}

          {/* Active Projects */}
          {!hiddenSections.includes("projects") && (
            <Suspense fallback={null}>
              <ActiveProjects />
            </Suspense>
          )}

          {/* Quick Access — Featured Tools */}
          {!hiddenSections.includes("quick-access") && (
            <Suspense fallback={<div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse mb-6" />}>
              <QuickAccess />
            </Suspense>
          )}

          {/* What's New — Changelog */}
          {!hiddenSections.includes("whats-new") && (
            <Suspense fallback={null}>
              <WhatsNew />
            </Suspense>
          )}

          {/* Explore — Curated collections */}
          {!hiddenSections.includes("explore") && (
            <Suspense fallback={null}>
              <ExploreSection />
            </Suspense>
          )}

          {/* Category Sections — All Tools */}
          <Suspense fallback={<SectionSkeleton />}>
            <div id="categories" data-tour="categories">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  All Categories
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 bg-gray-100/80 dark:bg-gray-800/50 px-3 py-1 rounded-full">
                    {filteredCategories.length} categories &middot; {totalFilteredTools} tools
                  </span>
                  <DashboardCustomizer />
                </div>
              </div>
              <div className="mb-6">
                <CategoryToolbar
                  sortBy={sortBy}
                  filterStatus={filterStatus}
                  onSortChange={setSortBy}
                  onFilterChange={setFilterStatus}
                  totalCount={totalFilteredTools}
                />
              </div>
              {filteredCategories.map((category, i) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  defaultExpanded={i < 2}
                />
              ))}
            </div>
          </Suspense>
        </div>
      </main>

      {/* First-visit onboarding tour */}
      <OnboardingTour />
    </div>
  );
}
