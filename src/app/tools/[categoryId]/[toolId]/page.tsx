"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { toolCategories } from "@/data/tools";
import { useParams } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { bgOpacity10 } from "@/lib/colors";
import { iconMap, IconArrowRight, IconChevronLeft, IconSparkles, IconZap } from "@/components/icons";

/* ── Dynamically imported workspace components ──────────────── */
const workspaceComponents: Record<string, React.ComponentType> = {
  "ai-chat": dynamic(() => import("@/components/workspaces/AIChatWorkspace")),
  "logo-generator": dynamic(() => import("@/components/workspaces/LogoGeneratorWorkspace")),
  "social-media-post": dynamic(() => import("@/components/workspaces/SocialMediaPostWorkspace")),
  "ai-image-generator": dynamic(() => import("@/components/workspaces/StockImageBrowserWorkspace")),
  "image-enhancer": dynamic(() => import("@/components/workspaces/StockImageBrowserWorkspace")),
  "background-remover": dynamic(() => import("@/components/workspaces/StockImageBrowserWorkspace")),
  "photo-retoucher": dynamic(() => import("@/components/workspaces/StockImageBrowserWorkspace")),
  "brand-identity": dynamic(() => import("@/components/workspaces/BrandIdentityWorkspace")),
  "business-card": dynamic(() => import("@/components/workspaces/BusinessCardWorkspace")),
  "poster": dynamic(() => import("@/components/workspaces/PosterFlyerWorkspace")),
  "flyer": dynamic(() => import("@/components/workspaces/PosterFlyerWorkspace")),
  "banner-ad": dynamic(() => import("@/components/workspaces/BannerAdWorkspace")),
  "presentation": dynamic(() => import("@/components/workspaces/PresentationWorkspace")),
  "resume-cv": dynamic(() => import("@/components/workspaces/ResumeCVWorkspace")),
  "invoice-designer": dynamic(() => import("@/components/workspaces/InvoiceDesignerWorkspace")),
  "email-template": dynamic(() => import("@/components/workspaces/EmailTemplateWorkspace")),
};

export default function ToolWorkspacePage() {
  const params = useParams();
  const categoryId = params.categoryId as string;
  const toolId = params.toolId as string;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Find the category and tool
  const category = toolCategories.find((c) => c.id === categoryId);
  const tool = category?.tools.find((t) => t.id === toolId);

  if (!category || !tool) {
    return (
      <div className="min-h-dvh bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tool Not Found</h1>
          <p className="text-gray-500 mb-4">The tool you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/dashboard" className="text-primary-500 hover:text-primary-400 font-medium text-sm flex items-center gap-1 justify-center">
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

  /** Render the appropriate workspace based on the tool ID */
  function renderWorkspace() {
    const WorkspaceComponent = workspaceComponents[toolId];
    if (WorkspaceComponent) {
      return <WorkspaceComponent />;
    }

    // Default placeholder for tools not yet built
    const toolName = tool!.name;
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 min-h-96 flex flex-col items-center justify-center p-8">
        <div className="size-20 rounded-2xl bg-linear-to-br from-primary-500/10 to-secondary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
          <IconSparkles className="size-8 text-primary-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          {toolName} Workspace
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md text-center mb-6">
          This is where the AI-powered tool interface will live.
          Upload your assets, configure settings, and let AI do the heavy lifting.
        </p>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-primary-500 text-gray-950 text-sm font-semibold
            hover:bg-primary-400 transition-colors shadow-lg shadow-primary-500/20">
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

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-950 transition-colors">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-60 min-h-dvh">
        <div className="px-4 py-4 sm:px-6 sm:py-6 max-w-screen-2xl mx-auto">
          <TopBar onMenuClick={() => setSidebarOpen(true)} title={tool.name} />

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-6">
            <Link href="/dashboard" className="text-gray-400 hover:text-primary-500 transition-colors">
              Dashboard
            </Link>
            <IconArrowRight className="size-3 text-gray-400" />
            <Link href={`/dashboard#${category.id}`} className="text-gray-400 hover:text-primary-500 transition-colors flex items-center gap-1.5">
              {CategoryIcon && <CategoryIcon className="size-3.5" />}
              {category.name}
            </Link>
            <IconArrowRight className="size-3 text-gray-400" />
            <span className="text-gray-900 dark:text-white font-medium">{tool.name}</span>
          </nav>

          {/* Tool workspace header */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8 mb-6">
            <div className="flex items-start gap-4 sm:gap-6">
              {/* Tool icon */}
              <div className={`size-14 sm:size-16 rounded-2xl ${iconBg} flex items-center justify-center shrink-0`}>
                {ToolIcon && <ToolIcon className={`size-7 sm:size-8 ${category.textColorClass}`} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {tool.name}
                  </h1>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                    ${tool.status === "ready" ? "bg-success/15 text-success" : tool.status === "beta" ? "bg-warning/15 text-warning" : "bg-info/15 text-info"}`}
                  >
                    <span className={`size-1.5 rounded-full ${tool.status === "ready" ? "bg-success" : tool.status === "beta" ? "bg-warning" : "bg-info"}`} />
                    {tool.status === "ready" ? "Ready" : tool.status === "beta" ? "Beta" : "Coming Soon"}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
                  {tool.description}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {tool.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Render the tool-specific workspace */}
          {renderWorkspace()}
        </div>
      </main>
    </div>
  );
}
