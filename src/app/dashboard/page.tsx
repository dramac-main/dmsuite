"use client";

import { useState, Suspense } from "react";
import { toolCategories } from "@/data/tools";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import HeroBanner from "@/components/dashboard/HeroBanner";
import StatsBar from "@/components/dashboard/StatsBar";
import QuickAccess from "@/components/dashboard/QuickAccess";
import CategorySection from "@/components/dashboard/CategorySection";
import { Skeleton } from "@/components/ui";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Sidebar */}
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main id="main-content" className="lg:ml-60 min-h-dvh">
        <div className="px-4 py-4 sm:px-6 sm:py-6 max-w-screen-2xl mx-auto">
          {/* Top Bar */}
          <TopBar onMenuClick={() => setSidebarOpen(true)} title="AI Suite" />

          {/* Hero Banner with Search */}
          <HeroBanner />

          {/* Stats Overview */}
          <Suspense fallback={<div className="h-24 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse mb-6" />}>
            <StatsBar />
          </Suspense>

          {/* Quick Access — Featured Tools */}
          <Suspense fallback={<div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse mb-6" />}>
            <QuickAccess />
          </Suspense>

          {/* Category Sections — All Tools */}
          <Suspense fallback={<SectionSkeleton />}>
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  All Categories
                </h2>
                <span className="text-xs text-gray-400">
                  {toolCategories.length} categories &middot; {toolCategories.reduce((a, c) => a + c.tools.length, 0)} tools
                </span>
              </div>
              {toolCategories.map((category, i) => (
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
    </div>
  );
}
