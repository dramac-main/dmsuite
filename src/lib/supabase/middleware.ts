import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // If Supabase is not configured, allow all requests through (dev mode only)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (process.env.NODE_ENV === "production") {
      console.error("CRITICAL: Supabase not configured in production middleware!");
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — this is critical for keeping the user logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define public routes that don't require authentication
  const publicPaths = ["/auth/login", "/auth/signup", "/auth/reset-password", "/auth/callback", "/auth/verify"];
  const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path));
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  const isApiWebhook = request.nextUrl.pathname.startsWith("/api/payments/webhook");
  const isStaticAsset =
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/favicon") ||
    request.nextUrl.pathname.startsWith("/icon-") ||
    request.nextUrl.pathname.startsWith("/apple-touch") ||
    request.nextUrl.pathname.startsWith("/og-") ||
    request.nextUrl.pathname.startsWith("/manifest") ||
    request.nextUrl.pathname.startsWith("/sw.js") ||
    request.nextUrl.pathname.startsWith("/chiko");

  // Allow public routes, webhooks, API routes, and static assets through
  // API routes handle their own auth via getAuthUser()
  if (isPublicPath || isApiRoute || isApiWebhook || isStaticAsset) {
    return supabaseResponse;
  }

  // Redirect unauthenticated users to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    // Preserve the original destination so we can redirect back after login
    if (request.nextUrl.pathname !== "/") {
      url.searchParams.set("next", request.nextUrl.pathname);
    }
    return NextResponse.redirect(url);
  }

  // If authenticated user visits auth pages, redirect to dashboard
  if (user && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
