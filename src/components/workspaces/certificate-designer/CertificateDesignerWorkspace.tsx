// =============================================================================
// DMSuite — Certificate Designer Workspace
// Main workspace container with state machine:
//   template-picker → font-loading → editor → (export handled via toolbar)
// Default export consumed by tools/[categoryId]/[toolId]/page.tsx
// =============================================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCertificateEditor } from "@/stores/certificate-editor";
import {
  getCertificateTemplate,
  type CertificateTemplate,
} from "@/data/certificate-templates";
import {
  certificateConfigToDocumentAsync,
  createDefaultCertificateConfig,
} from "@/lib/editor/certificate-adapter";
import CertificateTemplatePicker from "./CertificateTemplatePicker";
import CertificateEditor from "./CertificateEditor";

// ---------------------------------------------------------------------------
// Workspace phases
// ---------------------------------------------------------------------------

type Phase = "pick" | "loading" | "editor";

// ---------------------------------------------------------------------------
// Transition animations
// ---------------------------------------------------------------------------

const fadeVariants = {
  enter: { opacity: 0, y: 24, scale: 0.98 },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -24,
    scale: 0.98,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// ---------------------------------------------------------------------------
// Font loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton({ templateName }: { templateName: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-gray-950 text-white">
      {/* Pulsing certificate outline */}
      <div className="relative">
        <div className="h-48 w-72 animate-pulse rounded-lg border-2 border-gray-700 bg-gray-900" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6">
          <div className="h-3 w-32 animate-pulse rounded bg-gray-700" />
          <div className="h-2 w-20 animate-pulse rounded bg-gray-800" />
          <div className="h-4 w-40 animate-pulse rounded bg-gray-700" />
          <div className="h-2 w-28 animate-pulse rounded bg-gray-800" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium text-gray-300">
          Preparing &ldquo;{templateName}&rdquo;&hellip;
        </p>
        <p className="text-xs text-gray-500">Loading fonts and building document</p>
      </div>
      {/* Spinner */}
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-700 border-t-primary-500" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Workspace
// ---------------------------------------------------------------------------

export default function CertificateDesignerWorkspace() {
  const {
    meta,
    setMeta,
    selectedTemplateId,
    setTemplateId,
    documentSnapshot,
    setDocumentSnapshot,
    setGenerating,
    setGenerationError,
    setFontsReady,
    resetToDefaults,
  } = useCertificateEditor();

  const [phase, setPhase] = useState<Phase>(() =>
    documentSnapshot ? "editor" : "pick",
  );
  const [activeTemplate, setActiveTemplate] = useState<CertificateTemplate | null>(null);
  const mountedRef = useRef(true);

  // Track previous documentSnapshot to skip re-init on restore
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // --- Progress milestones ---
  useEffect(() => {
    const progress: Record<Phase, number> = {
      pick: 10,
      loading: 30,
      editor: 50,
    };
    window.dispatchEvent(
      new CustomEvent("workspace:progress", { detail: { progress: progress[phase] } }),
    );
    if (phase === "editor") {
      window.dispatchEvent(
        new CustomEvent("workspace:progress", { detail: { milestone: "content" } }),
      );
    }
  }, [phase]);

  // --- Template selection handler ---
  const handleTemplateSelect = useCallback(
    async (template: CertificateTemplate) => {
      setActiveTemplate(template);
      setTemplateId(template.id);
      setPhase("loading");
      setGenerating(true);
      setGenerationError(null);

      // Build initial config from defaults + template
      const cfg = {
        ...createDefaultCertificateConfig(),
        ...meta,
        templateId: template.id,
      };
      setMeta(cfg);

      try {
        const doc = await certificateConfigToDocumentAsync(cfg, template);
        if (!mountedRef.current) return;
        setDocumentSnapshot(doc);
        setFontsReady(true);
        setGenerating(false);
        setPhase("editor");
      } catch (err) {
        if (!mountedRef.current) return;
        setGenerating(false);
        setGenerationError(
          err instanceof Error ? err.message : "Failed to generate certificate",
        );
        // Fallback: still go to editor with whatever we have
        setPhase("editor");
      }
    },
    [meta, setMeta, setTemplateId, setDocumentSnapshot, setGenerating, setGenerationError, setFontsReady],
  );

  // --- Start blank handler ---
  const handleStartBlank = useCallback(() => {
    const template = getCertificateTemplate("classic-gold");
    handleTemplateSelect(template);
  }, [handleTemplateSelect]);

  // --- Template change from within editor ---
  const handleTemplateChange = useCallback(() => {
    setPhase("pick");
    window.dispatchEvent(
      new CustomEvent("workspace:progress", { detail: { progress: 10 } }),
    );
  }, []);

  // --- Start over ---
  const handleStartOver = useCallback(() => {
    if (confirm("Start a new certificate design? Your current progress will be cleared.")) {
      resetToDefaults();
      setPhase("pick");
      setActiveTemplate(null);
    }
  }, [resetToDefaults]);

  // Full-screen editor mode
  const isEditor = phase === "editor";

  return (
    <div
      className={
        isEditor
          ? "fixed inset-0 z-50 flex flex-col bg-gray-950 text-white overflow-hidden"
          : "flex h-full flex-col bg-gray-950 text-white overflow-hidden"
      }
    >
      {/* Header bar (template picker phase only) */}
      {!isEditor && (
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between border-b border-gray-800/50 bg-gray-900/40 px-4 py-2 backdrop-blur-sm"
        >
          <p className="text-sm font-medium text-gray-300">Certificate Designer</p>
          {documentSnapshot && (
            <button
              onClick={() => setPhase("editor")}
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              Back to Editor
            </button>
          )}
          {phase !== "pick" && (
            <button
              onClick={handleStartOver}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Start Over
            </button>
          )}
        </motion.header>
      )}

      {/* Phase content */}
      <div className={isEditor ? "flex-1 overflow-hidden relative" : "flex-1 overflow-y-auto relative"}>
        <AnimatePresence mode="wait">
          {phase === "pick" && (
            <motion.div
              key="pick"
              variants={fadeVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="h-full py-6"
            >
              <CertificateTemplatePicker
                onSelect={handleTemplateSelect}
                onStartBlank={handleStartBlank}
              />
            </motion.div>
          )}

          {phase === "loading" && (
            <motion.div
              key="loading"
              variants={fadeVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="h-full"
            >
              <LoadingSkeleton
                templateName={activeTemplate?.name ?? "Certificate"}
              />
            </motion.div>
          )}

          {phase === "editor" && (
            <motion.div
              key="editor"
              variants={fadeVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="h-full"
            >
              <CertificateEditor onTemplateChange={handleTemplateChange} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
