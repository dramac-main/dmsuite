"use client";

import { useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { toolCategories } from "@/data/tools";
import { useParams } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import CreditBalance from "@/components/dashboard/CreditBalance";
import UserMenu from "@/components/dashboard/UserMenu";
import ThemeSwitch from "@/components/ThemeSwitch";
import { bgOpacity10 } from "@/lib/colors";
import { getIcon, IconArrowRight, IconChevronLeft, IconSparkles, IconZap, IconMenu } from "@/components/icons";
import { useSidebarStore } from "@/stores/sidebar";
import { usePreferencesStore } from "@/stores/preferences";
import { useAnalyticsStore } from "@/stores/analytics";
import { sidebar as sidebarConfig, surfaces, layout, interactive } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import NotificationPanel from "@/components/dashboard/NotificationPanel";
import SaveIndicator from "@/components/dashboard/SaveIndicator";
import SimilarTools from "@/components/dashboard/SimilarTools";

/* ── Dynamically imported workspace components ──────────────── */
const workspaceComponents: Record<string, React.ComponentType> = {
  // ── Existing / Phase 1-2 ──
  "ai-chat": dynamic(() => import("@/components/workspaces/AIChatWorkspace")),
  "logo-generator": dynamic(() => import("@/components/workspaces/LogoGeneratorWorkspace")),
  "social-media-post": dynamic(() => import("@/components/workspaces/SocialMediaPostWorkspace")),
  "ai-image-generator": dynamic(() => import("@/components/workspaces/StockImageBrowserWorkspace")),
  "photo-retoucher": dynamic(() => import("@/components/workspaces/StockImageBrowserWorkspace")),
  "brand-identity": dynamic(() => import("@/components/workspaces/BrandIdentityWorkspace")),
  "business-card": dynamic(() => import("@/components/workspaces/BusinessCardWorkspace")),
  "poster": dynamic(() => import("@/components/workspaces/PosterFlyerWorkspace")),
  "flyer": dynamic(() => import("@/components/workspaces/PosterFlyerWorkspace")),
  "banner-ad": dynamic(() => import("@/components/workspaces/BannerAdWorkspace")),
  "presentation": dynamic(() => import("@/components/workspaces/PresentationWorkspace")),
  "resume-cv": dynamic(() => import("@/components/workspaces/ResumeCVWorkspaceV2")),
  "invoice-designer": dynamic(() => import("@/components/workspaces/SalesBookWrappers").then((m) => ({ default: m.InvoiceBookWorkspace }))),
  "email-template": dynamic(() => import("@/components/workspaces/EmailTemplateWorkspace")),

  // ── Phase 3: Print & Stationery ──
  "brochure": dynamic(() => import("@/components/workspaces/BrochureDesignerWorkspace")),
  "letterhead": dynamic(() => import("@/components/workspaces/LetterheadDesignerWorkspace")),
  "envelope": dynamic(() => import("@/components/workspaces/EnvelopeDesignerWorkspace")),
  "certificate": dynamic(() => import("@/components/workspaces/CertificateDesignerWorkspace")),
  "infographic": dynamic(() => import("@/components/workspaces/InfographicDesignerWorkspace")),
  "menu-designer": dynamic(() => import("@/components/workspaces/MenuDesignerWorkspace")),
  "packaging-design": dynamic(() => import("@/components/workspaces/PackagingDesignerWorkspace")),
  "sticker-designer": dynamic(() => import("@/components/workspaces/StickerDesignerWorkspace")),

  // ── Phase 3: Apparel & Merchandise ──
  "tshirt-merch": dynamic(() => import("@/components/workspaces/ApparelDesignerWorkspace")),
  "id-badge": dynamic(() => import("@/components/workspaces/IDCardDesignerWorkspace")),

  // ── Phase 3: Promotional ──
  "gift-voucher": dynamic(() => import("@/components/workspaces/CouponDesignerWorkspace")),
  "calendar-designer": dynamic(() => import("@/components/workspaces/CalendarDesignerWorkspace")),
  "signage": dynamic(() => import("@/components/workspaces/SignageDesignerWorkspace")),

  // ── Phase 3: Business Documents ──
  "proposal-generator": dynamic(() => import("@/components/workspaces/ProposalWorkspace")),
  "contract-template": dynamic(() => import("@/components/workspaces/ContractWorkspace")),
  "quote-estimate": dynamic(() => import("@/components/workspaces/SalesBookWrappers").then((m) => ({ default: m.QuotationBookWorkspace }))),
  "report-generator": dynamic(() => import("@/components/workspaces/ReportWorkspace")),
  "receipt-designer": dynamic(() => import("@/components/workspaces/SalesBookWrappers").then((m) => ({ default: m.ReceiptBookWorkspace }))),
  "product-catalog": dynamic(() => import("@/components/workspaces/CatalogWorkspace")),

  // ── Phase 3: Sales Materials ──
  "price-list": dynamic(() => import("@/components/workspaces/PriceListWorkspace")),

  // ── Phase 3: Document Tools (New) ──
  "company-profile": dynamic(() => import("@/components/workspaces/CompanyProfileWorkspace")),
  "business-plan": dynamic(() => import("@/components/workspaces/BusinessPlanWorkspace")),
  "purchase-order": dynamic(() => import("@/components/workspaces/SalesBookWrappers").then((m) => ({ default: m.PurchaseOrderBookWorkspace }))),
  "delivery-note": dynamic(() => import("@/components/workspaces/SalesBookWrappers").then((m) => ({ default: m.DeliveryNoteBookWorkspace }))),
  "credit-note": dynamic(() => import("@/components/workspaces/SalesBookWrappers").then((m) => ({ default: m.CreditNoteBookWorkspace }))),
  "proforma-invoice": dynamic(() => import("@/components/workspaces/SalesBookWrappers").then((m) => ({ default: m.ProformaBookWorkspace }))),
  "diploma-designer": dynamic(() => import("@/components/workspaces/DiplomaDesignerWorkspace")),
  "statement-of-account": dynamic(() => import("@/components/workspaces/StatementOfAccountWorkspace")),
  "newsletter-print": dynamic(() => import("@/components/workspaces/NewsletterPrintWorkspace")),
  "employee-handbook": dynamic(() => import("@/components/workspaces/EmployeeHandbookWorkspace")),
  "job-description": dynamic(() => import("@/components/workspaces/JobDescriptionWorkspace")),
  "lookbook": dynamic(() => import("@/components/workspaces/LookbookWorkspace")),
  "line-sheet": dynamic(() => import("@/components/workspaces/LineSheetWorkspace")),
  "real-estate-listing": dynamic(() => import("@/components/workspaces/RealEstateListingWorkspace")),
  "event-program": dynamic(() => import("@/components/workspaces/EventProgramWorkspace")),
  "ticket-designer": dynamic(() => import("@/components/workspaces/TicketDesignerWorkspace")),
  "cover-letter": dynamic(() => import("@/components/workspaces/CoverLetterWorkspace")),
  "invitation-designer": dynamic(() => import("@/components/workspaces/InvitationDesignerWorkspace")),
  "training-manual": dynamic(() => import("@/components/workspaces/TrainingManualWorkspace")),
  "user-guide": dynamic(() => import("@/components/workspaces/UserGuideWorkspace")),
  "worksheet-designer": dynamic(() => import("@/components/workspaces/WorksheetDesignerWorkspace")),
  "white-paper": dynamic(() => import("@/components/workspaces/WhitePaperWorkspace")),
  "case-study": dynamic(() => import("@/components/workspaces/CaseStudyWorkspace")),
  "media-kit": dynamic(() => import("@/components/workspaces/MediaKitWorkspace")),
  "ebook-creator": dynamic(() => import("@/components/workspaces/EbookCreatorWorkspace")),
  "portfolio-builder": dynamic(() => import("@/components/workspaces/PortfolioBuilderWorkspace")),
  "greeting-card": dynamic(() => import("@/components/workspaces/GreetingCardWorkspace")),

  // ── Phase 3: Mockups ──
  "mockup-generator": dynamic(() => import("@/components/workspaces/MockupGeneratorWorkspace")),

  // ── Phase 4: Video & Motion ──
  "video-editor": dynamic(() => import("@/components/workspaces/VideoEditorWorkspace")),
  "text-to-video": dynamic(() => import("@/components/workspaces/AIVideoGeneratorWorkspace")),
  "logo-reveal": dynamic(() => import("@/components/workspaces/LogoRevealWorkspace")),
  "subtitle-caption": dynamic(() => import("@/components/workspaces/SubtitleGeneratorWorkspace")),
  "gif-converter": dynamic(() => import("@/components/workspaces/GifMakerWorkspace")),
  "thumbnail-generator": dynamic(() => import("@/components/workspaces/ThumbnailWorkspace")),
  "motion-graphics": dynamic(() => import("@/components/workspaces/MotionGraphicsWorkspace")),
  "video-compressor": dynamic(() => import("@/components/workspaces/VideoCompressorWorkspace")),
  "video-script": dynamic(() => import("@/components/workspaces/BlogWriterWorkspace")),

  // ── Phase 4: Audio ──
  "text-to-speech": dynamic(() => import("@/components/workspaces/TextToSpeechWorkspace")),
  "voice-cloning": dynamic(() => import("@/components/workspaces/VoiceClonerWorkspace")),
  "podcast-editor": dynamic(() => import("@/components/workspaces/PodcastToolsWorkspace")),
  "music-generator": dynamic(() => import("@/components/workspaces/MusicGeneratorWorkspace")),
  "audio-transcription": dynamic(() => import("@/components/workspaces/TranscriptionWorkspace")),

  // ── Phase 4: Content Writing ──
  "blog-writer": dynamic(() => import("@/components/workspaces/BlogWriterWorkspace")),
  "social-caption": dynamic(() => import("@/components/workspaces/SocialCopyWorkspace")),
  "email-campaign": dynamic(() => import("@/components/workspaces/EmailCopyWorkspace")),
  "product-description": dynamic(() => import("@/components/workspaces/ProductDescriptionWorkspace")),
  "content-calendar": dynamic(() => import("@/components/workspaces/ContentCalendarWorkspace")),
  "seo-optimizer": dynamic(() => import("@/components/workspaces/SEOOptimizerWorkspace")),

  // ── Phase 4: Marketing ──
  "landing-page-copy": dynamic(() => import("@/components/workspaces/LandingPageWorkspace")),
  "sales-funnel": dynamic(() => import("@/components/workspaces/SalesFunnelWorkspace")),
  "lead-magnet": dynamic(() => import("@/components/workspaces/LeadMagnetWorkspace")),
  "email-sequence": dynamic(() => import("@/components/workspaces/EmailSequenceWorkspace")),
  "qr-code": dynamic(() => import("@/components/workspaces/QRCodeWorkspace")),
  "analytics-dashboard": dynamic(() => import("@/components/workspaces/AnalyticsDashboardWorkspace")),

  // ── Phase 4: Web & UI ──
  "wireframe-generator": dynamic(() => import("@/components/workspaces/WireframeWorkspace")),
  "ui-component-designer": dynamic(() => import("@/components/workspaces/UIComponentWorkspace")),
  "color-palette": dynamic(() => import("@/components/workspaces/ColorPaletteWorkspace")),
  "icon-illustration": dynamic(() => import("@/components/workspaces/IconGeneratorWorkspace")),

  // ── Phase 4: Utilities ──
  "file-converter": dynamic(() => import("@/components/workspaces/FileConverterWorkspace")),
  "batch-processor": dynamic(() => import("@/components/workspaces/BatchProcessorWorkspace")),
  "background-remover": dynamic(() => import("@/components/workspaces/BackgroundRemoverWorkspace")),
  "image-enhancer": dynamic(() => import("@/components/workspaces/ImageEnhancerWorkspace")),
  "pdf-tools": dynamic(() => import("@/components/workspaces/PDFToolsWorkspace")),
};

export default function ToolWorkspacePage() {
  const params = useParams();
  const categoryId = params.categoryId as string;
  const toolId = params.toolId as string;
  const pinned = useSidebarStore((s) => s.pinned);
  const openMobile = useSidebarStore((s) => s.openMobile);
  const addRecentTool = usePreferencesStore((s) => s.addRecentTool);
  const setLastVisited = usePreferencesStore((s) => s.setLastVisited);
  const trackOpen = useAnalyticsStore((s) => s.trackOpen);
  const trackTime = useAnalyticsStore((s) => s.trackTime);

  // Track tool usage on mount + time spent
  useEffect(() => {
    if (!toolId) return;
    addRecentTool(toolId);
    trackOpen(toolId);
    if (categoryId) setLastVisited(categoryId, toolId);
    const start = Date.now();
    return () => {
      const elapsed = Math.round((Date.now() - start) / 1000);
      if (elapsed > 2) trackTime(toolId, elapsed);
    };
  }, [toolId, categoryId, addRecentTool, setLastVisited, trackOpen, trackTime]);

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

  const ToolIcon = getIcon(tool.icon);
  const CategoryIcon = getIcon(category.icon);
  const iconBg = bgOpacity10[category.colorClass] || "bg-gray-500/10";
  const WorkspaceComponent = workspaceComponents[toolId];

  // Status badge helpers
  const statusColor = tool.status === "ready" ? "success" : tool.status === "beta" ? "warning" : "info";
  const statusLabel = tool.status === "ready" ? "Ready" : tool.status === "beta" ? "Beta" : "Soon";

  // ── Workspace mode: compact full-height layout ──
  if (WorkspaceComponent) {
    return (
      <div className={cn("h-dvh overflow-hidden", surfaces.page, "transition-colors")}>
        <Sidebar />
        <main
          className={cn(
            "h-dvh flex flex-col overflow-hidden",
            sidebarConfig.transition,
            pinned ? sidebarConfig.mainMarginExpanded : sidebarConfig.mainMarginCollapsed
          )}
        >
          {/* ── Compact workspace header ── */}
          <header className="shrink-0 flex items-center justify-between h-12 px-3 sm:px-4 border-b border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-950">
            {/* Left: menu + breadcrumb + tool info */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <button
                onClick={openMobile}
                className={cn(interactive.iconButton, "lg:hidden !size-8")}
                aria-label="Open menu"
              >
                <IconMenu className="size-4.5" />
              </button>

              <nav className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <Link
                  href="/dashboard"
                  className="text-[11px] sm:text-xs text-gray-400 hover:text-primary-500 transition-colors hidden sm:block"
                >
                  Dashboard
                </Link>
                <IconArrowRight className="size-2.5 text-gray-500/60 hidden sm:block" />
                <Link
                  href={`/dashboard#${category.id}`}
                  className="flex items-center gap-1 text-[11px] sm:text-xs text-gray-400 hover:text-primary-500 transition-colors hidden md:flex"
                >
                  <CategoryIcon className="size-3" />
                  <span className="truncate max-w-28">{category.name}</span>
                </Link>
                <IconArrowRight className="size-2.5 text-gray-500/60 hidden md:block" />
                <div className="flex items-center gap-1.5">
                  <div className={`size-6 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                    <ToolIcon className={`size-3.5 ${category.textColorClass}`} />
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900 dark:text-white truncate max-w-48 sm:max-w-none">
                    {tool.name}
                  </span>
                  <span className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-${statusColor}/15 text-${statusColor}`}>
                    <span className={`size-1 rounded-full bg-${statusColor}`} />
                    {statusLabel}
                  </span>
                </div>
              </nav>
            </div>

            {/* Right: utilities */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <SaveIndicator />
              <span className="hidden sm:inline-flex"><CreditBalance /></span>
              <span className="hidden sm:inline-flex"><ThemeSwitch /></span>
              <NotificationPanel />
              <UserMenu />
            </div>
          </header>

          {/* ── Full-height workspace ── */}
          <div className="flex-1 overflow-hidden">
            <WorkspaceComponent />
          </div>
        </main>
      </div>
    );
  }

  // ── Placeholder mode: tools without workspace ──
  return (
    <div className={cn("min-h-dvh", surfaces.page, "transition-colors")}>
      <Sidebar />

      <main
        className={cn(
          "min-h-dvh",
          sidebarConfig.transition,
          pinned ? sidebarConfig.mainMarginExpanded : sidebarConfig.mainMarginCollapsed
        )}
      >
        <div className={layout.container}>
          <TopBar onMenuClick={openMobile} title={tool.name} />

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-6">
            <Link href="/dashboard" className="text-gray-400 hover:text-primary-500 transition-colors">
              Dashboard
            </Link>
            <IconArrowRight className="size-3 text-gray-400" />
            <Link href={`/dashboard#${category.id}`} className="text-gray-400 hover:text-primary-500 transition-colors flex items-center gap-1.5">
              <CategoryIcon className="size-3.5" />
              {category.name}
            </Link>
            <IconArrowRight className="size-3 text-gray-400" />
            <span className="text-gray-900 dark:text-white font-medium">{tool.name}</span>
          </nav>

          {/* Tool info card */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className={`size-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <ToolIcon className={`size-6 ${category.textColorClass}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                    {tool.name}
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-${statusColor}/15 text-${statusColor}`}>
                    <span className={`size-1.5 rounded-full bg-${statusColor}`} />
                    {statusLabel}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                  {tool.description}
                </p>
              </div>
            </div>
          </div>

          {/* Placeholder workspace */}
          <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 min-h-96 flex flex-col items-center justify-center p-8">
            <div className="size-16 rounded-2xl bg-linear-to-br from-primary-500/10 to-secondary-500/10 border border-primary-500/20 flex items-center justify-center mb-5">
              <IconSparkles className="size-7 text-primary-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
              {tool.name} Workspace
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm text-center mb-5">
              Upload your assets, configure settings, and let AI do the heavy lifting.
            </p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm font-semibold
                cursor-not-allowed">
                <IconZap className="size-4" />
                Coming Soon
              </span>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                  border border-gray-200 dark:border-gray-700
                  text-gray-600 dark:text-gray-400 text-sm font-medium
                  hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <IconChevronLeft className="size-4" />
                Back
              </Link>
            </div>
          </div>

          {/* Similar tools from same category */}
          <div className="mt-6">
            <SimilarTools categoryId={categoryId} currentToolId={toolId} max={6} />
          </div>
        </div>
      </main>
    </div>
  );
}
