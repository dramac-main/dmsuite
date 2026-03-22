import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CREDIT_PACKS } from "@/data/credit-costs";

/* ── Credit Pack Definitions ───────────────────────────────── */

const PACKS: Record<string, { credits: number; priceZMW: number }> = Object.fromEntries(
  CREDIT_PACKS.map((p) => [p.id, { credits: p.credits, priceZMW: p.priceZMW }])
);

/* ── POST /api/payments/initiate ───────────────────────────── */

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { packId, phoneNumber, provider } = body as {
      packId: string;
      phoneNumber: string;
      provider: string;
    };

    // Validate pack
    const pack = PACKS[packId];
    if (!pack) {
      return NextResponse.json({ error: "Invalid credit pack" }, { status: 400 });
    }

    // Validate phone number (Zambian format)
    const cleanPhone = phoneNumber.replace(/\s/g, "");
    if (!/^\+260\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Invalid Zambian phone number. Use +260XXXXXXXXX format." },
        { status: 400 }
      );
    }

    // Validate provider
    if (!["airtel_money", "mtn_momo"].includes(provider)) {
      return NextResponse.json({ error: "Invalid payment provider" }, { status: 400 });
    }

    const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!FLW_SECRET) {
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 503 }
      );
    }

    // Create a unique transaction reference
    const txRef = `dms-${user.id.slice(0, 8)}-${Date.now()}`;

    // Create pending payment record FIRST (before calling Flutterwave)
    const { error: dbError } = await supabase.from("payments").insert({
      user_id: user.id,
      flw_ref: txRef,
      amount: pack.priceZMW,
      currency: "ZMW",
      credits_purchased: pack.credits,
      payment_method: provider,
      phone_number: cleanPhone,
      status: "pending",
    });

    if (dbError) {
      return NextResponse.json(
        { error: "Could not create payment record" },
        { status: 500 }
      );
    }

    // Initiate Flutterwave mobile money charge
    const flwPayload = {
      tx_ref: txRef,
      amount: pack.priceZMW,
      currency: "ZMW",
      network: provider === "mtn_momo" ? "MTN" : "AIRTEL",
      email: user.email,
      phone_number: cleanPhone,
      fullname: user.user_metadata?.full_name || "DMSuite User",
      order_id: txRef,
      meta: {
        user_id: user.id,
        pack_id: packId,
        credits: pack.credits,
      },
    };

    const flwRes = await fetch(
      "https://api.flutterwave.com/v3/charges?type=mobile_money_zambia",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FLW_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(flwPayload),
      }
    );

    const flwData = await flwRes.json();

    if (flwData.status !== "success") {
      // Update payment as failed
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("flw_ref", txRef);

      return NextResponse.json(
        { error: flwData.message || "Payment initiation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: "pending",
      message: flwData.meta?.authorization?.note || "Check your phone for a PIN prompt",
      paymentRef: txRef,
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
