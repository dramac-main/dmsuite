"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { toolCategories } from "@/data/tools";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import CreditBalance from "@/components/dashboard/CreditBalance";
import UserMenu from "@/components/dashboard/UserMenu";
import ThemeSwitch from "@/components/ThemeSwitch";
import { bgOpacity10 } from "@/lib/colors";
import { getIcon, IconArrowRight, IconChevronLeft, IconSparkles, IconZap, IconMenu, IconFolder } from "@/components/icons";
import { useSidebarStore } from "@/stores/sidebar";
import { usePreferencesStore } from "@/stores/preferences";
import { useAnalyticsStore } from "@/stores/analytics";
import { useProjectStore } from "@/stores/projects";
import { notify } from "@/stores/notifications";
import { sidebar as sidebarConfig, surfaces, layout, interactive } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import NotificationPanel from "@/components/dashboard/NotificationPanel";
import SaveIndicator from "@/components/dashboard/SaveIndicator";
import SimilarTools from "@/components/dashboard/SimilarTools";
import ProjectPickerModal from "@/components/dashboard/ProjectPickerModal";
import { useProjectData } from "@/hooks/useProjectData";

/* ── Dynamically imported workspace components ──────────────── */
const workspaceComponents: Record<string, React.ComponentType> = {
  // ── Existing / Phase 1-2 ──
  "logo-generator": dynamic(() => import("@/components/workspaces/LogoGeneratorWorkspace")),
  "social-media-post": dynamic(() => import("@/components/workspaces/SocialMediaPostWorkspace")),
  "ai-image-generator": dynamic(() => import("@/components/workspaces/StockImageBrowserWorkspace")),
  "photo-retoucher": dynamic(() => import("@/components/workspaces/StockImageBrowserWorkspace")),
  "brand-identity": dynamic(() => import("@/components/workspaces/BrandIdentityWorkspace")),
  "business-card": dynamic(() => import("@/components/workspaces/BusinessCardWorkspace")),
  "poster": dynamic(() => import("@/components/workspaces/PosterFlyerWorkspace")),
  "flyer": dynamic(() => import("@/components/workspaces/PosterFlyerWorkspace")),
  "banner-ad": dynamic(() => import("@/components/workspaces/BannerAdWorkspace")),
  "presentation": dynamic(() => import("@/components/workspaces/slidev-presenter/SlidevPresenterWorkspace")),
  "resume-cv": dynamic(() => import("@/components/workspaces/resume-cv/ResumeBuilderWorkspace")),
  "resume-cv-v2": dynamic(() => import("@/components/workspaces/resume-cv-v2/ResumeCVV2Workspace")),
  "invoice-designer": dynamic(() => import("@/components/workspaces/SalesBookWrappers").then((m) => ({ default: m.InvoiceBookWorkspace }))),
  "email-template": dynamic(() => import("@/components/workspaces/EmailTemplateWorkspace")),

  // ── Phase 3: Print & Stationery ──
  "brochure": dynamic(() => import("@/components/workspaces/BrochureDesignerWorkspace")),
  "letterhead": dynamic(() => import("@/components/workspaces/LetterheadDesignerWorkspace")),
  "envelope": dynamic(() => import("@/components/workspaces/EnvelopeDesignerWorkspace")),
  "certificate": dynamic(() => import("@/components/workspaces/certificate-designer/CertificateDesignerWorkspace")),
  "infographic": dynamic(() => import("@/components/workspaces/InfographicDesignerWorkspace")),
  "menu-designer": dynamic(() => import("@/components/workspaces/menu-designer/MenuDesignerWorkspace")),
  "packaging-design": dynamic(() => import("@/components/workspaces/PackagingDesignerWorkspace")),
  "sticker-designer": dynamic(() => import("@/components/workspaces/StickerDesignerWorkspace")),

  // ── Phase 3: Apparel & Merchandise ──
  "tshirt-merch": dynamic(() => import("@/components/workspaces/ApparelDesignerWorkspace")),
  "id-badge": dynamic(() => import("@/components/workspaces/id-badge-designer/IDBadgeDesignerWorkspace")),

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
  "business-plan": dynamic(() => import("@/components/workspaces/business-plan-writer/BusinessPlanWriterWorkspace")),
  "purchase-order": dynamic(() => import("@/components/workspaces/SalesBookWrappers").then((m) => ({ default: m.PurchaseOrderBookWorkspace }))),
  "delivery-note": dynamic(() => import("@/components/workspaces/SalesBookWrappers").then((m) => ({ default: m.DeliveryNoteBookWorkspace }))),
  "credit-note": dynamic(() => import("@/components/workspaces/SalesBookWrappers").then((m) => ({ default: m.CreditNoteBookWorkspace }))),
  "proforma-invoice": dynamic(() => import("@/components/workspaces/SalesBookWrappers").then((m) => ({ default: m.ProformaBookWorkspace }))),
  "diploma-designer": dynamic(() => import("@/components/workspaces/diploma-designer/DiplomaDesignerWorkspace")),
  "statement-of-account": dynamic(() => import("@/components/workspaces/StatementOfAccountWorkspace")),
  "newsletter-print": dynamic(() => import("@/components/workspaces/NewsletterPrintWorkspace")),
  "employee-handbook": dynamic(() => import("@/components/workspaces/EmployeeHandbookWorkspace")),
  "job-description": dynamic(() => import("@/components/workspaces/JobDescriptionWorkspace")),
  "lookbook": dynamic(() => import("@/components/workspaces/LookbookWorkspace")),
  "line-sheet": dynamic(() => import("@/components/workspaces/LineSheetWorkspace")),
  "real-estate-listing": dynamic(() => import("@/components/workspaces/RealEstateListingWorkspace")),
  "event-program": dynamic(() => import("@/components/workspaces/EventProgramWorkspace")),
  "ticket-designer": dynamic(() => import("@/components/workspaces/ticket-designer/TicketDesignerWorkspace")),
  "cover-letter": dynamic(() => import("@/components/workspaces/cover-letter-writer/CoverLetterWriterWorkspace")),
  "invitation-designer": dynamic(() => import("@/components/workspaces/InvitationDesignerWorkspace")),
  "training-manual": dynamic(() => import("@/components/workspaces/TrainingManualWorkspace")),
  "user-guide": dynamic(() => import("@/components/workspaces/UserGuideWorkspace")),
  "worksheet-designer": dynamic(() => import("@/components/workspaces/worksheet-designer/WorksheetDesignerWorkspace")),
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
  "audio-transcription": dynamic(() => import("@/components/workspaces/audio-transcription/AudioTranscriptionWorkspace")),
  "voice-flow": dynamic(() => import("@/components/workspaces/voice-flow/VoiceFlowWorkspace")),

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
  "pdf-tools": dynamic(() => import("@/components/workspaces/pdf-tools/PDFToolsWorkspace")),
  "document-signer": dynamic(() => import("@/components/workspaces/document-signer/DocumentSignerWorkspace")),
  "invoice-tracker": dynamic(() => import("@/components/workspaces/invoice-accounting/InvoiceAccountingWorkspace")),
  "sketch-board": dynamic(() => import("@/components/workspaces/sketch-board/SketchBoardWorkspace")),

  // ── AI Flow Builder ──
  "ai-flow-builder": dynamic(() => import("@/components/workspaces/ai-flow-builder/AIFlowBuilderWorkspace")),

  // ── AI Chat ──
  "ai-chat": dynamic(() => import("@/components/workspaces/ai-chat/AIChatWorkspace")),
  "ai-chat-v2": dynamic(() => import("@/components/workspaces/ai-chat-v2/AIChatV2Workspace")),
};

export default function ToolWorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryId = params.categoryId as string;
  const toolId = params.toolId as string;
  const pinned = useSidebarStore((s) => s.pinned);
  const openMobile = useSidebarStore((s) => s.openMobile);
  const addRecentTool = usePreferencesStore((s) => s.addRecentTool);
  const setLastVisited = usePreferencesStore((s) => s.setLastVisited);
  const trackOpen = useAnalyticsStore((s) => s.trackOpen);
  const trackTime = useAnalyticsStore((s) => s.trackTime);
  const addProject = useProjectStore((s) => s.addProject);
  const touchProject = useProjectStore((s) => s.touchProject);
  const renameProject = useProjectStore((s) => s.renameProject);
  const projects = useProjectStore((s) => s.projects);
  const updateProject = useProjectStore((s) => s.updateProject);
  const addMilestone = useProjectStore((s) => s.addMilestone);
  const syncFromServer = useProjectStore((s) => s.syncFromServer);
  const hasSynced = useProjectStore((s) => s.hasSynced);
  const projectIdRef = useRef<string | null>(null);
  const hasNotifiedRef = useRef(false);
  const dirtyCountRef = useRef(0);

  // ── Project management state ──
  const urlProjectId = searchParams.get("project");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(urlProjectId);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const editNameRef = useRef<HTMLInputElement>(null);

  // Use project data hook for IndexedDB persistence
  const { isReady: projectReady, saveToProject } = useProjectData({
    toolId,
    projectId: activeProjectId,
  });

  // Get current project from store
  const currentProject = projects.find((p) => p.id === activeProjectId);

  // Determine if this tool has existing projects
  const toolProjects = projects.filter((p) => p.toolId === toolId);
  const hasExistingProjects = toolProjects.length > 0;

  // Navigate to a project (updates URL)
  const navigateToProject = useCallback((projectId: string) => {
    setActiveProjectId(projectId);
    projectIdRef.current = projectId;
    setShowProjectPicker(false);
    // Update URL without full navigation
    const url = new URL(window.location.href);
    url.searchParams.set("project", projectId);
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  // Create a new project and navigate to it
  const handleCreateNewProject = useCallback(async () => {
    // Save current project data before switching
    if (activeProjectId) await saveToProject();
    const cat = toolCategories.find((c) => c.id === categoryId);
    const t = cat?.tools.find((t) => t.id === toolId);
    const baseName = t ? `${t.name} Project` : "Untitled Project";
    // Generate unique name so projects are never confused
    const existingNames = new Set(toolProjects.map((p) => p.name));
    let name = baseName;
    if (existingNames.has(name)) {
      let i = 2;
      while (existingNames.has(`${baseName} (${i})`)) i++;
      name = `${baseName} (${i})`;
    }
    const newId = addProject(toolId, name);
    navigateToProject(newId);
  }, [saveToProject, activeProjectId, addProject, toolId, categoryId, navigateToProject, toolProjects]);

  // Handle project selection from picker
  const handleSelectProject = useCallback(async (projectId: string) => {
    // Save current project data before switching
    if (activeProjectId && activeProjectId !== projectId) await saveToProject();
    touchProject(projectId);
    navigateToProject(projectId);
  }, [saveToProject, activeProjectId, touchProject, navigateToProject]);

  // ── Sync projects from Supabase on mount ──
  // This ensures cross-device project data is available before resolution logic runs.
  useEffect(() => {
    if (!hasSynced) {
      syncFromServer();
    }
  }, [hasSynced, syncFromServer]);

  // Track whether project resolution has run (prevents re-running on state changes)
  const hasResolvedRef = useRef(false);

  // ── Project resolution — GATED on hasSynced ──
  // Must wait for sync to complete so server projects are available.
  // Industry-standard pattern (Figma/Canva): auto-select most recent project,
  // don't force picker. User can switch via the Projects button in the header.
  useEffect(() => {
    if (!toolId || !hasSynced) return; // Wait for sync before resolving
    if (hasResolvedRef.current) return; // Only resolve once per mount
    const WorkspaceComponent = workspaceComponents[toolId];
    if (!WorkspaceComponent) return; // Non-workspace tools don't need project management

    hasResolvedRef.current = true;

    // Re-read projects NOW (post-sync) to get the freshest list
    const freshToolProjects = useProjectStore.getState().projects.filter((p) => p.toolId === toolId);

    if (urlProjectId) {
      // URL has a project ID — validate it exists
      const exists = useProjectStore.getState().projects.some((p) => p.id === urlProjectId);
      if (exists) {
        setActiveProjectId(urlProjectId);
        projectIdRef.current = urlProjectId;
        touchProject(urlProjectId);
      } else if (freshToolProjects.length > 0) {
        // Invalid URL but tool has projects — auto-select most recent
        const mostRecent = [...freshToolProjects].sort((a, b) => b.updatedAt - a.updatedAt)[0];
        navigateToProject(mostRecent.id);
      } else {
        // Invalid URL and no projects exist — create fresh immediately
        const cat = toolCategories.find((c) => c.id === categoryId);
        const t = cat?.tools.find((t) => t.id === toolId);
        if (t) {
          const newId = addProject(toolId, `${t.name} Project`);
          navigateToProject(newId);
        }
      }
    } else if (freshToolProjects.length > 0) {
      // No project in URL but tool has projects — auto-select most recent
      // (Industry standard: resume where you left off, switch via header)
      const mostRecent = [...freshToolProjects].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      navigateToProject(mostRecent.id);
    } else {
      // First-time visit — create a fresh project immediately
      const cat = toolCategories.find((c) => c.id === categoryId);
      const t = cat?.tools.find((t) => t.id === toolId);
      if (t) {
        const newId = addProject(toolId, `${t.name} Project`);
        navigateToProject(newId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId, hasSynced]);

  // Track tool usage on mount + time spent + milestone tracking
  useEffect(() => {
    if (!toolId) return;
    addRecentTool(toolId);
    trackOpen(toolId);
    if (categoryId) setLastVisited(categoryId, toolId);

    const start = Date.now();
    dirtyCountRef.current = 0;

    // ── Milestone-based progress tracking ──────────────────
    // workspace:dirty → marks "input" on first fire, "edited" after content exists
    const dirtyHandler = () => {
      const pid = projectIdRef.current;
      if (!pid) return;
      dirtyCountRef.current++;
      touchProject(pid);

      if (dirtyCountRef.current === 1) {
        // First edit signal → user has started providing input
        addMilestone(pid, "input");
      } else if (dirtyCountRef.current >= 5) {
        // Multiple edits → user is refining (only counts if content already exists)
        const proj = useProjectStore.getState().projects.find((p) => p.id === pid);
        if (proj?.milestones?.includes("content")) {
          addMilestone(pid, "edited");
        }
      }
    };

    // workspace:progress → explicit milestone or progress from workspace
    const progressHandler = ((e: CustomEvent) => {
      const pid = projectIdRef.current;
      if (!pid) return;
      const { milestone, progress: explicitProgress } = e.detail ?? {};

      if (typeof explicitProgress === "number") {
        // Wizard-based tools send exact progress (e.g. step/totalSteps)
        updateProject(pid, { progress: Math.min(100, Math.max(0, Math.round(explicitProgress))) });
      } else if (milestone) {
        // Milestone-based progress (editor tools)
        addMilestone(pid, milestone);
      }
    }) as EventListener;

    // workspace:save → confirm saved (progress is tracked via milestones, not saves)
    const saveHandler = () => {
      window.dispatchEvent(new CustomEvent("workspace:saved"));
    };

    window.addEventListener("workspace:dirty", dirtyHandler);
    window.addEventListener("workspace:progress", progressHandler);
    window.addEventListener("workspace:save", saveHandler);

    return () => {
      window.removeEventListener("workspace:dirty", dirtyHandler);
      window.removeEventListener("workspace:progress", progressHandler);
      window.removeEventListener("workspace:save", saveHandler);
      const elapsed = Math.round((Date.now() - start) / 1000);
      if (elapsed > 2) trackTime(toolId, elapsed);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId, categoryId]);

  // First-visit notification for the tool
  useEffect(() => {
    if (hasNotifiedRef.current) return;
    hasNotifiedRef.current = true;
    const cat = toolCategories.find((c) => c.id === categoryId);
    const t = cat?.tools.find((t) => t.id === toolId);
    if (t && workspaceComponents[toolId]) {
      notify.tool(
        `${t.name} opened`,
        "Your workspace is ready. Changes auto-save as you work.",
        undefined,
        t.icon,
      );
    }
  }, [toolId, categoryId]);

  // ── Inline project rename ──
  const handleStartRename = () => {
    if (!currentProject) return;
    setEditNameValue(currentProject.name);
    setIsEditingName(true);
    setTimeout(() => editNameRef.current?.select(), 0);
  };

  const handleFinishRename = () => {
    if (activeProjectId && editNameValue.trim()) {
      renameProject(activeProjectId, editNameValue.trim());
    }
    setIsEditingName(false);
  };

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

        {/* Project picker modal */}
        {showProjectPicker && (
          <ProjectPickerModal
            toolId={toolId}
            toolName={tool.name}
            toolIcon={ToolIcon}
            onSelect={handleSelectProject}
            onCreateNew={handleCreateNewProject}
            onClose={() => {
              setShowProjectPicker(false);
              // If no project is active yet, create a fresh one.
              // Never auto-load an old project on dismiss — that's confusing.
              if (!activeProjectId) {
                handleCreateNewProject();
              }
            }}
          />
        )}

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
                  {/* Project name — editable inline */}
                  {isEditingName ? (
                    <input
                      ref={editNameRef}
                      type="text"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      onBlur={handleFinishRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleFinishRename();
                        if (e.key === "Escape") setIsEditingName(false);
                      }}
                      className="text-[13px] font-semibold bg-white dark:bg-gray-800 border border-primary-500/50 rounded-md px-1.5 py-0.5 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/30 max-w-48 sm:max-w-64"
                      maxLength={60}
                    />
                  ) : (
                    <button
                      onClick={handleStartRename}
                      className="group/name flex items-center gap-1 min-w-0"
                      title="Click to rename project"
                    >
                      <span className="text-[13px] font-semibold text-gray-900 dark:text-white truncate max-w-48 sm:max-w-none">
                        {currentProject?.name || tool.name}
                      </span>
                      {currentProject && (
                        <svg className="size-3 text-gray-400 opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                        </svg>
                      )}
                    </button>
                  )}
                  <span className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-${statusColor}/15 text-${statusColor}`}>
                    <span className={`size-1 rounded-full bg-${statusColor}`} />
                    {statusLabel}
                  </span>
                </div>
              </nav>
            </div>

            {/* Right: utilities */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Project switcher button */}
              {toolProjects.length > 0 && (
                <button
                  onClick={() => setShowProjectPicker(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium text-gray-500 hover:text-primary-500 hover:bg-primary-500/10 transition-colors"
                  title="Switch project"
                >
                  <IconFolder className="size-3.5" />
                  <span className="hidden lg:inline">Projects</span>
                  <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-400 font-mono">
                    {toolProjects.length}
                  </span>
                </button>
              )}
              <SaveIndicator />
              <span className="hidden sm:inline-flex"><CreditBalance /></span>
              <span className="hidden sm:inline-flex"><ThemeSwitch /></span>
              <NotificationPanel />
              <UserMenu />
            </div>
          </header>

          {/* ── Loading state — project not yet ready ── */}
          {(!activeProjectId || !projectReady) && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="size-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                <p className="text-xs text-gray-500" suppressHydrationWarning>
                  {activeProjectId ? "Loading project\u2026" : hasSynced ? "Preparing workspace\u2026" : "Syncing projects\u2026"}
                </p>
              </div>
            </div>
          )}

          {/* ── Full-height workspace — only rendered when project data is ready ── */}
          {/* key={activeProjectId} forces React to FULLY unmount + remount on project switch,
              guaranteeing all local useState/useRef are fresh. Belt-and-suspenders safety. */}
          {activeProjectId && projectReady && (
            <div key={activeProjectId} className="flex-1 overflow-hidden">
              <WorkspaceComponent />
            </div>
          )}
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
