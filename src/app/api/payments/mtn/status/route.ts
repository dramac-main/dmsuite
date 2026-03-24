import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { addCredits } from "@/lib/supabase/credits";
import { getTransactionStatus, isMtnConfigured } from "@/lib/mtn-momo";

/* ── GET /api/payments/mtn/status?ref=xxx ──────────────────── */

/**
 * Dual-purpose status endpoint:
 * 1. Returns DB payment status to the frontend
 * 2. If still pending, actively polls MTN API for real-time status
 *    and auto-fulfills credits on success (backup for unreliable callbacks)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "Missing ref parameter" }, { status: 400 });
  }

  // Get payment from database
  const { data: payment, error } = await supabase
    .from("payments")
    .select("status, credits_purchased, amount, currency, flw_tx_id, flw_ref, user_id, id")
    .eq("flw_ref", ref)
    .eq("user_id", user.id)
    .single();

  if (error || !payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // If already resolved, return immediately
  if (payment.status !== "pending") {
    return NextResponse.json({
      status: payment.status,
      credits: payment.credits_purchased,
      amount: payment.amount,
      currency: payment.currency,
    });
  }

  // Still pending — actively check MTN API
  if (isMtnConfigured() && payment.flw_tx_id) {
    try {
      const mtnStatus = await getTransactionStatus(payment.flw_tx_id);

      if (mtnStatus.status === "SUCCESSFUL") {
        // Fulfill via service role (bypass RLS)
        const serviceSupabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            cookies: {
              getAll: () => [],
              setAll: () => {},
            },
          }
        );

        // Atomically mark as successful (only if still pending)
        const { data: updated } = await serviceSupabase
          .from("payments")
          .update({ status: "successful" })
          .eq("id", payment.id)
          .eq("status", "pending")
          .select("id")
          .maybeSingle();

        if (updated) {
          const creditResult = await addCredits(
            payment.user_id,
            payment.credits_purchased,
            `MTN MoMo: ${payment.credits_purchased} credits (K${payment.amount})`,
            payment.flw_ref
          );

          if (!creditResult.success) {
            // CRITICAL: Revert payment to "pending" so next poll retries
            console.error(
              `CRITICAL: addCredits failed for payment ${payment.id}, reverting to pending for retry`
            );
            await serviceSupabase
              .from("payments")
              .update({ status: "pending" })
              .eq("id", payment.id);

            // Return pending so client keeps polling
            return NextResponse.json({
              status: "pending",
              credits: payment.credits_purchased,
              amount: payment.amount,
              currency: payment.currency,
            });
          }

          console.log(
            `MTN status poll: +${payment.credits_purchased} credits for user ${payment.user_id.slice(0, 8)}`
          );
        }

        return NextResponse.json({
          status: "successful",
          credits: payment.credits_purchased,
          amount: payment.amount,
          currency: payment.currency,
        });
      }

      if (
        mtnStatus.status === "FAILED" ||
        mtnStatus.status === "REJECTED" ||
        mtnStatus.status === "TIMEOUT"
      ) {
        const serviceSupabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            cookies: {
              getAll: () => [],
              setAll: () => {},
            },
          }
        );

        await serviceSupabase
          .from("payments")
          .update({ status: "failed" })
          .eq("id", payment.id)
          .eq("status", "pending");

        return NextResponse.json({
          status: "failed",
          credits: payment.credits_purchased,
          amount: payment.amount,
          currency: payment.currency,
        });
      }

      // PENDING / ONGOING — keep polling
    } catch (err) {
      console.error("MTN status poll error:", err);
      // Don't fail the request — just return DB status
    }
  }

  return NextResponse.json({
    status: payment.status,
    credits: payment.credits_purchased,
    amount: payment.amount,
    currency: payment.currency,
  });
}
