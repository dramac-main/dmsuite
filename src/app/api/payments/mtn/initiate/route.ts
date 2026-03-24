import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CREDIT_PACKS } from "@/data/credit-costs";
import { requestToPay, isMtnConfigured } from "@/lib/mtn-momo";
import { randomUUID } from "crypto";

/* ── Credit Pack Definitions ───────────────────────────────── */

const PACKS: Record<string, { credits: number; priceZMW: number }> =
  Object.fromEntries(
    CREDIT_PACKS.map((p) => [p.id, { credits: p.credits, priceZMW: p.priceZMW }])
  );

/* ── POST /api/payments/mtn/initiate ───────────────────────── */

export async function POST(request: Request) {
  try {
    if (!isMtnConfigured()) {
      return NextResponse.json(
        { error: "MTN MoMo payments not configured" },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { packId, phoneNumber } = body as {
      packId: string;
      phoneNumber: string;
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

    // Convert +260971234567 → 260971234567 (MTN wants no + prefix)
    const msisdn = cleanPhone.replace("+", "");

    // Generate unique IDs
    const referenceId = randomUUID();
    const txRef = `mtn-${user.id.slice(0, 8)}-${Date.now()}`;

    // Create pending payment record FIRST
    const { error: dbError } = await supabase.from("payments").insert({
      user_id: user.id,
      flw_ref: txRef,
      flw_tx_id: referenceId, // Store MTN reference ID for status checks
      amount: pack.priceZMW,
      currency: "ZMW",
      credits_purchased: pack.credits,
      payment_method: "mtn_momo",
      phone_number: cleanPhone,
      status: "pending",
    });

    if (dbError) {
      console.error("MTN initiate: DB insert error:", dbError);
      return NextResponse.json(
        { error: "Could not create payment record" },
        { status: 500 }
      );
    }

    // Call MTN MoMo Request to Pay
    const result = await requestToPay({
      referenceId,
      amount: String(pack.priceZMW),
      msisdn,
      externalId: txRef,
      payerMessage: `DMSuite ${pack.credits} credits`,
      payeeNote: `Credit purchase: ${pack.credits} credits by ${user.id.slice(0, 8)}`,
    });

    if (!result.success) {
      // Mark payment as failed
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("flw_ref", txRef);

      return NextResponse.json(
        { error: result.error || "Payment initiation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: "pending",
      message: "Check your phone for PIN prompt",
      paymentRef: txRef,
      mtnReferenceId: referenceId,
    });
  } catch (error) {
    console.error("MTN payment initiation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
