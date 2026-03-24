import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/supabase/admin";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * GET /api/admin/users?q=search&page=1
 * Search users by email, name, or phone. Returns profiles + credit balance.
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

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("profiles")
    .select("id, full_name, phone, credits, plan, is_admin, created_at, updated_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    // Search by name or phone (email requires auth.users join — we'll do that separately)
    query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data: profiles, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If searching, also try to match by email via auth.users
  let emailMatches: string[] = [];
  if (q && q.includes("@")) {
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 50 });
    if (authData?.users) {
      emailMatches = authData.users
        .filter((u) => u.email?.toLowerCase().includes(q.toLowerCase()))
        .map((u) => u.id);
    }
  }

  // Enrich profiles with email from auth.users
  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map<string, string>();
  authUsers?.users?.forEach((u) => {
    if (u.email) emailMap.set(u.id, u.email);
  });

  const enriched = (profiles ?? []).map((p) => ({
    ...p,
    email: emailMap.get(p.id) ?? null,
  }));

  // If we found email matches not already in profiles, merge them
  if (emailMatches.length > 0) {
    const existingIds = new Set(enriched.map((p) => p.id));
    const missing = emailMatches.filter((id) => !existingIds.has(id));
    if (missing.length > 0) {
      const { data: extraProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone, credits, plan, is_admin, created_at, updated_at")
        .in("id", missing);
      extraProfiles?.forEach((p) => {
        enriched.push({ ...p, email: emailMap.get(p.id) ?? null });
      });
    }
  }

  return NextResponse.json({
    users: enriched,
    total: (count ?? 0) + (emailMatches.length > 0 ? emailMatches.length : 0),
    page,
    limit,
  });
}
