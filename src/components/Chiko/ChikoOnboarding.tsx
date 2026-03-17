"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useChikoStore } from "@/stores/chiko";
import { Chiko3DAvatar } from "./Chiko3DAvatar";
import { IconArrowRight, IconX } from "@/components/icons";

/* ── Chiko Onboarding Tour ───────────────────────────────────
   Interactive multi-step walkthrough for first-time users.
   Persists completion in localStorage so it only shows once.
   Mobile-first, fully responsive, accessible.
   ──────────────────────────────────────────────────────────── */

interface TourStep {
  id: string;
  title: string;
  description: string;
  emoji: string;
  cta?: string;
  action?: "open-chiko" | "navigate" | "next";
  navigateTo?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Hey! I'm Chiko ✨",
    description:
      "I'm your personal AI creative assistant! I live right here in DMSuite and I know everything about every single tool. I can help you create, navigate, brainstorm, and so much more.",
    emoji: "👋",
    cta: "Nice to meet you!",
  },
  {
    id: "tools",
    title: "194 Tools, 8 Categories",
    description:
      "From logo design and resume building to video editing and marketing automation — DMSuite has you covered. I know every tool and can guide you to exactly the right one for your project.",
    emoji: "🎨",
    cta: "Show me more!",
  },
  {
    id: "powers",
    title: "I Can Do Almost Anything",
    description:
      'Just tell me what you need! I can navigate you to any tool, explain features, brainstorm creative ideas, write copy, suggest workflows, and much more. Try typing "/navigate logo" or just ask "help me build a resume."',
    emoji: "⚡",
    cta: "That's awesome!",
  },
  {
    id: "shortcuts",
    title: "I'm Always One Tap Away",
    description:
      "Tap my floating button or press Ctrl+. from anywhere to summon me instantly. I also support slash commands like /tools, /navigate, /help, and /shortcuts. On mobile, I'm a single tap away!",
    emoji: "🚀",
    cta: "Let's get started!",
  },
  {
    id: "ready",
    title: "You're All Set!",
    description:
      "Head to the Dashboard to explore all categories, or tell me what you want to create and I'll take you right there. I'll be in the corner whenever you need me. Let's make something amazing! 🎉",
    emoji: "🎉",
    cta: "Go to Dashboard",
    action: "navigate",
    navigateTo: "/dashboard",
  },
];

const TOUR_STORAGE_KEY = "dmsuite-chiko-tour-complete";

export function ChikoOnboarding() {
  const router = useRouter();
  const { open: openChiko } = useChikoStore();
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Check if tour was already completed
  useEffect(() => {
    // Small delay so the page loads first
    const timer = setTimeout(() => {
      try {
        const done = localStorage.getItem(TOUR_STORAGE_KEY);
        if (!done) setShow(true);
      } catch {
        // localStorage unavailable
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const completeTour = useCallback(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    setExiting(true);
    setTimeout(() => {
      setShow(false);
      setExiting(false);
    }, 400);
  }, []);

  const handleCta = useCallback(() => {
    const currentStep = TOUR_STEPS[step];

    if (step === TOUR_STEPS.length - 1) {
      // Last step — complete tour
      completeTour();
      if (currentStep.action === "navigate" && currentStep.navigateTo) {
        router.push(currentStep.navigateTo);
      }
      // Open Chiko after tour ends
      setTimeout(() => openChiko(), 600);
      return;
    }

    setStep((s) => s + 1);
  }, [step, completeTour, router, openChiko]);

  const handleSkip = useCallback(() => {
    completeTour();
  }, [completeTour]);

  if (!show) return null;

  const currentStep = TOUR_STEPS[step];
  const progress = ((step + 1) / TOUR_STEPS.length) * 100;

  return (
    <AnimatePresence>
      {!exiting && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            onClick={handleSkip}
          />

          {/* Tour card */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-[201] flex flex-col overflow-hidden",
              "rounded-2xl border border-gray-700/60 bg-gray-900/98 shadow-2xl shadow-black/50",
              "backdrop-blur-xl",
              // Mobile: full-width bottom sheet
              "inset-x-3 bottom-3 max-h-[85vh]",
              // Tablet+: centered card
              "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
              "sm:w-[440px] sm:max-h-[520px]"
            )}
          >
            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
              aria-label="Skip tour"
            >
              <IconX className="h-4 w-4" />
            </button>

            {/* Progress bar */}
            <div className="h-1 w-full bg-gray-800">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col items-center px-6 py-6 sm:px-8 sm:py-8">
              {/* Avatar + emoji */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="mb-4 flex flex-col items-center gap-3"
                >
                  {step === 0 ? (
                    <Chiko3DAvatar size="xl" animated expression="greeting" showGlow />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-800/80 text-3xl sm:h-16 sm:w-16 sm:text-4xl">
                      {currentStep.emoji}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Title & description */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 text-center"
                >
                  <h2 className="mb-2 text-lg font-bold text-white sm:text-xl">
                    {currentStep.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-gray-400 sm:text-base">
                    {currentStep.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Step indicator dots */}
              <div className="mt-5 flex items-center gap-2 sm:mt-6">
                {TOUR_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      i === step
                        ? "w-6 bg-primary-500"
                        : i < step
                          ? "w-2 bg-primary-500/40"
                          : "w-2 bg-gray-700"
                    )}
                    aria-label={`Go to step ${i + 1}`}
                  />
                ))}
              </div>

              {/* CTA button */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCta}
                className={cn(
                  "mt-5 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all sm:mt-6 sm:px-8 sm:py-3.5 sm:text-base",
                  "bg-gradient-to-r from-primary-500 to-primary-600 text-gray-950",
                  "shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40",
                  "active:scale-95"
                )}
              >
                {currentStep.cta}
                <IconArrowRight className="h-4 w-4" />
              </motion.button>

              {/* Skip text */}
              {step < TOUR_STEPS.length - 1 && (
                <button
                  onClick={handleSkip}
                  className="mt-3 text-xs text-gray-600 transition-colors hover:text-gray-400"
                >
                  Skip tour
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
