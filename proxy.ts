import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// First-layer, fail-closed auth boundary. This is NOT the only check: every
// protected Server Component also calls verifySession() immediately before
// rendering (see lib/auth/verify-session.ts). Neither this file nor a layout
// is trusted as the sole authentication boundary — see docs/08-security.md.
const PROTECTED_PATH_PREFIXES = ["/admin", "/mypage"];
const ADMIN_ONLY_PATH_PREFIXES = ["/admin"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  let authHeaders: Record<string, string> = {};

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    // Mock mode: no Supabase configured yet. Public site + auth-less mock
    // flows still work; protected routes fail closed to /login.
    if (matchesPrefix(request.nextUrl.pathname, PROTECTED_PATH_PREFIXES)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }

        authHeaders = { ...authHeaders, ...headers };

        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  let isAuthenticated = false;
  try {
    const { data, error } = await supabase.auth.getClaims();
    isAuthenticated = !error && Boolean(data?.claims);
  } catch {
    // fail-closed: treat as unauthenticated if getClaims itself throws
    isAuthenticated = false;
  }

  if (!isAuthenticated && matchesPrefix(request.nextUrl.pathname, PROTECTED_PATH_PREFIXES)) {
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    for (const [key, value] of Object.entries(authHeaders)) {
      redirectResponse.headers.set(key, value);
    }
    return redirectResponse;
  }

  // Role check for /admin happens again in verifySession() server-side before
  // render (role is not present in claims here without an extra query, and we
  // do not want to grant that query RLS-bypassing power in the proxy layer).
  void ADMIN_ONLY_PATH_PREFIXES;

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
