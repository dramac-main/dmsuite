import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback handler — processes email verification, password reset,
 * and OAuth redirects from Supabase.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // For password recovery, redirect to a page where user can set new password
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/verify?type=recovery`);
      }
      // For email verification or OAuth, redirect to dashboard (or next path)
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If code exchange failed or no code, redirect to login with error
  return NextResponse.redirect(
    `${origin}/auth/login?error=Could+not+verify+your+account`
  );
}
