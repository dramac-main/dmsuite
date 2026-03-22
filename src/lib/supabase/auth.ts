import { createClient } from "./server";

/**
 * Verify the authenticated user from the current session.
 * Returns the user or null if not authenticated.
 * In dev mode (no Supabase configured), returns a mock user to avoid blocking AI routes.
 */
export async function getAuthUser() {
  // Dev mode: if Supabase isn't configured, return a mock user
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { id: "dev-user", email: "dev@dmsuite.app", user_metadata: { full_name: "Dev User" } } as any;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
