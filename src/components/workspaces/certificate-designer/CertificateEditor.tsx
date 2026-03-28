// =============================================================================
// DMSuite — Certificate Editor
// Canvas editor panel with AI revision bar, bidirectional sync with
// certificate store. Follows StepEditor.tsx pattern exactly.
// =============================================================================

"use client";

import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { useCertificateEditor } from "@/stores/certificate-editor";
import { useEditorStore } from "@/stores/editor";
import {
  CanvasEditor,
  EditorToolbar,
  LayerPropertiesPanel,
  LayersListPanel,
} from "@/components/editor";
import type { DesignDocumentV2, TextLayerV2 } from "@/lib/editor/schema";
import { getLayerOrder } from "@/lib/editor/schema";
import { syncTextToCertificateDoc, extractMetadataFromDoc } from "@/lib/editor/certificate-adapter";
import CertificateQuickEdit from "./CertificateQuickEdit";

// ---------------------------------------------------------------------------
// Contextual AI Suggestion Chips
// ---------------------------------------------------------------------------

const UNIVERSAL_CHIPS = [
  "Make it bolder",
  "More formal",
  "Swap colors",
  "Improve spacing",
  "Add gold accent",
  "Enlarge recipient name",
];

function generateContextualChips(doc: DesignDocumentV2 | null): string[] {
  if (!doc) return UNIVERSAL_CHIPS;
  const layers = getLayerOrder(doc).filter((l) => l.id !== doc.rootFrameId);
  const chips: string[] = [];

  const hasSeal = layers.some((l) => l.tags?.includes("seal"));
  if (!hasSeal) chips.push("Add a seal");

  const recipientLayer = layers.find(
    (l) => l.type === "text" && l.tags?.includes("recipient-name"),
  ) as TextLayerV2 | undefined;
  if (recipientLayer && recipientLayer.defaultStyle.fontSize < 60) {
    chips.push("Increase name size");
  }

  const decoLayers = layers.filter((l) => l.tags?.some((t) => t.includes("decorative")));
  if (decoLayers.length === 0) chips.push("Add decorative divider");

  for (const chip of UNIVERSAL_CHIPS) {
    if (chips.length >= 8) break;
    if (!chips.includes(chip)) chips.push(chip);
  }
  return chips.slice(0, 8);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CertificateEditorProps {
  onTemplateChange?: () => void;
}

export default function CertificateEditor({ onTemplateChange }: CertificateEditorProps) {
  const { meta, setMeta, setDocumentSnapshot, documentSnapshot } = useCertificateEditor();
  const { setDoc, doc, execute } = useEditorStore();

  const [revisionText, setRevisionText] = useState("");
  const [isRevising, setIsRevising] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const revisionInputRef = useRef<HTMLInputElement>(null);
  const chips = useMemo(() => generateContextualChips(doc), [doc]);

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

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Slash-key focus for AI input
  const handleRequestAIFocus = useCallback(() => {
    revisionInputRef.current?.focus();
  }, []);

  // AI Revision handler
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
            userMessage: `Apply the following revision to the certificate design: ${instruction}`,
          }),
        });

        if (response.status === 402) {
          const { handleCreditError } = await import("@/lib/credit-error");
          throw new Error(handleCreditError());
        }
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
          if (applied) {
            isSyncingRef.current = true;
            lastLoadedDocRef.current = updatedDoc;
            setDoc(updatedDoc);
            setDocumentSnapshot(updatedDoc);
            queueMicrotask(() => {
              isSyncingRef.current = false;
            });
          }
        }

        if (applied) {
          setToast({ type: "success", message: "Revision applied successfully" });
        } else {
          setToast({ type: "error", message: "No changes could be applied" });
        }
      } catch (err) {
        setToast({
          type: "error",
          message: err instanceof Error ? err.message : "Revision failed",
        });
      } finally {
        setIsRevising(false);
        setRevisionText("");
      }
    },
    [doc, setDoc, setDocumentSnapshot],
  );

  return (
    <div className="flex h-full flex-col bg-gray-950">
      {/* Toolbar */}
      <EditorToolbar />

      {/* Main layout: Quick Edit | Canvas | Layers */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Quick Edit */}
        <div className="hidden lg:flex w-[272px] shrink-0 flex-col border-r border-gray-800 bg-gray-900 overflow-y-auto">
          <CertificateQuickEdit onTemplateChange={onTemplateChange} />
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 min-w-0">
          <CanvasEditor onRequestAIFocus={handleRequestAIFocus} />
        </div>

        {/* Right: Layers + Properties */}
        {showLayers && (
          <div className="hidden md:flex w-[272px] shrink-0 flex-col border-l border-gray-800 bg-gray-900 overflow-y-auto">
            <LayersListPanel />
            <div className="border-t border-gray-800">
              <LayerPropertiesPanel />
            </div>
          </div>
        )}
      </div>

      {/* AI Revision Bar */}
      <div className="border-t border-gray-800 bg-gray-900 px-4 py-3">
        {/* Suggestion chips */}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleRevision(chip)}
              disabled={isRevising}
              className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300 hover:bg-gray-700 hover:text-gray-100 disabled:opacity-50 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-3">
          <input
            ref={revisionInputRef}
            type="text"
            value={revisionText}
            onChange={(e) => setRevisionText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleRevision(revisionText);
              }
            }}
            placeholder="Tell Chiko what to change..."
            disabled={isRevising}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => handleRevision(revisionText)}
            disabled={isRevising || !revisionText.trim()}
            className="shrink-0 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors"
          >
            {isRevising ? "..." : "Apply"}
          </button>
        </div>

        {/* Toast feedback */}
        {toast && (
          <div
            className={`mt-2 rounded-lg px-3 py-2 text-xs font-medium ${
              toast.type === "success"
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
