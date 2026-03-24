import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/supabase/admin";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * POST /api/admin/payments/refund
 * Mark a successful payment as refunded and grant credits back.
 *
 * Body: { paymentId, reason }
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
  const { paymentId, reason } = body as { paymentId: string; reason: string };

  if (!paymentId || !reason?.trim()) {
    return NextResponse.json({ error: "paymentId and reason are required" }, { status: 400 });
  }

  // Get the payment
  const { data: payment, error: findError } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (findError || !payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.status === "refunded") {
    return NextResponse.json({ error: "Payment already refunded" }, { status: 400 });
  }

  if (payment.status !== "successful") {
    return NextResponse.json(
      { error: `Cannot refund a payment with status "${payment.status}"` },
      { status: 400 },
    );
  }

  // Mark payment as refunded
  const { error: updateError } = await supabase
    .from("payments")
    .update({ status: "refunded" })
    .eq("id", paymentId)
    .eq("status", "successful"); // Atomic — only if still successful

  if (updateError) {
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }

  // Grant the credits back to the user
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", payment.user_id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 500 });
  }

  const newBalance = profile.credits + payment.credits_purchased;

  await supabase
    .from("profiles")
    .update({ credits: newBalance, updated_at: new Date().toISOString() })
    .eq("id", payment.user_id);

  // Log the refund transaction
  const description = `Admin refund: ${reason.trim()} — K${payment.amount} ${payment.payment_method} (by ${admin.email})`;

  await supabase.from("credit_transactions").insert({
    user_id: payment.user_id,
    amount: payment.credits_purchased,
    balance_after: newBalance,
    type: "refund",
    description,
    payment_ref: payment.flw_ref,
  });

  return NextResponse.json({
    success: true,
    paymentId,
    creditsRefunded: payment.credits_purchased,
    newBalance,
  });
}
