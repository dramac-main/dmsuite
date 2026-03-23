import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";

export async function POST() {
  // 1. Get the authenticated user from session cookies
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Use service role to delete the user (cascades to profiles, transactions, payments via FK)
  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to delete account. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
