"use client";

import { useState, useCallback, useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { CREDIT_PACKS as PACKS_DATA } from "@/data/credit-costs";

/* ── Credit Packs ──────────────────────────────────────────── */

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceZMW: number;
  perCredit: string;
  popular?: boolean;
}

const CREDIT_PACKS: CreditPack[] = PACKS_DATA as unknown as CreditPack[];

type PaymentProvider = "airtel_money" | "mtn_momo";
type PaymentStep = "select-pack" | "enter-phone" | "processing" | "success" | "failed";

/* ── Zambian Phone Number Utilities ────────────────────────── */

// Zambian mobile network prefixes (after 0 or +260)
const NETWORK_PREFIXES: Record<string, { network: PaymentProvider; label: string }> = {
  "96": { network: "mtn_momo", label: "MTN" },
  "76": { network: "mtn_momo", label: "MTN" },
  "95": { network: "mtn_momo", label: "MTN" },
  "97": { network: "airtel_money", label: "Airtel" },
  "77": { network: "airtel_money", label: "Airtel" },
};

/** Strip all non-digits, strip leading country code → return local 9 or 10 digits */
function toRawDigits(input: string): string {
  const digits = input.replace(/\D/g, "");
  // Strip leading 260 if present (e.g. 260971234567 → 971234567)
  if (digits.startsWith("260") && digits.length >= 12) return digits.slice(3);
  // Strip leading 0 if present (e.g. 0971234567 → 971234567)
  if (digits.startsWith("0") && digits.length >= 10) return digits.slice(1);
  return digits;
}

/** Format raw local digits (e.g. "971234567") → "+260 97 123 4567" */
function formatZambianNumber(raw: string): string {
  if (raw.length === 0) return "+260 ";
  if (raw.length <= 2) return `+260 ${raw}`;
  if (raw.length <= 5) return `+260 ${raw.slice(0, 2)} ${raw.slice(2)}`;
  return `+260 ${raw.slice(0, 2)} ${raw.slice(2, 5)} ${raw.slice(5, 9)}`;
}

/** Detect network from raw digits */
function detectNetwork(raw: string): { network: PaymentProvider; label: string } | null {
  if (raw.length < 2) return null;
  const prefix = raw.slice(0, 2);
  return NETWORK_PREFIXES[prefix] ?? null;
}

/** Validate and return specific error */
function validateZambianPhone(raw: string): { valid: boolean; error?: string } {
  if (raw.length === 0) return { valid: false };
  if (raw.length < 2) return { valid: false, error: "Keep typing…" };
  const prefix = raw.slice(0, 2);
  if (!NETWORK_PREFIXES[prefix]) {
    return { valid: false, error: `${prefix}X is not a valid Zambian mobile prefix` };
  }
  if (raw.length < 9) return { valid: false, error: `${9 - raw.length} more digits needed` };
  if (raw.length > 9) return { valid: false, error: "Too many digits" };
  return { valid: true };
}

export default function CreditPurchaseModal({ onClose }: { onClose: () => void }) {
  const { profile, refreshProfile } = useUser();
  const [step, setStep] = useState<PaymentStep>("select-pack");
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [rawDigits, setRawDigits] = useState(() => {
    const initial = profile?.phone ?? "";
    return initial ? toRawDigits(initial) : "";
  });
  const [provider, setProvider] = useState<PaymentProvider>("airtel_money");
  const [error, setError] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [polling, setPolling] = useState(false);
  const [touched, setTouched] = useState(false);

  // Derived state from raw digits
  const formattedPhone = useMemo(() => formatZambianNumber(rawDigits), [rawDigits]);
  const detectedNetwork = useMemo(() => detectNetwork(rawDigits), [rawDigits]);
  const validation = useMemo(() => validateZambianPhone(rawDigits), [rawDigits]);
  const cleanPhoneForApi = useMemo(() => rawDigits.length === 9 ? `+260${rawDigits}` : "", [rawDigits]);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Extract raw digits from whatever the user typed/pasted
    let raw = toRawDigits(input);
    // Cap at 9 digits (Zambian local number length)
    if (raw.length > 9) raw = raw.slice(0, 9);
    setRawDigits(raw);
    setTouched(true);

    // Auto-select provider based on detected network
    const net = detectNetwork(raw);
    if (net) setProvider(net.network);
  }, []);

  const handleSelectPack = (pack: CreditPack) => {
    setSelectedPack(pack);
    setStep("enter-phone");
  };

  const handlePay = async () => {
    setError("");

    if (!validation.valid) {
      setError(validation.error || "Enter a valid Zambian number");
      return;
    }

    if (!selectedPack) return;

    setStep("processing");

    // Route to the correct API based on provider
    const isMtn = provider === "mtn_momo";
    const endpoint = isMtn ? "/api/payments/mtn/initiate" : "/api/payments/initiate";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: selectedPack.id,
          phoneNumber: cleanPhoneForApi,
          ...(isMtn ? {} : { provider }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Payment failed");
        setStep("enter-phone");
        return;
      }

      setPaymentRef(data.paymentRef);
      // Poll the correct status endpoint based on provider
      pollPaymentStatus(data.paymentRef, isMtn);
    } catch {
      setError("Network error — please try again");
      setStep("enter-phone");
    }
  };

  const pollPaymentStatus = async (ref: string, isMtn: boolean) => {
    setPolling(true);
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes (every 5 seconds)

    const statusEndpoint = isMtn
      ? `/api/payments/mtn/status?ref=${encodeURIComponent(ref)}`
      : `/api/payments/status?ref=${encodeURIComponent(ref)}`;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError("Payment timed out. Check your mobile money app and contact support if charged.");
        setStep("failed");
        setPolling(false);
        return;
      }

      try {
        const res = await fetch(statusEndpoint);
        const data = await res.json();

        if (data.status === "successful") {
          await refreshProfile();
          setStep("success");
          setPolling(false);
          return;
        }

        if (data.status === "failed") {
          setError("Payment was declined. Please try again.");
          setStep("failed");
          setPolling(false);
          return;
        }

        // Still pending — poll again
        attempts++;
        setTimeout(poll, 5000);
      } catch {
        attempts++;
        setTimeout(poll, 5000);
      }
    };

    poll();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          {/* ── Step 1: Select Pack ─────────────────────────── */}
          {step === "select-pack" && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Buy AI Credits
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Credits power AI features. Your balance: <strong className="text-primary-500">{profile?.credits ?? 0}</strong>
              </p>

              <div className="grid grid-cols-2 gap-3">
                {CREDIT_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => handleSelectPack(pack)}
                    className={cn(
                      "relative rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg",
                      pack.popular
                        ? "border-primary-500 bg-primary-500/5 dark:bg-primary-500/10 ring-1 ring-primary-500/30"
                        : "border-gray-200 dark:border-gray-700 hover:border-primary-500/50"
                    )}
                  >
                    {pack.popular && (
                      <span className="absolute -top-2.5 left-3 rounded-full bg-primary-500 px-2 py-0.5 text-[0.6rem] font-bold text-gray-950">
                        BEST VALUE
                      </span>
                    )}
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {pack.credits.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      credits
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      K{pack.priceZMW}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {pack.perCredit} each
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Step 2: Enter Phone ────────────────────────── */}
          {step === "enter-phone" && selectedPack && (
            <>
              <button
                onClick={() => setStep("select-pack")}
                className="mb-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Pay with Mobile Money
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {selectedPack.credits.toLocaleString()} credits for <strong>K{selectedPack.priceZMW}</strong>
              </p>

              {error && (
                <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error mb-4">
                  {error}
                </div>
              )}

              {/* Provider selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment method
                  {detectedNetwork && (
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      Auto-detected: {detectedNetwork.label}
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProvider("airtel_money")}
                    className={cn(
                      "rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                      provider === "airtel_money"
                        ? "border-error bg-error/5 text-error dark:text-error"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    Airtel Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider("mtn_momo")}
                    className={cn(
                      "rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                      provider === "mtn_momo"
                        ? "border-warning bg-warning/5 text-warning dark:text-warning"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    MTN MoMo
                  </button>
                </div>
              </div>

              {/* Phone number with smart formatting */}
              <div className="mb-6">
                <label htmlFor="payPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Phone number
                </label>
                <div className="relative">
                  <input
                    id="payPhone"
                    type="tel"
                    value={formattedPhone}
                    onChange={handlePhoneChange}
                    onBlur={() => setTouched(true)}
                    placeholder="+260 97 123 4567"
                    className={cn(
                      "w-full rounded-lg border bg-white dark:bg-gray-800 px-3.5 py-2.5 pr-10 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none transition-colors",
                      validation.valid
                        ? "border-success focus:border-success focus:ring-2 focus:ring-success/20"
                        : touched && rawDigits.length > 0 && validation.error
                          ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
                          : "border-gray-300 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    )}
                  />
                  {/* Validation icon */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {validation.valid ? (
                      <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : touched && rawDigits.length > 1 && validation.error ? (
                      <svg className="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    ) : null}
                  </div>
                </div>
                {/* Inline hint / error */}
                <div className="mt-1.5 h-5">
                  {validation.valid && detectedNetwork ? (
                    <p className="text-xs text-success flex items-center gap-1">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" /></svg>
                      Valid {detectedNetwork.label} number
                    </p>
                  ) : touched && rawDigits.length > 1 && validation.error ? (
                    <p className="text-xs text-error">{validation.error}</p>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Enter your Zambian mobile number
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handlePay}
                disabled={!validation.valid}
                className={cn(
                  "w-full rounded-lg px-4 py-3 text-sm font-semibold shadow-sm transition-colors",
                  validation.valid
                    ? "bg-primary-500 text-gray-950 hover:bg-primary-400 cursor-pointer"
                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                )}
              >
                Pay K{selectedPack.priceZMW} via {provider === "airtel_money" ? "Airtel Money" : "MTN MoMo"}
              </button>

              <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
                You&apos;ll receive a PIN prompt on your phone
              </p>
            </>
          )}

          {/* ── Step 3: Processing ─────────────────────────── */}
          {step === "processing" && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary-500/10 flex items-center justify-center">
                <svg className="h-7 w-7 text-primary-500 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Check your phone
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                A PIN prompt has been sent to your mobile phone.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your PIN to confirm the payment.
              </p>
              {polling && (
                <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                  Waiting for confirmation…
                </p>
              )}
            </div>
          )}

          {/* ── Step 4: Success ────────────────────────────── */}
          {step === "success" && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-success/10 flex items-center justify-center">
                <svg className="h-7 w-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Payment successful!
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {selectedPack?.credits.toLocaleString()} credits added to your account.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                New balance: <strong className="text-primary-500">{profile?.credits ?? 0} credits</strong>
              </p>
              <button
                onClick={onClose}
                className="rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-gray-950 hover:bg-primary-400 transition-colors"
              >
                Continue creating
              </button>
            </div>
          )}

          {/* ── Step 5: Failed ─────────────────────────────── */}
          {step === "failed" && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-error/10 flex items-center justify-center">
                <svg className="h-7 w-7 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Payment failed
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {error || "Something went wrong. Please try again."}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setError("");
                    setStep("enter-phone");
                  }}
                  className="rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-gray-950 hover:bg-primary-400 transition-colors"
                >
                  Try again
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
              {paymentRef && (
                <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                  Reference: {paymentRef}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
