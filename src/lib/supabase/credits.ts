import { createClient as createServerClient } from "./server";
import { CREDIT_COSTS, computeApiCost, CREDIT_VALUE_USD } from "@/data/credit-costs";

export { CREDIT_COSTS };

/* ── Types ─────────────────────────────────────────────────── */

export interface CreditCost {
  toolId: string;
  operation: string;
  credits: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  model: string;
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
 * Optionally records token usage and real API cost for margin tracking.
 */
export async function deductCredits(
  userId: string,
  operation: string,
  description: string,
  toolId?: string,
  tokenUsage?: TokenUsage
): Promise<{ success: boolean; newBalance: number | null; error?: string }> {
  if (!isConfigured()) {
    return { success: true, newBalance: 9999 };
  }

  const supabase = await createServerClient();
  const cost = getCreditCost(operation);

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

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({ credits: newBalance, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .eq("credits", profile.credits)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { success: false, newBalance: null, error: "Update failed — try again" };
  }

  if (!updated) {
    return { success: false, newBalance: null, error: "Concurrent update — try again" };
  }

  // Compute real costs for margin tracking
  const apiCostUsd = tokenUsage
    ? computeApiCost(tokenUsage.inputTokens, tokenUsage.outputTokens, tokenUsage.model)
    : 0;
  const creditValueUsd = cost * CREDIT_VALUE_USD;

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: -cost,
    balance_after: newBalance,
    type: "usage",
    description,
    tool_id: toolId ?? null,
    input_tokens: tokenUsage?.inputTokens ?? 0,
    output_tokens: tokenUsage?.outputTokens ?? 0,
    model: tokenUsage?.model ?? null,
    api_cost_usd: apiCostUsd,
    credit_value_usd: creditValueUsd,
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
 * Update the most recent usage transaction for a user with token tracking data.
 * Called AFTER a streaming response completes, when we finally have token counts.
 */
export async function logTokenUsage(
  userId: string,
  operation: string,
  tokenUsage: TokenUsage
): Promise<void> {
  if (!isConfigured()) return;

  const supabase = await createServerClient();
  const cost = getCreditCost(operation);
  const apiCostUsd = computeApiCost(tokenUsage.inputTokens, tokenUsage.outputTokens, tokenUsage.model);
  const creditValueUsd = cost * CREDIT_VALUE_USD;

  // Find the most recent usage transaction for this user + operation description
  const { data } = await supabase
    .from("credit_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "usage")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (data?.id) {
    await supabase
      .from("credit_transactions")
      .update({
        input_tokens: tokenUsage.inputTokens,
        output_tokens: tokenUsage.outputTokens,
        model: tokenUsage.model,
        api_cost_usd: apiCostUsd,
        credit_value_usd: creditValueUsd,
      })
      .eq("id", data.id);
  }
}

/**
 * Refund credits back to a user (e.g., if AI call failed).
 * When AI fails, the user gets credits back — no value was delivered.
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
