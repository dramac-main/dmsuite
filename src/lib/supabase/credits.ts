import { createClient as createServerClient } from "./server";
import { CREDIT_COSTS } from "@/data/credit-costs";

export { CREDIT_COSTS };

/* ── Types ─────────────────────────────────────────────────── */

export interface CreditCost {
  toolId: string;
  operation: string;
  credits: number;
}

/** Whether Supabase is configured (if not, all credit checks pass) */
function isConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Get the credit cost for a given operation.
 * Returns 5 as safe default for unknown operations.
 */
export function getCreditCost(operation: string): number {
  return CREDIT_COSTS[operation] ?? 5;
}

/**
 * Check if a user has enough credits for an operation.
 * Returns { allowed, balance, cost, deficit }.
 */
export async function checkCredits(
  userId: string,
  operation: string
): Promise<{
  allowed: boolean;
  balance: number;
  cost: number;
  deficit: number;
}> {
  // Dev mode: always allow
  if (!isConfigured()) {
    return { allowed: true, balance: 9999, cost: getCreditCost(operation), deficit: 0 };
  }

  const supabase = await createServerClient();
  const cost = getCreditCost(operation);

  const { data, error } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return { allowed: false, balance: 0, cost, deficit: cost };
  }

  const balance = data.credits;
  return {
    allowed: balance >= cost,
    balance,
    cost,
    deficit: Math.max(0, cost - balance),
  };
}

/**
 * Deduct credits from a user's balance and log the transaction.
 * Returns the new balance, or null if insufficient credits.
 */
export async function deductCredits(
  userId: string,
  operation: string,
  description: string,
  toolId?: string
): Promise<{ success: boolean; newBalance: number | null; error?: string }> {
  // Dev mode: always succeed
  if (!isConfigured()) {
    return { success: true, newBalance: 9999 };
  }

  const supabase = await createServerClient();
  const cost = getCreditCost(operation);

  // Use a transaction-safe approach: read, check, update, log
  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (readError || !profile) {
    return { success: false, newBalance: null, error: "User not found" };
  }

  if (profile.credits < cost) {
    return {
      success: false,
      newBalance: profile.credits,
      error: "Insufficient credits",
    };
  }

  const newBalance = profile.credits - cost;

  // Update balance (optimistic concurrency: only update if credits haven't changed)
  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({ credits: newBalance, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .eq("credits", profile.credits) // Optimistic concurrency check
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { success: false, newBalance: null, error: "Update failed — try again" };
  }

  // If no rows matched, another request changed the balance (race condition)
  if (!updated) {
    return { success: false, newBalance: null, error: "Concurrent update — try again" };
  }

  // Log the transaction
  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: -cost,
    balance_after: newBalance,
    type: "usage",
    description,
    tool_id: toolId ?? null,
  });

  return { success: true, newBalance };
}

/**
 * Add credits to a user's balance (after successful payment).
 */
export async function addCredits(
  userId: string,
  credits: number,
  description: string,
  paymentRef?: string
): Promise<{ success: boolean; newBalance: number | null }> {
  if (!isConfigured()) return { success: true, newBalance: 9999 };

  const supabase = await createServerClient();

  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (readError || !profile) {
    return { success: false, newBalance: null };
  }

  const newBalance = profile.credits + credits;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ credits: newBalance, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (updateError) {
    return { success: false, newBalance: null };
  }

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: credits,
    balance_after: newBalance,
    type: "purchase",
    description,
    payment_ref: paymentRef ?? null,
  });

  return { success: true, newBalance };
}

/**
 * Refund credits back to a user (e.g., if AI call failed).
 */
export async function refundCredits(
  userId: string,
  credits: number,
  description: string
): Promise<{ success: boolean; newBalance: number | null }> {
  if (!isConfigured()) return { success: true, newBalance: 9999 };

  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (!profile) return { success: false, newBalance: null };

  const newBalance = profile.credits + credits;

  const { error } = await supabase
    .from("profiles")
    .update({ credits: newBalance, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { success: false, newBalance: null };

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: credits,
    balance_after: newBalance,
    type: "refund",
    description,
  });

  return { success: true, newBalance };
}
