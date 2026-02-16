"use client";

import { useState } from "react";
import { toolCategories } from "@/data/tools";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import HeroBanner from "@/components/dashboard/HeroBanner";
import StatsBar from "@/components/dashboard/StatsBar";
import QuickAccess from "@/components/dashboard/QuickAccess";
import CategorySection from "@/components/dashboard/CategorySection";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Sidebar */}
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="lg:ml-60 min-h-dvh">
        <div className="px-4 py-4 sm:px-6 sm:py-6 max-w-screen-2xl mx-auto">
          {/* Top Bar */}
          <TopBar onMenuClick={() => setSidebarOpen(true)} title="AI Suite" />

          {/* Hero Banner with Search */}
          <HeroBanner />

          {/* Stats Overview */}
          <StatsBar />

          {/* Quick Access — Featured Tools */}
          <QuickAccess />

          {/* Category Sections — All Tools */}
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
        </div>
      </main>
    </div>
  );
}
