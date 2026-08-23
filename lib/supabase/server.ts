import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requirePublicSupabaseEnv } from "./env";

/**
 * RLS-checked server client for the currently logged-in user's session.
 * Never use this for privileged writes that must bypass RLS — use
 * createSupabaseServiceRoleClient() for those, and only after an explicit
 * application-level authorization check.
 */
export async function createSupabaseServerClient() {
  const { url, publishableKey } = requirePublicSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render; the middleware/proxy already
          // refreshes the session cookie on navigation, so this is safe to ignore.
        }
      },
    },
  });
}
