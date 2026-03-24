"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import CreditPurchaseModal from "./CreditPurchaseModal";

/** Dispatch this event from anywhere to open the purchase modal */
export function openCreditPurchase() {
  window.dispatchEvent(new CustomEvent("dmsuite:open-credit-purchase"));
}

export default function CreditBalance() {
  const { profile, loading, error, retry } = useUser();
  const [showPurchase, setShowPurchase] = useState(false);

  // Listen for global "open purchase" events from any component
  useEffect(() => {
    const handler = () => setShowPurchase(true);
    window.addEventListener("dmsuite:open-credit-purchase", handler);
    return () => window.removeEventListener("dmsuite:open-credit-purchase", handler);
  }, []);

  if (loading) {
    return (
      <div className="h-8 w-20 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
    );
  }

  if (error) {
    return (
      <button
        onClick={retry}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-error/10 text-error hover:bg-error/20 transition-colors"
        title="Failed to load credits — click to retry"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
        Retry
      </button>
    );
  }

  if (!profile) return null;

  const isLow = profile.credits <= 10;

  return (
    <>
      <button
        onClick={() => setShowPurchase(true)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
          isLow
            ? "bg-error/10 text-error hover:bg-error/20"
            : "bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20"
        }`}
        title="Click to buy credits"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
        </svg>
        {profile.credits} credits
      </button>

      {showPurchase && (
        <CreditPurchaseModal onClose={() => setShowPurchase(false)} />
      )}
    </>
  );
}
