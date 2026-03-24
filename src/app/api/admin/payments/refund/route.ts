import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/supabase/admin";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * POST /api/admin/payments/refund
 * Refund a successful payment:
 *  - Flutterwave: Automated refund via API → money returned to user
 *  - MTN MoMo: Manual refund required (no refund API in Collections)
 *  - Always: Deduct purchased credits from user + log audit trail
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

  // ── 1. Get the payment ──────────────────────────────────────
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

  // ── 2. Attempt automated money refund (provider-specific) ───
  let moneyRefunded = false;
  let refundNote = "";

  if (payment.payment_method === "mtn_momo") {
    // MTN Collections has no refund API — admin must manually send money back
    moneyRefunded = false;
    refundNote = "MTN MoMo: Automated refund not available. Admin must manually transfer K" +
      payment.amount + " back to " + (payment.phone_number || "user") + " via MTN MoMo or bank transfer.";

  } else if (payment.payment_method === "airtel_money") {
    // Airtel: same situation, no automated refund
    moneyRefunded = false;
    refundNote = "Airtel Money: Automated refund not available. Admin must manually transfer K" +
      payment.amount + " back to " + (payment.phone_number || "user") + ".";

  } else {
    // Flutterwave (card / mobile money via FLW) — has refund API
    const flwTxId = payment.flw_tx_id;
    const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY;

    if (flwTxId && FLW_SECRET) {
      try {
        const refundRes = await fetch(
          `https://api.flutterwave.com/v3/transactions/${flwTxId}/refund`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FLW_SECRET}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ amount: payment.amount }),
          },
        );
        const refundData = await refundRes.json();

        if (refundData.status === "success") {
          moneyRefunded = true;
          refundNote = "Flutterwave: Automated refund initiated. K" + payment.amount +
            " will be returned to user's account.";
        } else {
          moneyRefunded = false;
          refundNote = "Flutterwave: Automated refund failed (" +
            (refundData.message || "unknown error") +
            "). Admin must manually resolve with Flutterwave or transfer K" +
            payment.amount + " back to user.";
        }
      } catch (err) {
        moneyRefunded = false;
        refundNote = "Flutterwave: Refund API call failed. Admin must manually transfer K" +
          payment.amount + " back to user.";
      }
    } else {
      moneyRefunded = false;
      refundNote = "Flutterwave: No transaction ID or API key — cannot auto-refund. Admin must manually transfer K" +
        payment.amount + " back to user.";
    }
  }

  // ── 3. Mark payment as refunded (atomic — only if still successful) ──
  const { error: updateError } = await supabase
    .from("payments")
    .update({ status: "refunded" })
    .eq("id", paymentId)
    .eq("status", "successful");

  if (updateError) {
    return NextResponse.json({ error: "Failed to update payment status" }, { status: 500 });
  }

  // ── 4. Deduct purchased credits from user (don't go below 0) ──
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", payment.user_id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 500 });
  }

  const creditsToDeduct = Math.min(payment.credits_purchased, profile.credits);
  const newBalance = profile.credits - creditsToDeduct;

  await supabase
    .from("profiles")
    .update({ credits: newBalance, updated_at: new Date().toISOString() })
    .eq("id", payment.user_id);

  // ── 5. Log refund in credit_transactions for audit trail ────
  const description = [
    `Admin refund: ${reason.trim()}`,
    `K${payment.amount} ${payment.payment_method.replace("_", " ")}`,
    moneyRefunded ? "Money auto-refunded" : "Money requires manual refund",
    `(by ${admin.email})`,
  ].join(" — ");

  await supabase.from("credit_transactions").insert({
    user_id: payment.user_id,
    amount: -creditsToDeduct, // Negative — credits removed
    balance_after: newBalance,
    type: "refund",
    description,
    payment_ref: payment.flw_ref,
  });

  return NextResponse.json({
    success: true,
    paymentId,
    moneyRefunded,
    refundNote,
    creditsDeducted: creditsToDeduct,
    newBalance,
  });
}
