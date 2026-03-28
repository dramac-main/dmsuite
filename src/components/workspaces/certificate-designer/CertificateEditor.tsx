// =============================================================================
// DMSuite — Certificate Editor
// Canvas editor panel with bidirectional sync to certificate store.
// Follows StepEditor.tsx (Business Card) pattern exactly:
//   - EditorToolbar at top
//   - Three-column layout: QuickEdit | CanvasEditor | Layers+Props
//   - NO bottom AI bar (Chiko floating circle handles AI interaction)
// =============================================================================

"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCertificateEditor } from "@/stores/certificate-editor";
import { useEditorStore } from "@/stores/editor";
import {
  CanvasEditor,
  EditorToolbar,
  LayerPropertiesPanel,
  LayersListPanel,
} from "@/components/editor";
import { syncTextToCertificateDoc, extractMetadataFromDoc } from "@/lib/editor/certificate-adapter";
import CertificateQuickEdit from "./CertificateQuickEdit";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CertificateEditorProps {
  onTemplateChange?: () => void;
}

export default function CertificateEditor({ onTemplateChange }: CertificateEditorProps) {
  const { meta, setMeta, setDocumentSnapshot, documentSnapshot } = useCertificateEditor();
  const { setDoc, doc } = useEditorStore();

  const [showLayers, setShowLayers] = useState(true);

  // --- Bidirectional Sync (StepEditor pattern) ---
  const isSyncingRef = useRef(false);
  const lastLoadedDocRef = useRef<unknown>(null);

  // Certificate store → Editor store (snapshot push)
  useEffect(() => {
    if (documentSnapshot && documentSnapshot !== lastLoadedDocRef.current) {
      isSyncingRef.current = true;
      lastLoadedDocRef.current = documentSnapshot;
      setDoc(documentSnapshot);
      queueMicrotask(() => {
        isSyncingRef.current = false;
      });
    }
  }, [documentSnapshot, setDoc]);

  // Editor store → Certificate store (canvas edits)
  useEffect(() => {
    if (!doc || isSyncingRef.current) return;
    if (doc === lastLoadedDocRef.current) return;
    lastLoadedDocRef.current = doc;
    setDocumentSnapshot(doc);
    // Extract text changes back to metadata
    const extracted = extractMetadataFromDoc(doc);
    if (Object.keys(extracted).length > 0) {
      isSyncingRef.current = true;
      setMeta(extracted);
      queueMicrotask(() => {
        isSyncingRef.current = false;
      });
    }
  }, [doc, setDocumentSnapshot, setMeta]);

  // Sync metadata changes to canvas (form → canvas text sync)
  const prevMetaRef = useRef(meta);
  useEffect(() => {
    if (isSyncingRef.current) return;
    if (meta === prevMetaRef.current) return;
    prevMetaRef.current = meta;

    if (doc) {
      const synced = syncTextToCertificateDoc(doc, meta);
      if (synced !== doc) {
        isSyncingRef.current = true;
        lastLoadedDocRef.current = synced;
        setDoc(synced);
        setDocumentSnapshot(synced);
        queueMicrotask(() => {
          isSyncingRef.current = false;
        });
      }
    }
  }, [meta, doc, setDoc, setDocumentSnapshot]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar row with navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 border-b border-gray-700/50 bg-gray-900/50"
      >
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            {onTemplateChange && (
              <button
                onClick={onTemplateChange}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← Templates
              </button>
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
          </div>
        </div>

        {/* EditorToolbar — shared undo/redo, zoom, mode etc. */}
        <EditorToolbar />
      </motion.div>

      {/* Three-column layout — matches StepEditor exactly */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Quick Edit — hidden below lg */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden lg:flex w-64 border-r border-gray-700/50 bg-gray-900/30 flex-col overflow-y-auto"
        >
          <div className="p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
              Quick Edit
            </p>
            <CertificateQuickEdit onTemplateChange={onTemplateChange} />
          </div>
        </motion.div>

        {/* Center: Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-950/50 relative">
          <CanvasEditor
            showBleedSafe
            workspaceBg="#1e1e1e"
          />
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
