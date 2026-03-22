import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { addCredits } from "@/lib/supabase/credits";

/* ── POST /api/payments/webhook ────────────────────────────── */

/**
 * Flutterwave webhook handler.
 * This endpoint receives payment confirmations from Flutterwave.
 * It is NOT protected by auth middleware (webhooks come from Flutterwave, not users).
 */
export async function POST(request: Request) {
  try {
    // 1. Verify webhook signature
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    const signature = request.headers.get("verif-hash");

    if (!secretHash || signature !== secretHash) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = await request.json();
    const event = body.event;
    const data = body.data;

    // We only care about successful charges
    if (event !== "charge.completed" || data?.status !== "successful") {
      return NextResponse.json({ status: "ignored" });
    }

    const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!FLW_SECRET) {
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    // 2. VERIFY the transaction with Flutterwave (never trust webhook alone)
    const txId = data.id;
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${txId}/verify`,
      {
        headers: { Authorization: `Bearer ${FLW_SECRET}` },
      }
    );
    const verified = await verifyRes.json();

    if (
      verified.status !== "success" ||
      verified.data?.status !== "successful"
    ) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    const txRef = verified.data.tx_ref;
    const amount = verified.data.amount;

    // 3. Use service role client to bypass RLS
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    );

    // 4. Find the pending payment
    const { data: payment, error: findError } = await supabase
      .from("payments")
      .select("*")
      .eq("flw_ref", txRef)
      .single();

    if (findError || !payment) {
      console.error("Webhook: payment record not found for tx_ref:", txRef);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Prevent double-processing
    if (payment.status === "successful") {
      return NextResponse.json({ status: "already processed" });
    }

    // Verify amount matches what we expected
    if (Number(payment.amount) !== amount) {
      console.error(
        `Webhook: amount mismatch. Expected ${payment.amount}, got ${amount} for tx_ref ${txRef}`
      );
      await supabase
        .from("payments")
        .update({ status: "failed", flw_tx_id: String(txId) })
        .eq("id", payment.id);
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    // 5. Update payment as successful
    await supabase
      .from("payments")
      .update({ status: "successful", flw_tx_id: String(txId) })
      .eq("id", payment.id);

    // 6. Add credits to user's account
    await addCredits(
      payment.user_id,
      payment.credits_purchased,
      `Purchased ${payment.credits_purchased} credits (K${payment.amount} via ${payment.payment_method})`,
      txRef
    );

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
