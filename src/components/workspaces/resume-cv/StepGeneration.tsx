// =============================================================================
// DMSuite — Resume Step 6: Generation
// Auto-generates resume on mount. Shows a staged, real-feeling loading
// experience with sequential progress, elapsed timer, skeleton preview,
// and cancel support. Never loops the same phrases.
// =============================================================================

"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeCVWizard } from "@/stores/resume-cv-wizard";
import { useResumeEditor } from "@/stores/resume-editor";
import type { ResumeData } from "@/lib/resume/schema";

// ── Inline SVG Icons ──

function IconSparkles({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  );
}

function IconArrowLeft({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconRefresh({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconCheck({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconX({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Generation stages — sequential, never loop
// Activate at progress thresholds (0-1) rather than fixed times,
// so they adapt to however long the API actually takes.
// ---------------------------------------------------------------------------

interface GenerationStage {
  label: string;
  /** Progress threshold (0-1) at which this stage activates */
  threshold: number;
}

const GENERATION_STAGES: GenerationStage[] = [
  { label: "Analyzing your experience and skills", threshold: 0 },
  { label: "Mapping keywords for ATS optimization", threshold: 0.12 },
  { label: "Crafting professional summary", threshold: 0.25 },
  { label: "Writing experience bullet points", threshold: 0.40 },
  { label: "Selecting template and layout", threshold: 0.58 },
  { label: "Polishing typography and design", threshold: 0.72 },
  { label: "Finalizing your resume", threshold: 0.88 },
];

// ---------------------------------------------------------------------------
// Asymptotic progress — always moves forward, never reaches 100%
// Fast at first, slows as it goes. Approaches 98% over very long times.
// ---------------------------------------------------------------------------

function computeProgress(elapsedMs: number): number {
  // Asymptotic curve: 1 - e^(-t/k)
  // k=20000 means ~63% at 20s, ~86% at 40s, ~95% at 60s, ~98% at 80s
  const k = 20000;
  return Math.min(0.98, 1 - Math.exp(-elapsedMs / k));
}

function getActiveStageIndex(progress: number): number {
  let idx = 0;
  for (let i = GENERATION_STAGES.length - 1; i >= 0; i--) {
    if (progress >= GENERATION_STAGES[i].threshold) {
      idx = i;
      break;
    }
  }
  return idx;
}

// ---------------------------------------------------------------------------
// Elapsed time hook
// ---------------------------------------------------------------------------

function useElapsedTime(isRunning: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!isRunning) {
      setElapsed(0);
      return;
    }
    startRef.current = Date.now();
    const tick = () => {
      setElapsed(Date.now() - startRef.current);
    };
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [isRunning]);

  return elapsed;
}

function formatElapsed(ms: number): string {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

// ---------------------------------------------------------------------------
// Skeleton resume preview
// ---------------------------------------------------------------------------

function ResumeSkeletonPreview({ activeStageIndex }: { activeStageIndex: number }) {
  return (
    <div className="w-52 rounded-lg border border-gray-800 bg-gray-900/60 p-4 space-y-3 shrink-0 select-none">
      {/* Name */}
      <div
        className={`h-3.5 rounded-sm transition-all duration-700 ${
          activeStageIndex >= 0 ? "bg-primary-500/30 w-28" : "bg-gray-800 w-28"
        }`}
      />
      {/* Headline */}
      <div
        className={`h-2 rounded-sm transition-all duration-700 ${
          activeStageIndex >= 0 ? "bg-gray-600 w-36" : "bg-gray-800 w-36"
        }`}
      />
      {/* Contact row */}
      <div className="flex gap-1.5">
        {[16, 20, 14].map((w, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-sm transition-all duration-700 ${
              activeStageIndex >= 1 ? "bg-gray-600" : "bg-gray-800"
            }`}
            style={{ width: `${w * 4}px` }}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-800" />

      {/* Summary */}
      <div className="space-y-1.5">
        <div
          className={`h-2 rounded-sm transition-all duration-700 ${
            activeStageIndex >= 2 ? "bg-primary-500/20 w-16" : "bg-gray-800 w-16"
          }`}
        />
        {[44, 48, 36].map((w, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-sm transition-all duration-700 ${
              activeStageIndex >= 2 ? "bg-gray-700" : "bg-gray-800"
            }`}
            style={{ width: `${w * 4}px` }}
          />
        ))}
      </div>

      {/* Experience */}
      <div className="space-y-1.5">
        <div
          className={`h-2 rounded-sm transition-all duration-700 ${
            activeStageIndex >= 3 ? "bg-primary-500/20 w-20" : "bg-gray-800 w-20"
          }`}
        />
        {[40, 48, 44, 32].map((w, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-sm transition-all duration-700 ${
              activeStageIndex >= 3 ? "bg-gray-700" : "bg-gray-800"
            }`}
            style={{ width: `${w * 4}px` }}
          />
        ))}
      </div>

      {/* Skills */}
      <div className="space-y-1.5">
        <div
          className={`h-2 rounded-sm transition-all duration-700 ${
            activeStageIndex >= 4 ? "bg-primary-500/20 w-12" : "bg-gray-800 w-12"
          }`}
        />
        <div className="flex gap-1 flex-wrap">
          {[24, 20, 28, 16, 22].map((w, i) => (
            <div
              key={i}
              className={`h-4 rounded transition-all duration-700 ${
                activeStageIndex >= 4 ? "bg-gray-700/60" : "bg-gray-800"
              }`}
              style={{ width: `${w * 2}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stage checklist
// ---------------------------------------------------------------------------

function StageChecklist({
  activeStageIndex,
  elapsed,
}: {
  activeStageIndex: number;
  elapsed: number;
}) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-xs">
      {GENERATION_STAGES.map((stage, i) => {
        const isCompleted = i < activeStageIndex;
        const isActive = i === activeStageIndex;
        const isPending = i > activeStageIndex;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{
              opacity: isPending ? 0.3 : 1,
              x: 0,
            }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="flex items-center gap-2.5"
          >
            {/* Status indicator */}
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                isCompleted
                  ? "bg-primary-500/20"
                  : isActive
                    ? "bg-primary-500/10 ring-1 ring-primary-500/50"
                    : "bg-gray-800"
              }`}
            >
              {isCompleted ? (
                <IconCheck className="text-primary-400" />
              ) : isActive ? (
                <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
              )}
            </div>

            {/* Label */}
            <span
              className={`text-xs transition-colors duration-500 ${
                isCompleted
                  ? "text-gray-500"
                  : isActive
                    ? "text-gray-200 font-medium"
                    : "text-gray-600"
              }`}
            >
              {stage.label}
            </span>
          </motion.div>
        );
      })}

      {/* Elapsed timer */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-800/50">
        <div className="w-5 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-3 h-3 rounded-full border-2 border-primary-500/30 border-t-primary-400"
          />
        </div>
        <span className="text-xs text-gray-500 tabular-nums">
          {formatElapsed(elapsed)} elapsed
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main loading animation
// ---------------------------------------------------------------------------

function GenerationLoadingAnimation({
  elapsed,
  onCancel,
}: {
  elapsed: number;
  onCancel: () => void;
}) {
  // Asymptotic progress — always moving, never stuck
  const progress = computeProgress(elapsed);
  const activeStageIndex = getActiveStageIndex(progress);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-14 h-14 flex items-center justify-center"
        >
          <div className="absolute inset-0 rounded-full bg-primary-500/10 animate-ping" style={{ animationDuration: "3s" }} />
          <div className="relative w-11 h-11 rounded-full bg-primary-500/20 flex items-center justify-center">
            <IconSparkles className="text-primary-400" />
          </div>
        </motion.div>
        <div>
          <h3 className="text-base font-semibold text-gray-100">
            Building your resume
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {elapsed > 45000
              ? "Almost there — AI is being extra thorough"
              : elapsed > 25000
                ? "Hang tight — complex resumes take a bit longer"
                : "AI is crafting a tailored, ATS-optimized document"}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-primary-600 to-primary-400"
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-gray-600">{Math.round(progress * 100)}%</span>
          <span className="text-xs text-gray-600 tabular-nums">{formatElapsed(elapsed)}</span>
        </div>
      </div>

      {/* Stages + skeleton preview */}
      <div className="flex gap-8 items-start">
        <StageChecklist activeStageIndex={activeStageIndex} elapsed={elapsed} />
        <div className="hidden sm:block">
          <ResumeSkeletonPreview activeStageIndex={activeStageIndex} />
        </div>
      </div>

      {/* Cancel button */}
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <IconX className="text-gray-500" />
        Cancel generation
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step Component
// ---------------------------------------------------------------------------

export default function StepGeneration() {
  const {
    personal,
    targetRole,
    experiences,
    education,
    skills,
    brief,
    generation,
    setIsGenerating,
    setGenerationError,
    setAbortController,
    nextStep,
    prevStep,
  } = useResumeCVWizard();

  const setResume = useResumeEditor((s) => s.setResume);

  // Local running state drives the elapsed timer — independent of store to
  // avoid Strict Mode timing issues where the store gets set/cleared rapidly.
  const [localRunning, setLocalRunning] = useState(false);
  const elapsed = useElapsedTime(localRunning);

  // -------------------------------------------------------------------
  // Auto-generate on mount (Strict Mode–safe)
  //
  // React 18 Strict Mode runs effects twice: mount → cleanup → mount.
  // We put the fetch directly in the useEffect. When cleanup fires,
  // the AbortController cancels the in-flight request. The second
  // mount starts a fresh fetch that runs to completion.
  // -------------------------------------------------------------------
  useEffect(() => {
    const abortCtrl = new AbortController();

    // Start UI immediately
    setAbortController(abortCtrl);
    setIsGenerating(true);
    setGenerationError(null);
    setLocalRunning(true);

    const payload = {
      personal,
      targetRole,
      experiences,
      education,
      skills,
      brief,
    };

    // Client-side timeout — 60 seconds
    const timeoutId = setTimeout(() => abortCtrl.abort(), 60_000);

    fetch("/api/chat/resume/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: abortCtrl.signal,
    })
      .then(async (res) => {
        if (abortCtrl.signal.aborted) return;
        if (!res.ok) throw new Error(`Generation failed (${res.status})`);
        const data = (await res.json()) as { resume: ResumeData };
        if (abortCtrl.signal.aborted) return;
        setResume(data.resume);
        setIsGenerating(false);
        setAbortController(null);
        setLocalRunning(false);
        nextStep();
      })
      .catch((err: unknown) => {
        if (abortCtrl.signal.aborted) {
          // Silently ignore aborts (Strict Mode cleanup or cancel)
          return;
        }
        setIsGenerating(false);
        setAbortController(null);
        setLocalRunning(false);
        setGenerationError(
          err instanceof Error ? err.message : "Generation failed. Please try again."
        );
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    // Cleanup: abort on unmount / Strict Mode re-fire
    return () => {
      clearTimeout(timeoutId);
      abortCtrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = useCallback(() => {
    const ctrl = useResumeCVWizard.getState().generation.abortController;
    ctrl?.abort();
    setIsGenerating(false);
    setAbortController(null);
    setLocalRunning(false);
    prevStep();
  }, [setIsGenerating, setAbortController, prevStep]);

  const handleRetry = useCallback(() => {
    // Force remount to restart the useEffect
    setGenerationError(null);
    setLocalRunning(false);
    // Small delay then re-trigger by toggling a key — simplest approach
    // Actually, we'll just call the generation inline
    const abortCtrl = new AbortController();
    setAbortController(abortCtrl);
    setIsGenerating(true);
    setLocalRunning(true);

    const timeoutId = setTimeout(() => abortCtrl.abort(), 60_000);

    const payload = {
      personal,
      targetRole,
      experiences,
      education,
      skills,
      brief,
    };

    fetch("/api/chat/resume/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: abortCtrl.signal,
    })
      .then(async (res) => {
        if (abortCtrl.signal.aborted) return;
        if (!res.ok) throw new Error(`Generation failed (${res.status})`);
        const data = (await res.json()) as { resume: ResumeData };
        if (abortCtrl.signal.aborted) return;
        setResume(data.resume);
        setIsGenerating(false);
        setAbortController(null);
        setLocalRunning(false);
        nextStep();
      })
      .catch((err: unknown) => {
        if (abortCtrl.signal.aborted) return;
        setIsGenerating(false);
        setAbortController(null);
        setLocalRunning(false);
        setGenerationError(
          err instanceof Error ? err.message : "Generation failed. Please try again."
        );
      })
      .finally(() => clearTimeout(timeoutId));
  }, [
    personal, targetRole, experiences, education, skills, brief,
    setIsGenerating, setGenerationError, setAbortController,
    setResume, nextStep,
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 flex flex-col items-center justify-center min-h-96">
      <AnimatePresence mode="wait">
        {localRunning ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <GenerationLoadingAnimation
              elapsed={elapsed}
              onCancel={handleCancel}
            />
          </motion.div>
        ) : generation.generationError ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-5 text-center max-w-sm"
          >
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200 mb-1">Generation failed</p>
              <p className="text-xs text-red-400/80">{generation.generationError}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={prevStep}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-300"
              >
                <IconArrowLeft />
                Go Back
              </button>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-gray-950 transition-all hover:bg-primary-400"
              >
                <IconRefresh />
                Try Again
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
              <IconCheck className="text-primary-400 w-5 h-5" />
            </div>
            <p className="text-sm text-gray-300">
              Resume generated! Opening editor...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
