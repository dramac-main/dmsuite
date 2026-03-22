"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import CreditPurchaseModal from "./CreditPurchaseModal";

export default function CreditBalance() {
  const { profile, loading } = useUser();
  const [showPurchase, setShowPurchase] = useState(false);

  if (loading) {
    return (
      <div className="h-8 w-20 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
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
