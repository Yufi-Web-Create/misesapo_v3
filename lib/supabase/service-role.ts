import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Bypasses RLS entirely. Server-only (guarded by the `server-only` import, which
 * fails the build if this module is ever imported from client code).
 *
 * Only call this from Server Actions / Route Handlers AFTER an explicit
 * application-level authorization check (verifySession() + role/participant
 * check). This is the sole path for privileged writes: case status transitions,
 * approvals, payments, audit logs, agent runs. See docs/08-security.md.
 */
export function createSupabaseServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set");
  }

  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
