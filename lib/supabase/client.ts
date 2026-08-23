import { createBrowserClient } from "@supabase/ssr";
import { requirePublicSupabaseEnv } from "./env";

export function createSupabaseBrowserClient() {
  const { url, publishableKey } = requirePublicSupabaseEnv();
  return createBrowserClient(url, publishableKey);
}
