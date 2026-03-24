import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/supabase/admin";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * POST /api/admin/credits
 * Grant or revoke credits for a user. Creates audit trail.
 *
 * Body: { userId, amount, reason, type: "grant" | "revoke" }
 */
export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const body = await request.json();
  const { userId, amount, reason, type } = body as {
    userId: string;
    amount: number;
    reason: string;
    type: "grant" | "revoke";
  };

  // Validate inputs
  if (!userId || !reason?.trim()) {
    return NextResponse.json({ error: "userId and reason are required" }, { status: 400 });
  }

  if (!amount || amount <= 0 || !Number.isInteger(amount)) {
    return NextResponse.json({ error: "amount must be a positive integer" }, { status: 400 });
  }

  if (type !== "grant" && type !== "revoke") {
    return NextResponse.json({ error: "type must be 'grant' or 'revoke'" }, { status: 400 });
  }

  // Get current profile
  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("credits, full_name")
    .eq("id", userId)
    .single();

  if (readError || !profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const delta = type === "grant" ? amount : -amount;
  const newBalance = profile.credits + delta;

  if (newBalance < 0) {
    return NextResponse.json(
      { error: `Cannot revoke ${amount} credits — user only has ${profile.credits}` },
      { status: 400 }
    );
  }

  // Update balance
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ credits: newBalance, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update balance" }, { status: 500 });
  }

  // Log transaction with admin audit trail
  const description = `Admin ${type}: ${reason.trim()} (by ${admin.email})`;

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: delta,
    balance_after: newBalance,
    type: type === "grant" ? "bonus" : "usage",
    description,
  });

  return NextResponse.json({
    success: true,
    userId,
    previousBalance: profile.credits,
    newBalance,
    type,
    amount,
  });
}
