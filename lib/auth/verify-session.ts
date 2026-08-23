import { redirect } from "next/navigation";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type VerifiedSession = {
  userId: string;
  email: string;
  role: "customer" | "admin";
};

/**
 * Second, mandatory auth boundary. Called directly at the top of every
 * protected Server Component (never relying on a shared layout alone — a
 * layout is not guaranteed to re-run its checks the same way a page does on
 * every navigation path in Next.js). Fail-closed: any error or missing
 * profile redirects to /login rather than rendering. Also fails closed (with
 * a redirect, not a 500) when Supabase is not configured at all, so the app
 * still builds and runs in mock mode without secrets.
 */
export async function verifySession(): Promise<VerifiedSession> {
  if (!getPublicSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/login");
  }

  const userId = data.claims.sub as string;

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id, email, role")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  return { userId: profile.id, email: profile.email, role: profile.role };
}

/** Same as verifySession(), but also requires role === "admin". */
export async function verifyAdminSession(): Promise<VerifiedSession> {
  const session = await verifySession();
  if (session.role !== "admin") {
    redirect("/mypage");
  }
  return session;
}

/** Same as verifySession(), but also requires role === "customer". */
export async function verifyCustomerSession(): Promise<VerifiedSession> {
  const session = await verifySession();
  if (session.role !== "customer") {
    redirect("/admin");
  }
  return session;
}
