import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/supabase/admin";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * GET /api/admin/payments?status=pending&userId=xxx&page=1
 * List all payments with optional filters.
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const status = request.nextUrl.searchParams.get("status");
  const userId = request.nextUrl.searchParams.get("userId");
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10));
  const limit = 30;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("payments")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (userId) query = query.eq("user_id", userId);

  const { data: payments, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with user names
  const userIds = [...new Set((payments ?? []).map((p) => p.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const nameMap = new Map<string, string>();
  profiles?.forEach((p) => nameMap.set(p.id, p.full_name));

  const enriched = (payments ?? []).map((p) => ({
    ...p,
    user_name: nameMap.get(p.user_id) ?? "Unknown",
  }));

  return NextResponse.json({
    payments: enriched,
    total: count ?? 0,
    page,
    limit,
  });
}
