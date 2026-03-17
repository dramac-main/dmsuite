// =============================================================================
// DMSuite — Step 4: AI Generation & Preview
// Triggers generation, shows loading animation, displays generated cards.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBusinessCardWizard } from "@/stores/business-card-wizard";
import { generateMultipleDesigns, type GenerationInput, type GenerationResult } from "@/lib/editor/ai-design-generator";
import { CARD_SIZES } from "@/lib/editor/business-card-adapter";
import GenerationLoadingAnimation from "./GenerationLoadingAnimation";
import CardPreviewFlip from "./CardPreviewFlip";

const cardRevealVariants = {
  hidden: { y: 60, opacity: 0, rotateZ: 3, scale: 0.9 },
  visible: {
    y: 0,
    opacity: 1,
    rotateZ: 0,
    scale: 1,
    transition: { type: "spring" as const, damping: 20, stiffness: 200, duration: 0.5 },
  },
  exit: { y: -30, opacity: 0, scale: 0.95, transition: { duration: 0.3 } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

export default function StepGeneration() {
  const {
    details,
    logo,
    style,
    brief,
    generation,
    setIsGenerating,
    setGeneratedDesigns,
    selectDesign,
    setGenerationError,
    setAbortController,
    clearGeneration,
    setFrontDoc,
    setBackDoc,
    nextStep,
    prevStep,
  } = useBusinessCardWizard();

  /** Track whether the last generation used local fallback */
  const [fallbackInfo, setFallbackInfo] = useState<{
    reason: string;
  } | null>(null);

  // Keep a ref to the abort controller so the callback doesn't go stale
  const abortRef = useRef(generation.abortController);
  abortRef.current = generation.abortController;

  // Guard against React strict-mode double-firing the auto-generate
  const didAutoGenerate = useRef(false);

  // Auto-generate on mount if no designs yet
  useEffect(() => {
    if (
      didAutoGenerate.current ||
      generation.generatedDesigns.length > 0 ||
      generation.isGenerating ||
      generation.generationError
    ) return;

    didAutoGenerate.current = true;
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = useCallback(async () => {
    // Cancel any in-flight request
    abortRef.current?.abort();

    const controller = new AbortController();
    setAbortController(controller);
    setIsGenerating(true);
    setGenerationError(null);
    setFallbackInfo(null);

    const cardSize = CARD_SIZES[brief.cardSize] || CARD_SIZES.standard;
    const input: Omit<GenerationInput, "variantIndex" | "totalVariants"> = {
      details,
      logo,
      style,
      brief,
      frontOnly: brief.frontOnly,
      cardSizeKey: brief.cardSize,
      cardWidth: cardSize.w,
      cardHeight: cardSize.h,
    };

    try {
      const result: GenerationResult = await generateMultipleDesigns(
        input,
        1,
        controller.signal
      );

      if (result.designs.length === 0) {
        setGenerationError(
          result.errors.length > 0
            ? `Generation failed: ${result.errors[0]}`
            : "No designs were generated. Please try again."
        );
        return;
      }

      // Track whether we're using fallback designs
      if (result.source === "local" && result.fallbackReason) {
        setFallbackInfo({ reason: result.fallbackReason });
      }

      setGeneratedDesigns(result.designs, result.descriptions, result.backDesigns);

      // Auto-select the single design so user can proceed immediately
      if (result.designs.length === 1) {
        selectDesign(0);
        setFrontDoc(result.designs[0]);
        setBackDoc(result.backDesigns[0] ?? null);
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setGenerationError(`Generation failed: ${(e as Error).message}`);
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  }, [
    details, logo, style, brief,
    setAbortController, setIsGenerating, setGenerationError,
    setGeneratedDesigns, selectDesign, setFrontDoc, setBackDoc, setFallbackInfo,
  ]);

  const handleSelectDesign = useCallback(
    (index: number) => {
      selectDesign(index);
      const design = generation.generatedDesigns[index];
      if (design) {
        setFrontDoc(design);
        setBackDoc(generation.generatedBackDesigns[index] ?? null);
      }
    },
    [generation.generatedDesigns, generation.generatedBackDesigns, selectDesign, setFrontDoc, setBackDoc]
  );

  const handleConfirmSelection = useCallback(() => {
    if (generation.generatedDesigns.length > 0) {
      // Ensure design is selected before proceeding
      if (generation.selectedDesignIndex === null) {
        selectDesign(0);
        setFrontDoc(generation.generatedDesigns[0]);
        setBackDoc(generation.generatedBackDesigns[0] ?? null);
      }
      nextStep();
    }
  }, [generation.generatedDesigns, generation.generatedBackDesigns, generation.selectedDesignIndex, selectDesign, setFrontDoc, setBackDoc, nextStep]);

  return (
    <div className="flex flex-col items-center min-h-[60vh] gap-6 px-4 py-2 max-w-5xl mx-auto w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {generation.isGenerating ? (
          <>
            <h2 className="text-2xl font-semibold text-white mb-1">
              Crafting Your Design
            </h2>
            <p className="text-gray-500 text-sm">
              Our AI designer is building your card from scratch — sit tight
            </p>
          </>
        ) : generation.generatedDesigns.length > 0 ? (
          <>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Your Design Is Ready
            </h2>
            <p className="text-gray-400 text-sm">
              Preview your AI-crafted design below, then continue to the editor to refine it.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Generate Design
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Ready to create your AI-designed business card
            </p>
            <button
              onClick={handleGenerate}
              className="px-8 py-3 rounded-xl bg-primary-500 text-gray-950 font-semibold text-sm shadow-lg shadow-primary-500/20 hover:bg-primary-400 transition-colors inline-flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" /></svg>
              Generate My Card
            </button>
          </>
        )}
      </motion.div>

      {/* Loading state — full prominence */}
      {generation.isGenerating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex-1 flex items-center justify-center py-6"
        >
          <GenerationLoadingAnimation />
        </motion.div>
      )}

      {/* Fallback notice — shown when AI was unavailable */}
      <AnimatePresence>
        {fallbackInfo && !generation.isGenerating && generation.generatedDesigns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 max-w-lg text-center"
          >
            <p className="text-yellow-400 text-sm font-medium mb-1">
              Using Quick Templates
            </p>
            <p className="text-yellow-400/70 text-xs mb-3">
              {fallbackInfo.reason} These designs were generated locally using our template engine.
              For AI-powered custom designs, resolve the issue and try again.
            </p>
            <button
              onClick={() => {
                clearGeneration();
                setFallbackInfo(null);
                handleGenerate();
              }}
              className="px-4 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-300 text-xs hover:bg-yellow-500/30 transition-colors"
            >
              Retry with AI
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      <AnimatePresence>
        {generation.generationError && !generation.isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 max-w-lg text-center"
          >
            <p className="text-red-400 text-sm mb-4">{generation.generationError}</p>
            <button
              onClick={handleGenerate}
              className="px-5 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm hover:bg-red-500/30 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated design — single focused card */}
      {!generation.isGenerating && generation.generatedDesigns.length > 0 && (
        <>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              variants={cardRevealVariants}
              className="flex flex-col items-center gap-4"
            >
              {/* Larger card preview */}
              <div className="relative">
                <CardPreviewFlip
                  frontDoc={generation.generatedDesigns[0]}
                  backDoc={brief.frontOnly ? undefined : (generation.generatedBackDesigns[0] ?? undefined)}
                  width={Math.min(520, typeof window !== 'undefined' ? window.innerWidth - 64 : 520)}
                  height={Math.min(297, typeof window !== 'undefined' ? (window.innerWidth - 64) / 1.75 : 297)}
                  selected={true}
                  onClick={() => handleSelectDesign(0)}
                  showFlipButton={!brief.frontOnly && !!generation.generatedBackDesigns[0]}
                />
                {/* Subtle reflection */}
                <div className="mt-1 h-8 w-full bg-linear-to-b from-gray-800/20 to-transparent rounded-b-lg opacity-40 blur-sm scale-x-95" />
              </div>

              {/* Description + badge */}
              <div className="flex items-center gap-2">
                {!brief.frontOnly && generation.generatedBackDesigns[0] && (
                  <span className="px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-400 text-[10px] font-medium border border-primary-500/20">
                    Front + Back
                  </span>
                )}
                {brief.frontOnly && (
                  <span className="px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400 text-[10px] font-medium border border-gray-600/30">
                    Front Only
                  </span>
                )}
                <p className="text-sm text-gray-500">
                  {generation.designDescriptions[0] || "AI-generated design"}
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                clearGeneration();
                setFallbackInfo(null);
                handleGenerate();
              }}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 text-sm hover:bg-gray-700 hover:text-white transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
              Regenerate
            </button>
          </div>
        </>
      )}

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4 pt-2"
      >
        <button
          onClick={() => {
            generation.abortController?.abort();
            prevStep();
          }}
          className="px-5 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          ← Back
        </button>
        {generation.generatedDesigns.length > 0 && !generation.isGenerating && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirmSelection}
            className="px-8 py-2.5 rounded-xl bg-primary-500 text-gray-950 font-semibold text-sm shadow-lg shadow-primary-500/20 hover:bg-primary-400 transition-colors"
          >
            Edit & Refine →
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
