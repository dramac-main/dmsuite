// =============================================================================
// DMSuite — Menu Designer Workspace
// Tabbed editor (Content/Menu/Style/Format)
// Mobile: full-screen tabs + bottom action bar
// Tablet: slim editor + preview
// Desktop: editor panel + preview canvas + layers panel
// Follows the CertificateDesignerWorkspace.tsx architecture exactly.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useMenuDesignerEditor,
  useMenuDesignerUndo,
  MENU_TEMPLATES,
  MENU_TYPES,
  type MenuType,
} from "@/stores/menu-designer-editor";
import { printHTML } from "@/lib/print";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createMenuDesignerManifest } from "@/lib/chiko/manifests/menu-designer";
import { dispatchDirty, dispatchProgress } from "@/lib/workspace-events";
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, ZOOM_DEFAULT } from "@/lib/workspace-constants";
import "@/styles/workspace-canvas.css";
import MenuDesignerRenderer, { PAGE_PX, getGoogleFontUrl } from "./MenuDesignerRenderer";
import MenuDesignerContentTab from "./tabs/MenuDesignerContentTab";
import MenuDesignerMenuTab from "./tabs/MenuDesignerMenuTab";
import MenuDesignerStyleTab from "./tabs/MenuDesignerStyleTab";
import MenuDesignerFormatTab from "./tabs/MenuDesignerFormatTab";
import MenuDesignerLayersPanel from "./MenuDesignerLayersPanel";
import {
  EditorTabNav,
  BottomBar,
  WorkspaceHeader,
  IconButton,
  ActionButton,
  ConfirmDialog,
  Icons,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";
import WorkspaceErrorBoundary from "@/components/workspaces/shared/WorkspaceErrorBoundary";

// =============================================================================
// Editor tab definitions
// =============================================================================

const TAB_ICONS = {
  content: <SIcon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />,
  menu: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  ),
  style: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="12" r="2.5" /><circle cx="13.5" cy="17.5" r="2.5" />
    </svg>
  ),
  format: <SIcon d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />,
};

const EDITOR_TABS = [
  { key: "content", label: "Content", icon: TAB_ICONS.content },
  { key: "menu", label: "Menu", icon: TAB_ICONS.menu },
  { key: "style", label: "Style", icon: TAB_ICONS.style },
  { key: "format", label: "Format", icon: TAB_ICONS.format },
] as const;

type EditorTabKey = (typeof EDITOR_TABS)[number]["key"];

// Section-to-tab mapping for layers panel click-to-edit
const SECTION_TO_TAB: Record<string, EditorTabKey> = {
  header: "content",
  footer: "content",
  legend: "style",
};

function sectionToTab(section: string): EditorTabKey {
  if (section.startsWith("section-")) return "menu";
  return SECTION_TO_TAB[section] ?? "content";
}

// =============================================================================
// Main Workspace
// =============================================================================

export default function MenuDesignerWorkspace() {
  const form = useMenuDesignerEditor((s) => s.form);
  const setTemplate = useMenuDesignerEditor((s) => s.setTemplate);
  const resetForm = useMenuDesignerEditor((s) => s.resetForm);
  const { undo, redo, canUndo, canRedo } = useMenuDesignerUndo();

  const printAreaRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const chikoOnPrintRef = useRef<(() => void) | null>(null);

  // Active editor tab
  const [activeTab, setActiveTab] = useState<EditorTabKey>("content");

  // Mobile view mode
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");

  // Zoom
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);

  // Layers panel
  const [layersCollapsed, setLayersCollapsed] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  // Confirm dialog for "Start Over"
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);

  // Derived
  const typeConfig = MENU_TYPES.find((t) => t.id === form.menuType);
  const pageKey = form.format.orientation === "landscape"
    ? `${form.format.pageSize}-landscape`
    : form.format.pageSize;
  const pageDim = PAGE_PX[pageKey] ?? PAGE_PX["a4"];

  // Dispatch workspace:dirty on form changes
  const formRef = useRef(form);
  useEffect(() => {
    if (formRef.current === form) return;
    formRef.current = form;
    dispatchDirty();
  }, [form]);

  // Dispatch milestone progress based on content state
  const prevMilestonesRef = useRef<string>("");
  useEffect(() => {
    const milestones: string[] = [];
    const hasInput = form.restaurantName.trim().length > 0;
    if (hasInput) milestones.push("input");
    const hasContent = form.sections.some((s) => s.items.some((i) => i.name.trim().length > 0));
    if (hasContent) milestones.push("content");
    const key = milestones.join(",");
    if (key !== prevMilestonesRef.current) {
      prevMilestonesRef.current = key;
      milestones.forEach((m) => dispatchProgress(m as "input" | "content"));
    }
  }, [form.restaurantName, form.sections]);

  // Highlight elements on canvas when hovering a layer
  useEffect(() => {
    const container = printAreaRef.current;
    if (!container) return;
    container.querySelectorAll(".md-layer-highlight").forEach((el) => el.classList.remove("md-layer-highlight"));
    if (hoveredSection && /^[a-z0-9-]+$/.test(hoveredSection)) {
      container.querySelectorAll(`[data-md-section="${hoveredSection}"]`).forEach((el) => el.classList.add("md-layer-highlight"));
    }
  }, [hoveredSection]);

  const handlePrint = useCallback(() => {
    const printEl = document.getElementById("md-print-area");
    if (!printEl) return;

    const isLandscape = form.format.orientation === "landscape";
    const sizeMap: Record<string, string> = {
      a4: "A4",
      letter: "letter",
      a5: "A5",
      dl: "99mm 210mm",
      square: "210mm 210mm",
      tabloid: "11in 17in",
    };
    const pageSize = sizeMap[form.format.pageSize] || "A4";
    const fontLink = `<link rel="stylesheet" href="${getGoogleFontUrl(form.style.fontPairing)}" />`;
    const html = `<!DOCTYPE html><html><head>
      <title>${form.restaurantName || "Menu"}</title>
      ${fontLink}
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: ${pageSize} ${isLandscape ? "landscape" : "portrait"}; margin: 0; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      </style></head><body>${printEl.innerHTML}</body></html>`;
    printHTML(html);
    dispatchProgress("exported");
  }, [form.restaurantName, form.format.pageSize, form.format.orientation, form.style.fontPairing]);

  // Keep Chiko's print ref in sync
  useEffect(() => {
    chikoOnPrintRef.current = handlePrint;
  }, [handlePrint]);

  // Register Chiko manifest
  useChikoActions(() => createMenuDesignerManifest({ onPrintRef: chikoOnPrintRef }));

  const handleStartOver = useCallback(() => {
    resetForm();
    setShowStartOverDialog(false);
    setActiveTab("content");
  }, [resetForm]);

  // Tab-to-section mapping for layers panel click
  const handleLayerOpenSection = useCallback((section: string) => {
    setActiveTab(sectionToTab(section));
    setMobileView("editor");
  }, []);

  // Click-to-edit on preview
  const handlePreviewClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-md-section]");
    if (!target) return;
    const section = target.dataset.mdSection;
    if (!section) return;
    handleLayerOpenSection(section);
  }, [handleLayerOpenSection]);

  // ── Tab Content ──
  const tabContent = (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <WorkspaceErrorBoundary>
        {activeTab === "content" && <MenuDesignerContentTab />}
        {activeTab === "menu" && <MenuDesignerMenuTab />}
        {activeTab === "style" && <MenuDesignerStyleTab />}
        {activeTab === "format" && <MenuDesignerFormatTab />}
      </WorkspaceErrorBoundary>

      {/* Start Over */}
      <div className="p-4 pb-8">
        <button
          onClick={() => setShowStartOverDialog(true)}
          className="w-full py-2 text-[11px] font-medium text-gray-600 hover:text-gray-400 border border-gray-800/50 hover:border-gray-700/60 rounded-xl transition-all active:scale-[0.98]"
        >
          Start Over
        </button>
      </div>
    </div>
  );

  // ── Editor Panel ──
  const editorPanel = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <WorkspaceHeader
        title={typeConfig?.label ?? "Menu Designer"}
        subtitle={form.restaurantName || "No restaurant name set"}
      >
        <IconButton onClick={() => undo()} disabled={!canUndo} icon={Icons.undo} tooltip="Undo" />
        <IconButton onClick={() => redo()} disabled={!canRedo} icon={Icons.redo} tooltip="Redo" />
      </WorkspaceHeader>

      {/* Tab navigation */}
      <EditorTabNav
        tabs={EDITOR_TABS.map((t) => ({ key: t.key, label: t.label, icon: t.icon }))}
        activeTab={activeTab}
        onTabChange={(k) => setActiveTab(k as EditorTabKey)}
      />

      {/* Tab content */}
      {tabContent}
    </div>
  );

  // ── Preview Panel ──
  const previewPanel = (
    <div className="flex flex-col h-full bg-gray-950/40">
      {/* Preview toolbar */}
      <div className="shrink-0 flex items-center justify-between h-10 px-3 border-b border-gray-800/40">
        <div className="flex items-center gap-1">
          <IconButton onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))} icon={Icons.zoomOut} tooltip="Zoom out" />
          <span className="text-[10px] text-gray-500 w-9 text-center font-mono tabular-nums">{zoom}%</span>
          <IconButton onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))} icon={Icons.zoomIn} tooltip="Zoom in" />
          <button onClick={() => setZoom(ZOOM_DEFAULT)} className="text-[10px] text-gray-600 hover:text-gray-400 px-1.5 py-0.5 rounded-md hover:bg-white/4 transition-colors">
            Reset
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <ActionButton variant="primary" size="sm" icon={Icons.print} onClick={handlePrint}>
            Print
          </ActionButton>
        </div>
      </div>

      {/* Template quick-switch strip */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 border-b border-gray-800/30 overflow-x-auto scrollbar-none">
        <span className="text-[8px] text-gray-600 shrink-0 mr-0.5 uppercase tracking-widest font-bold">TPL</span>
        {MENU_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => setTemplate(tpl.id)}
            className={`shrink-0 flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-all ${
              form.style.template === tpl.id
                ? "border-primary-500/50 bg-primary-500/10 text-primary-300"
                : "border-gray-700/40 text-gray-500 hover:border-gray-600 hover:text-gray-400"
            }`}
          >
            <span className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/10" style={{ backgroundColor: tpl.accent }} />
            {tpl.name}
          </button>
        ))}
      </div>

      {/* Preview canvas */}
      <div
        ref={previewScrollRef}
        className="flex-1 overflow-auto"
        onClick={handlePreviewClick}
        style={{ backgroundColor: "#374151" }}
      >
        <div
          className="md-canvas-root flex justify-center py-6 px-4"
          style={{ minHeight: "100%" }}
        >
          <div style={{ position: "relative" }}>
            <div
              id="md-print-area"
              ref={printAreaRef}
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              <MenuDesignerRenderer data={form} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Layout ──
  return (
    <div className="flex flex-col h-full bg-gray-950 text-white overflow-hidden">
      {/* Mobile bottom action bar */}
      <div className="lg:hidden order-last">
        <BottomBar
          actions={[
            { key: "editor", label: "Edit", icon: Icons.edit },
            { key: "preview", label: "Preview", icon: Icons.preview },
            { key: "print", label: "Print", icon: Icons.print, primary: true },
          ]}
          activeKey={mobileView}
          onAction={(key) => {
            if (key === "print") handlePrint();
            else setMobileView(key as "editor" | "preview");
          }}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor panel */}
        <div
          className={`${
            mobileView === "editor" ? "flex" : "hidden"
          } lg:flex w-full lg:w-80 xl:w-96 lg:min-w-72 shrink-0 flex-col border-r border-gray-800/40 bg-gray-950 overflow-hidden`}
        >
          {editorPanel}
        </div>

        {/* Preview + layers */}
        <div
          className={`${
            mobileView === "preview" ? "flex" : "hidden"
          } lg:flex flex-1 overflow-hidden`}
        >
          <div className="flex-1 flex flex-col overflow-hidden">
            {previewPanel}
          </div>
          <div className="hidden lg:flex">
            <MenuDesignerLayersPanel
              onOpenSection={handleLayerOpenSection}
              onHoverSection={setHoveredSection}
              collapsed={layersCollapsed}
              onToggleCollapse={() => setLayersCollapsed((p) => !p)}
            />
          </div>
        </div>
      </div>

      {/* Confirm dialog for Start Over */}
      <ConfirmDialog
        open={showStartOverDialog}
        title="Start Over?"
        description="This will reset all your menu content and settings. You cannot undo this action."
        confirmLabel="Reset Everything"
        onConfirm={handleStartOver}
        onCancel={() => setShowStartOverDialog(false)}
        variant="danger"
      />
    </div>
  );
}
