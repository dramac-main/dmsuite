import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { addCredits } from "@/lib/supabase/credits";

/* ── POST /api/payments/mtn/webhook ────────────────────────── */

/**
 * MTN MoMo callback handler.
 * MTN sends a PUT/POST with transaction result when the customer
 * approves or rejects the USSD prompt.
 *
 * NOTE: MTN sandbox callbacks only fire if you registered a
 * providerCallbackHost when creating the API User, and if the
 * callbackUrl is reachable. In sandbox, callbacks are unreliable — 
 * the status polling mechanism is the primary fallback.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("MTN webhook received:", JSON.stringify(body, null, 2));

    // MTN sends the final status in the callback body
    const referenceId = body.referenceId || body.externalId;
    const status = body.status; // SUCCESSFUL | FAILED | REJECTED | TIMEOUT

    if (!referenceId || !status) {
      return NextResponse.json({ error: "Invalid callback data" }, { status: 400 });
    }

    // Use service role to bypass RLS
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

    // Find the pending payment by MTN reference ID (stored in flw_tx_id)
    const { data: payment, error: findError } = await supabase
      .from("payments")
      .select("*")
      .eq("flw_tx_id", referenceId)
      .single();

    if (findError || !payment) {
      // Also try externalId match via flw_ref
      const { data: paymentByRef } = await supabase
        .from("payments")
        .select("*")
        .eq("flw_ref", referenceId)
        .single();

      if (!paymentByRef) {
        console.error("MTN webhook: payment not found for referenceId:", referenceId);
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      return await processPayment(supabase, paymentByRef, status, body);
    }

    return await processPayment(supabase, payment, status, body);
  } catch (error) {
    console.error("MTN webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// Also handle PUT requests (MTN docs say callbacks can be PUT)
export { POST as PUT };

/* ── Process payment result ────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processPayment(supabase: any, payment: any, status: string, body: any) {
  // Prevent double-processing
  if (payment.status === "successful") {
    return NextResponse.json({ status: "already processed" });
  }

  if (status === "SUCCESSFUL") {
    // Verify amount if present in callback
    if (body.amount && Number(payment.amount) !== Number(body.amount)) {
      console.error(
        `MTN webhook: amount mismatch. Expected ${payment.amount}, got ${body.amount}`
      );
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("id", payment.id);
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    // Atomically mark as successful (only if still pending)
    const { data: updated, error: updateError } = await supabase
      .from("payments")
      .update({ status: "successful" })
      .eq("id", payment.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (updateError || !updated) {
      return NextResponse.json({ status: "already processed" });
    }

    // Add credits — retry once on failure
    let creditResult = await addCredits(
      payment.user_id,
      payment.credits_purchased,
      `MTN MoMo: ${payment.credits_purchased} credits (K${payment.amount})`,
      payment.flw_ref
    );

    if (!creditResult.success) {
      // One retry after brief delay
      await new Promise((r) => setTimeout(r, 1000));
      creditResult = await addCredits(
        payment.user_id,
        payment.credits_purchased,
        `MTN MoMo: ${payment.credits_purchased} credits (K${payment.amount})`,
        payment.flw_ref
      );
    }

    if (!creditResult.success) {
      // Revert payment to pending so status polling can retry
      console.error(
        `CRITICAL: addCredits failed for payment ${payment.id} after retry, reverting to pending`
      );
      await supabase
        .from("payments")
        .update({ status: "pending" })
        .eq("id", payment.id);
      return NextResponse.json({ error: "Credit delivery failed, will retry" }, { status: 500 });
    }

    console.log(
      `MTN webhook: +${payment.credits_purchased} credits for user ${payment.user_id.slice(0, 8)}`
    );

    return NextResponse.json({ status: "credits_added" });
  }

  // Failed / Rejected / Timeout
  await supabase
    .from("payments")
    .update({ status: "failed" })
    .eq("id", payment.id)
    .eq("status", "pending");

  console.log(`MTN webhook: payment ${payment.flw_ref} → ${status}`);
  return NextResponse.json({ status: "payment_failed" });
}
