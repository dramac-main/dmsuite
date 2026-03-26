"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { VoiceInputState } from "@/hooks/useVoiceInput";

/* ── VoiceWaveform — Animated bars that respond to volume ───── */

function VoiceWaveform({ volume, isActive }: { volume: number; isActive: boolean }) {
  const bars = 5;
  return (
    <div className="flex items-center justify-center gap-0.75">
      {Array.from({ length: bars }).map((_, i) => {
        // Each bar has a slightly different phase for natural movement
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

/* ── VoiceRecordingOverlay — Full recording state UI ────────── */

interface VoiceRecordingOverlayProps {
  state: VoiceInputState;
  interimText: string;
  volumeLevel: number;
  errorMessage: string;
  onStop: () => void;
  onCancel: () => void;
}

export function VoiceRecordingOverlay({
  state,
  interimText,
  volumeLevel,
  errorMessage,
  onStop,
  onCancel,
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
                <span className="flex-1 text-xs text-primary-300">Listening...</span>

                {/* Controls */}
                <button
                  onClick={onCancel}
                  className="shrink-0 rounded-md px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
                  aria-label="Cancel recording"
                >
                  Cancel
                </button>
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

/* ── MicButton — Mic icon button for the input bar ──────────── */

interface MicButtonProps {
  isSupported: boolean;
  isListening: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

export function MicButton({ isSupported, isListening, isDisabled, onClick }: MicButtonProps) {
  if (!isSupported) return null;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded transition-all",
        isListening
          ? "text-primary-400 animate-pulse"
          : "text-gray-500 hover:text-primary-400",
        "disabled:opacity-30"
      )}
      aria-label={isListening ? "Stop recording" : "Voice input"}
      title={isListening ? "Stop recording" : "Voice input (speak to Chiko)"}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
      </svg>
    </button>
  );
}
