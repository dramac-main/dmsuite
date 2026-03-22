import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* ── GET /api/payments/status?ref=xxx ──────────────────────── */

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

  // Get payment from database (user can only see their own due to RLS)
  const { data: payment, error } = await supabase
    .from("payments")
    .select("status, credits_purchased, amount, currency")
    .eq("flw_ref", ref)
    .eq("user_id", user.id)
    .single();

  if (error || !payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: payment.status,
    credits: payment.credits_purchased,
    amount: payment.amount,
    currency: payment.currency,
  });
}
