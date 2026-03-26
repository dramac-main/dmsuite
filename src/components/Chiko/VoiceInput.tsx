"use client";

import { useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { VoiceInputState } from "@/hooks/useVoiceInput";

/* ── VoiceWaveform — Animated bars that respond to volume ───── */

function VoiceWaveform({ volume, isActive }: { volume: number; isActive: boolean }) {
  const bars = 5;
  return (
    <div className="flex items-center justify-center gap-0.75">
      {Array.from({ length: bars }).map((_, i) => {
        const phase = i / bars;
        const height = isActive
          ? 8 + volume * 16 * (0.5 + 0.5 * Math.sin(phase * Math.PI))
          : 4;
        return (
          <motion.div
            key={i}
            className="w-0.75 rounded-full bg-primary-400"
            animate={{ height }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 15,
              mass: 0.5,
            }}
          />
        );
      })}
    </div>
  );
}

/* ── Lock Icon — padlock SVG ────────────────────────────────── */

function LockIcon({ locked, className }: { locked: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {locked ? (
        <>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </>
      ) : (
        <>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 9.9-1" />
        </>
      )}
    </svg>
  );
}

/* ── VoiceRecordingOverlay — Full recording state UI ────────── */

interface VoiceRecordingOverlayProps {
  state: VoiceInputState;
  interimText: string;
  volumeLevel: number;
  errorMessage: string;
  isLocked: boolean;
  onStop: () => void;
  onCancel: () => void;
  onLock: () => void;
}

export function VoiceRecordingOverlay({
  state,
  interimText,
  volumeLevel,
  errorMessage,
  isLocked,
  onStop,
  onCancel,
  onLock,
}: VoiceRecordingOverlayProps) {
  const isListening = state === "listening";
  const isPolishing = state === "polishing";
  const isError = state === "error";

  return (
    <AnimatePresence>
      {(isListening || isPolishing || isError) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-x-0 bottom-0 z-10 rounded-xl border border-primary-500/30 bg-gray-900/95 p-3 backdrop-blur-lg"
        >
          {/* ── Error State ── */}
          {isError && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20">
                <svg className="h-4 w-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <p className="flex-1 text-xs text-red-300">{errorMessage}</p>
              <button
                onClick={onCancel}
                className="shrink-0 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ── Listening State ── */}
          {isListening && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {/* Pulsing mic indicator */}
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary-500/20"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/30">
                    <svg className="h-4 w-4 text-primary-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                  </div>
                </div>

                {/* Waveform */}
                <VoiceWaveform volume={volumeLevel} isActive />

                {/* Status text */}
                <span className="flex-1 text-xs text-primary-300">
                  {isLocked ? "Locked — tap Done when finished" : "Hold to speak · release to send"}
                </span>

                {/* Lock toggle */}
                {!isLocked && (
                  <button
                    onClick={onLock}
                    className="flex h-7 shrink-0 items-center gap-1 rounded-md border border-gray-600/40 px-2 text-xs text-gray-400 transition-colors hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300"
                    aria-label="Lock recording (hands-free)"
                    title="Lock for hands-free recording"
                  >
                    <LockIcon locked={false} className="h-3 w-3" />
                    <span className="hidden sm:inline">Lock</span>
                  </button>
                )}

                {/* Locked indicator */}
                {isLocked && (
                  <div className="flex h-7 shrink-0 items-center gap-1 rounded-md border border-primary-500/30 bg-primary-500/10 px-2 text-xs text-primary-400">
                    <LockIcon locked className="h-3 w-3" />
                    <span className="hidden sm:inline">Locked</span>
                  </div>
                )}

                {/* Cancel */}
                <button
                  onClick={onCancel}
                  className="shrink-0 rounded-md px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
                  aria-label="Cancel recording"
                >
                  Cancel
                </button>

                {/* Done — only in locked mode */}
                {isLocked && (
                  <button
                    onClick={onStop}
                    className={cn(
                      "flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all",
                      "bg-primary-500 text-gray-950 hover:bg-primary-400 active:scale-95"
                    )}
                    aria-label="Done speaking"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Done
                  </button>
                )}
              </div>

              {/* Interim transcript preview */}
              {interimText && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-lg border border-gray-700/30 bg-gray-800/40 px-3 py-2"
                >
                  <p className="text-xs leading-relaxed text-gray-300">
                    {interimText}
                    <motion.span
                      className="ml-0.5 inline-block h-3 w-0.5 bg-primary-400"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {/* ── Polishing State ── */}
          {isPolishing && (
            <div className="flex items-center gap-3">
              <motion.div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-500/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <svg className="h-4 w-4 text-secondary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v3m6.36-.64-2.12 2.12M21 12h-3m.64 6.36-2.12-2.12M12 21v-3m-6.36.64 2.12-2.12M3 12h3m-.64-6.36 2.12 2.12" />
                </svg>
              </motion.div>
              <span className="text-xs text-secondary-300">Polishing grammar...</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── MicButton — Hold-to-speak mic button for the input bar ─── */

/** Minimum hold time (ms) to distinguish tap from hold */
const HOLD_THRESHOLD = 200;

interface MicButtonProps {
  isSupported: boolean;
  isListening: boolean;
  isLocked: boolean;
  isDisabled: boolean;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  onTapToggle: () => void;
}

export function MicButton({
  isSupported,
  isListening,
  isLocked,
  isDisabled,
  onHoldStart,
  onHoldEnd,
  onTapToggle,
}: MicButtonProps) {
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoldingRef = useRef(false);
  const startedRef = useRef(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const handlePointerDown = useCallback(() => {
    if (isDisabled) return;

    // If already listening in locked mode, a tap should stop
    if (isListening && isLocked) {
      return; // let click handler deal with it via onTapToggle
    }

    isHoldingRef.current = false;
    startedRef.current = false;

    // Start a timer — if held past threshold, treat as hold-to-speak
    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      startedRef.current = true;
      onHoldStart();
    }, HOLD_THRESHOLD);
  }, [isDisabled, isListening, isLocked, onHoldStart]);

  const handlePointerUp = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (isHoldingRef.current && !isLocked) {
      // Was holding → release = stop & process
      isHoldingRef.current = false;
      onHoldEnd();
    }
    // If it was a short tap (not a hold), the click handler below handles it
  }, [isLocked, onHoldEnd]);

  const handleClick = useCallback(() => {
    if (isDisabled) return;

    // If we already started via hold, skip the click
    if (startedRef.current) {
      startedRef.current = false;
      return;
    }

    // Short tap — toggle (start or stop)
    onTapToggle();
  }, [isDisabled, onTapToggle]);

  // Pointer leaves the button while holding → treat as release
  const handlePointerLeave = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (isHoldingRef.current && !isLocked) {
      isHoldingRef.current = false;
      onHoldEnd();
    }
  }, [isLocked, onHoldEnd]);

  if (!isSupported) return null;

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        "mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all select-none touch-none",
        isListening
          ? "bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/40"
          : "text-gray-500 hover:bg-gray-700/40 hover:text-primary-400",
        "disabled:opacity-30 active:scale-90"
      )}
      aria-label={isListening ? "Release to send" : "Hold to speak"}
      title={isListening ? (isLocked ? "Locked — tap Done in overlay" : "Release to send") : "Hold to speak (tap to lock)"}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
      </svg>
    </button>
  );
}
