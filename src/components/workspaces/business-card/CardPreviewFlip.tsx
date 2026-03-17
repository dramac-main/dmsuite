// =============================================================================
// DMSuite — Card Preview Flip
// Reusable component showing a business card with 3D flip animation.
// =============================================================================

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import type { DesignDocumentV2 } from "@/lib/editor/schema";

interface CardPreviewFlipProps {
  frontDoc: DesignDocumentV2 | null;
  backDoc?: DesignDocumentV2 | null;
  width?: number;
  height?: number;
  className?: string;
  showFlipButton?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export default function CardPreviewFlip({
  frontDoc,
  backDoc,
  width = 420,
  height = 240,
  className = "",
  showFlipButton = true,
  selected = false,
  onClick,
}: CardPreviewFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const frontCanvasRef = useRef<HTMLCanvasElement>(null);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render document to canvas
  const renderToCanvas = useCallback(
    async (canvas: HTMLCanvasElement | null, doc: DesignDocumentV2 | null) => {
      if (!canvas || !doc) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      try {
        // Dynamic import to avoid SSR issues
        const { renderDocumentV2 } = await import("@/lib/editor/renderer");
        const rootFrame = doc.layersById[doc.rootFrameId];
        if (!rootFrame) return;

        const docW = rootFrame.transform.size.x;
        const docH = rootFrame.transform.size.y;
        const scale = Math.min(width / docW, height / docH);

        canvas.width = Math.round(docW * scale);
        canvas.height = Math.round(docH * scale);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // renderDocumentV2 applies scaleFactor internally — do NOT manually ctx.scale() (double-scaling bug)
        renderDocumentV2(ctx, doc, {
          showSelection: false,
          showGuides: false,
          showBleedSafe: false,
          scaleFactor: scale,
        });
      } catch (e) {
        console.warn("CardPreviewFlip render error:", e);
      }
    },
    [width, height]
  );

  useEffect(() => {
    renderToCanvas(frontCanvasRef.current, frontDoc);
  }, [frontDoc, renderToCanvas]);

  useEffect(() => {
    renderToCanvas(backCanvasRef.current, backDoc ?? null);
  }, [backDoc, renderToCanvas]);

  return (
    <div
      className={`relative group ${className}`}
      style={{ width, height, perspective: 1000 }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Front face */}
        <div
          className={`absolute inset-0 rounded-lg overflow-hidden shadow-xl cursor-pointer transition-shadow duration-300 ${
            selected
              ? "ring-2 ring-primary-500 shadow-primary-500/30"
              : "ring-1 ring-gray-700/50 hover:ring-gray-600"
          }`}
          style={{ backfaceVisibility: "hidden" }}
          onClick={onClick}
        >
          <canvas
            ref={frontCanvasRef}
            className="w-full h-full object-contain bg-gray-800"
          />
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0 rounded-lg overflow-hidden shadow-xl ring-1 ring-gray-700/50"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {backDoc ? (
            <canvas
              ref={backCanvasRef}
              className="w-full h-full object-contain bg-gray-800"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500 text-sm">
              No back design
            </div>
          )}
        </div>
      </motion.div>

      {/* Flip button */}
      {showFlipButton && backDoc && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsFlipped(!isFlipped);
          }}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-gray-900/80 backdrop-blur-sm border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 transition-colors opacity-0 group-hover:opacity-100"
          title={isFlipped ? "Show front" : "Show back"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 1l4 4-4 4" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <path d="M7 23l-4-4 4-4" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </motion.button>
      )}
    </div>
  );
}
