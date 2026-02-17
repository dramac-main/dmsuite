"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { toolCategories } from "@/data/tools";
import { bgOpacity10 } from "@/lib/colors";
import {
  iconMap,
  IconArrowRight,
  IconChevronLeft,
  IconSparkles,
  IconZap,
} from "@/components/icons";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WorkspaceShellProps {
  /** The workspace UI to render inside the shell. When omitted, a default
   *  placeholder (coming-soon) card is rendered. */
  children?: ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Shared shell that wraps every tool workspace. Provides:
 * - Sidebar (desktop persistent, mobile overlay)
 * - TopBar with menu toggle
 * - Breadcrumbs (Dashboard → Category → Tool)
 * - Tool header card (icon, name, status badge, description, tags)
 * - Children slot for the actual workspace content
 */
export default function WorkspaceShell({ children }: WorkspaceShellProps) {
  const params = useParams();
  const categoryId = params.categoryId as string;
  const toolId = params.toolId as string;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Resolve category & tool from the registry
  const category = toolCategories.find((c) => c.id === categoryId);
  const tool = category?.tools.find((t) => t.id === toolId);

  // 404 state
  if (!category || !tool) {
    return (
      <div className="min-h-dvh bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Tool Not Found
          </h1>
          <p className="text-gray-500 mb-4">
            The tool you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/dashboard"
            className="text-primary-500 hover:text-primary-400 font-medium text-sm flex items-center gap-1 justify-center"
          >
            <IconChevronLeft className="size-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const ToolIcon = iconMap[tool.icon];
  const CategoryIcon = iconMap[category.icon];
  const iconBg = bgOpacity10[category.colorClass] || "bg-gray-500/10";

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-950 transition-colors">
      <Sidebar
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <main className="lg:ml-60 min-h-dvh">
        <div className="px-4 py-4 sm:px-6 sm:py-6 max-w-screen-2xl mx-auto">
          <TopBar
            onMenuClick={() => setSidebarOpen(true)}
            title={tool.name}
          />

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-primary-500 transition-colors"
            >
              Dashboard
            </Link>
            <IconArrowRight className="size-3 text-gray-400" aria-hidden />
            <Link
              href={`/dashboard#${category.id}`}
              className="text-gray-400 hover:text-primary-500 transition-colors flex items-center gap-1.5"
            >
              {CategoryIcon && <CategoryIcon className="size-3.5" />}
              {category.name}
            </Link>
            <IconArrowRight className="size-3 text-gray-400" aria-hidden />
            <span className="text-gray-900 dark:text-white font-medium">
              {tool.name}
            </span>
          </nav>

          {/* Tool header card */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8 mb-6">
            <div className="flex items-start gap-4 sm:gap-6">
              <div
                className={`size-14 sm:size-16 rounded-2xl ${iconBg} flex items-center justify-center shrink-0`}
              >
                {ToolIcon && (
                  <ToolIcon
                    className={`size-7 sm:size-8 ${category.textColorClass}`}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {tool.name}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                      ${
                        tool.status === "ready"
                          ? "bg-success/15 text-success"
                          : tool.status === "beta"
                            ? "bg-warning/15 text-warning"
                            : "bg-info/15 text-info"
                      }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        tool.status === "ready"
                          ? "bg-success"
                          : tool.status === "beta"
                            ? "bg-warning"
                            : "bg-info"
                      }`}
                    />
                    {tool.status === "ready"
                      ? "Ready"
                      : tool.status === "beta"
                        ? "Beta"
                        : "Coming Soon"}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
                  {tool.description}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {tool.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Workspace content or placeholder */}
          {children ?? <DefaultPlaceholder toolName={tool.name} />}
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default Placeholder — rendered when no children are provided
// ---------------------------------------------------------------------------

function DefaultPlaceholder({ toolName }: { toolName: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 min-h-96 flex flex-col items-center justify-center p-8">
      <div className="size-20 rounded-2xl bg-linear-to-br from-primary-500/10 to-secondary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
        <IconSparkles className="size-8 text-primary-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
        {toolName} Workspace
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md text-center mb-6">
        This is where the AI-powered tool interface will live. Upload your
        assets, configure settings, and let AI do the heavy lifting.
      </p>
      <div className="flex items-center gap-3">
        <button
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-primary-500 text-gray-950 text-sm font-semibold
            hover:bg-primary-400 transition-colors shadow-lg shadow-primary-500/20"
        >
          <IconZap className="size-4" />
          Start Creating
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
            border border-gray-200 dark:border-gray-700
            text-gray-600 dark:text-gray-400 text-sm font-medium
            hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <IconChevronLeft className="size-4" />
          Back
        </Link>
      </div>
    </div>
  );
}
