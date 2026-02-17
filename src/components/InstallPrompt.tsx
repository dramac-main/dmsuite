"use client";

import { useState, useEffect } from "react";
import { IconX, IconDownload } from "@/components/icons";

/**
 * PWA Install Prompt — shows a dismissible banner when the browser fires
 * `beforeinstallprompt`. Respects user dismissal via sessionStorage.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem("dmsuite-install-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setDismissed(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prompt = deferredPrompt as any;
    prompt.prompt();
    await prompt.userChoice;
    setDeferredPrompt(null);
    setDismissed(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("dmsuite-install-dismissed", "1");
  };

  if (dismissed || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 lg:bottom-6 lg:left-auto lg:right-6 lg:w-96 z-500 animate-in slide-in-from-bottom-4">
      <div className="rounded-2xl bg-gray-900 dark:bg-gray-800 border border-gray-700 shadow-2xl p-4 flex items-center gap-4">
        <div className="size-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
          <IconDownload className="size-5 text-primary-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Install DMSuite</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Get the full app experience with offline access.
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="px-4 py-2 rounded-xl bg-primary-500 text-gray-950 text-xs font-semibold hover:bg-primary-400 transition-colors shrink-0"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors"
          aria-label="Dismiss install prompt"
        >
          <IconX className="size-4" />
        </button>
      </div>
    </div>
  );
}
