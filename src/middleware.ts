import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Public assets in /public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|icon-|apple-touch|og-|manifest.json|sw.js|chiko/).*)",
  ],
};
