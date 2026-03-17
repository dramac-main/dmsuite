// =============================================================================
// DMSuite — Step 5: Refine & Edit  (Phase E — AI Revision UX)
// Canvas editor with quick-edit panel, AI revision with feedback, layers panel.
// =============================================================================

"use client";

import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBusinessCardWizard } from "@/stores/business-card-wizard";
import { useEditorStore } from "@/stores/editor";
import {
  CanvasEditor,
  EditorToolbar,
  LayerPropertiesPanel,
  LayersListPanel,
} from "@/components/editor";
import BusinessCardLayerQuickEdit from "@/components/editor/BusinessCardLayerQuickEdit";
import type { DesignDocumentV2, TextLayerV2 } from "@/lib/editor/schema";
import { getLayerOrder } from "@/lib/editor/schema";
import { createSnapshotCommand } from "@/lib/editor/commands";
import { IconCheck, IconAlertTriangle, IconLoader } from "@/components/icons";

// ---------------------------------------------------------------------------
// Universal chips (always shown)
// ---------------------------------------------------------------------------

const UNIVERSAL_CHIPS = [
  "Make it bolder",
  "More minimalist",
  "Swap colors",
  "Improve spacing",
];

// ---------------------------------------------------------------------------
// Revision history entry
// ---------------------------------------------------------------------------

interface RevisionEntry {
  instruction: string;
  status: "success" | "failed";
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Generate contextual suggestion chips from document state
// ---------------------------------------------------------------------------

function generateContextualChips(doc: DesignDocumentV2 | null): string[] {
  if (!doc) return UNIVERSAL_CHIPS;

  const layers = getLayerOrder(doc).filter((l) => l.id !== doc.rootFrameId);
  const chips: string[] = [];

  // Check for dark background
  const rootFrame = doc.layersById[doc.rootFrameId];
  if (rootFrame && "fills" in rootFrame) {
    const fills = (rootFrame as { fills?: Array<{ kind: string; color?: { r: number; g: number; b: number } }> }).fills;
    if (fills?.[0]?.kind === "solid" && fills[0].color) {
      const { r, g, b } = fills[0].color;
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (lum < 0.3) chips.push("Lighten background");
      if (lum > 0.7) chips.push("Darken background");
    }
  }

  // Check for missing decorative elements
  const hasDecorative = layers.some(
    (l) => l.type === "shape" && l.tags?.some((t) => t.includes("decorative") || t.includes("accent"))
  );
  if (!hasDecorative && chips.length < 4) chips.push("Add accent shape");

  // Check effects density
  const totalEffects = layers.reduce((sum, l) => sum + (l.effects?.length || 0), 0);
  if (totalEffects > 6) chips.push("Simplify effects");
  if (totalEffects === 0 && chips.length < 4) chips.push("Add subtle shadow");

  // Check text layers
  const textLayers = layers.filter((l) => l.type === "text") as TextLayerV2[];
  const nameLayer = textLayers.find((l) => l.tags?.includes("name") || l.tags?.includes("headline"));
  if (nameLayer && nameLayer.defaultStyle.fontSize < 20) {
    chips.push("Increase name prominence");
  }

  // Fill remaining with universals
  for (const chip of UNIVERSAL_CHIPS) {
    if (chips.length >= 8) break;
    if (!chips.includes(chip)) chips.push(chip);
  }

  return chips.slice(0, 8);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StepEditor() {
  const { documents, setFrontDoc, setBackDoc, setCurrentSide, nextStep, prevStep, brief } =
    useBusinessCardWizard();
  const { setDoc, doc, execute } = useEditorStore();
  const [revisionText, setRevisionText] = useState("");
  const [isRevising, setIsRevising] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const revisionInputRef = useRef<HTMLInputElement>(null);

  // --- E.1: Feedback states ---
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // --- E.2: Revision history ---
  const [revisionHistory, setRevisionHistory] = useState<RevisionEntry[]>([]);

  // --- E.3: Contextual chips ---
  const chips = useMemo(() => generateContextualChips(doc), [doc]);

  // Guard ref to prevent circular sync loops between wizard ↔ editor
  const isSyncingRef = useRef(false);
  // Track which doc we last pushed to the editor to avoid no-op setDoc calls
  const lastLoadedDocRef = useRef<unknown>(null);

  // Load the wizard doc into the editor store (wizard → editor)
  useEffect(() => {
    const activeDoc =
      documents.currentSide === "front" ? documents.frontDoc : documents.backDoc;
    if (activeDoc && activeDoc !== lastLoadedDocRef.current) {
      isSyncingRef.current = true;
      lastLoadedDocRef.current = activeDoc;
      setDoc(activeDoc);
      queueMicrotask(() => { isSyncingRef.current = false; });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents.currentSide]);

  // Sync editor doc back to wizard state (editor → wizard)
  useEffect(() => {
    if (!doc || isSyncingRef.current) return;
    if (doc === lastLoadedDocRef.current) return;
    lastLoadedDocRef.current = doc;
    if (documents.currentSide === "front") {
      setFrontDoc(doc);
    } else {
      setBackDoc(doc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  // --- Toast auto-dismiss ---
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // --- E.5: Slash-key focus callback for CanvasEditor ---
  const handleRequestAIFocus = useCallback(() => {
    revisionInputRef.current?.focus();
  }, []);

  // AI revision handler — with E.1 feedback + E.2 history
  const handleRevision = useCallback(
    async (instruction: string) => {
      if (!instruction.trim() || !doc) return;

      setIsRevising(true);
      setToast(null);
      try {
        const { buildAIPatchPrompt, parseAIRevisionResponse, processIntent } =
          await import("@/lib/editor/ai-patch");

        const prompt = buildAIPatchPrompt(doc, instruction, "full-redesign", new Map());

        const response = await fetch("/api/chat/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemPrompt: prompt,
            userMessage: `Apply the following revision to the design: ${instruction}`,
          }),
        });

        if (!response.ok) throw new Error("AI revision request failed");

        const text = await response.text();
        const parsed = parseAIRevisionResponse(text);

        let applied = false;

        if (parsed?.intents?.length) {
          let updatedDoc = doc;
          for (const intent of parsed.intents) {
            const result = processIntent(updatedDoc, intent);
            if (result?.success && result.command) {
              updatedDoc = result.command.execute(updatedDoc);
              applied = true;
            }
          }
          if (applied) execute(createSnapshotCommand(updatedDoc, "AI revision"));
        } else if (parsed?.patchOps?.length) {
          const { validateAndApplyPatch } = await import("@/lib/editor/ai-patch");
          const result = validateAndApplyPatch(doc, parsed.patchOps, "full-redesign");
          if (result?.success && result.command) {
            execute(createSnapshotCommand(result.command.execute(doc), "AI revision"));
            applied = true;
          }
        }

        if (applied) {
          setToast({ type: "success", message: "Revision applied" });
          setRevisionHistory((h) => [
            { instruction, status: "success" as const, timestamp: Date.now() },
            ...h,
          ].slice(0, 5));
        } else {
          setToast({ type: "error", message: "No changes applied — try rephrasing" });
          setRevisionHistory((h) => [
            { instruction, status: "failed" as const, timestamp: Date.now() },
            ...h,
          ].slice(0, 5));
        }

        setRevisionText("");
      } catch (e) {
        console.error("AI revision failed:", e);
        setToast({ type: "error", message: "Revision failed — try rephrasing your request" });
        setRevisionHistory((h) => [
          { instruction, status: "failed" as const, timestamp: Date.now() },
          ...h,
        ].slice(0, 5));
      } finally {
        setIsRevising(false);
      }
    },
    [doc, execute]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Editor toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-700/50 bg-gray-900/50"
      >
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={prevStep}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </button>

            {/* Front/Back toggle — hidden when front-only */}
            {!brief.frontOnly && documents.backDoc && (
            <div className="flex bg-gray-800 rounded-lg p-0.5">
              {(["front", "back"] as const).map((side) => (
                <button
                  key={side}
                  onClick={() => setCurrentSide(side)}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                    documents.currentSide === side
                      ? "bg-primary-500/20 text-primary-400 shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {side === "front" ? "Front" : "Back"}
                </button>
              ))}
            </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLayers(!showLayers)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                showLayers
                  ? "bg-gray-700 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Layers
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={nextStep}
              className="px-5 py-1.5 rounded-lg bg-primary-500 text-gray-950 text-xs font-semibold hover:bg-primary-400 transition-colors"
            >
              Export →
            </motion.button>
          </div>
        </div>

        {/* Mini toolbar from EditorToolbar */}
        <EditorToolbar />
      </motion.div>

      {/* ✨ AI Revision Bar — prominent, responsive */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="border-b border-gray-700/50 bg-gray-900/60 backdrop-blur-sm px-3 sm:px-4 py-2"
      >
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Label */}
          <span className="text-[10px] text-primary-400 uppercase tracking-wider font-bold shrink-0">
            AI Revise
          </span>

          {/* Contextual chips — scrollable row */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink min-w-0 order-3 sm:order-0 w-full sm:w-auto">
            {chips.map((chip) => (
              <button
                key={chip}
                onClick={() => handleRevision(chip)}
                disabled={isRevising}
                className="px-2.5 py-1 rounded-full bg-gray-800 text-[10px] text-gray-400 hover:bg-primary-500/20 hover:text-primary-300 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Text input + send */}
          <div className="flex items-center gap-1.5 shrink-0 sm:ml-auto flex-1 sm:flex-none min-w-0">
            <input
              ref={revisionInputRef}
              type="text"
              value={revisionText}
              onChange={(e) => setRevisionText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && revisionText.trim()) {
                  handleRevision(revisionText);
                }
              }}
              placeholder="Tell AI what to change... ( / )"
              disabled={isRevising}
              className="flex-1 sm:w-56 sm:flex-none px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-white placeholder:text-gray-600 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-all disabled:opacity-50 min-w-0"
            />
            <button
              onClick={() => handleRevision(revisionText)}
              disabled={!revisionText.trim() || isRevising}
              className="px-3 py-1.5 rounded-lg bg-primary-500/20 text-primary-400 text-xs font-semibold hover:bg-primary-500/30 transition-colors disabled:opacity-40"
            >
              {isRevising ? (
                <IconLoader className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Apply"
              )}
            </button>
          </div>

          {/* History dropdown — compact, hidden on very small screens */}
          {revisionHistory.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              <span className="text-[9px] text-gray-600">|</span>
              {revisionHistory.slice(0, 3).map((entry, i) => (
                <button
                  key={`${entry.timestamp}-${i}`}
                  onClick={() => setRevisionText(entry.instruction)}
                  title={entry.instruction}
                  className={`w-5 h-5 rounded flex items-center justify-center text-[9px] transition-colors ${
                    entry.status === "success"
                      ? "bg-green-900/30 text-green-500 hover:bg-green-900/50"
                      : "bg-red-900/30 text-red-400 hover:bg-red-900/50"
                  }`}
                >
                  {entry.status === "success" ? (
                    <IconCheck className="w-2.5 h-2.5" />
                  ) : (
                    <IconAlertTriangle className="w-2.5 h-2.5" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Three-column layout — sidebars hidden on mobile */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Quick edit — hidden below lg */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden lg:flex w-64 border-r border-gray-700/50 bg-gray-900/30 flex-col overflow-y-auto"
        >
          {/* Quick edit colors */}
          <div className="p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
              Quick Edit
            </p>
            <BusinessCardLayerQuickEdit />
          </div>
        </motion.div>

        {/* Center: Canvas + loading overlay */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-950/50 relative">
          <CanvasEditor
            showBleedSafe
            workspaceBg="#1e1e1e"
            onRequestAIFocus={handleRequestAIFocus}
          />

          {/* E.1: Loading overlay during AI revision */}
          <AnimatePresence>
            {isRevising && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-950/40 flex items-center justify-center z-20 pointer-events-none"
              >
                <div className="flex items-center gap-2 bg-gray-900/90 rounded-lg px-4 py-2.5 border border-gray-700/50 shadow-lg">
                  <IconLoader className="w-4 h-4 text-primary-400 animate-spin" />
                  <span className="text-xs text-gray-300">AI is revising...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* E.1: Success/Error toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg border text-xs font-medium ${
                  toast.type === "success"
                    ? "bg-green-900/80 border-green-700/50 text-green-300"
                    : "bg-red-900/80 border-red-700/50 text-red-300"
                }`}
              >
                {toast.type === "success" ? (
                  <IconCheck className="w-3.5 h-3.5" />
                ) : (
                  <IconAlertTriangle className="w-3.5 h-3.5" />
                )}
                {toast.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Layers + Properties — hidden below lg */}
        {showLayers && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="hidden lg:flex w-72 border-l border-gray-700/50 bg-gray-900/30 flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto border-b border-gray-700/30">
              <LayersListPanel />
            </div>
            <div className="flex-1 overflow-y-auto">
              <LayerPropertiesPanel />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
