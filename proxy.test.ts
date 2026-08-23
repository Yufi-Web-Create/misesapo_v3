import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getClaims = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getClaims },
  })),
}));

function makeRequest(pathname: string, cookies: Array<{ name: string; value: string }> = []) {
  return {
    nextUrl: { pathname },
    url: `http://localhost:3000${pathname}`,
    cookies: {
      getAll: () => cookies,
      set: vi.fn(),
    },
  } as unknown as NextRequest;
}

describe("proxy", () => {
  beforeEach(() => {
    vi.resetModules();
    getClaims.mockReset();
  });

  it("passes public paths through without checking auth when env is configured", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    getClaims.mockResolvedValue({ data: null, error: { message: "no session" } });

    const { proxy } = await import("./proxy");
    const response = await proxy(makeRequest("/"));
    expect(response.status).toBe(200);
  });

  it("redirects unauthenticated access to /admin", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    getClaims.mockResolvedValue({ data: null, error: { message: "no session" } });

    const { proxy } = await import("./proxy");
    const response = await proxy(makeRequest("/admin"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("redirects unauthenticated access to nested /mypage routes", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    getClaims.mockResolvedValue({ data: null, error: { message: "no session" } });

    const { proxy } = await import("./proxy");
    const response = await proxy(makeRequest("/mypage/cases/123"));
    expect(response.status).toBe(307);
  });

  it("does not treat prefix-only matches (e.g. /administrator) as protected", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    getClaims.mockResolvedValue({ data: null, error: { message: "no session" } });

    const { proxy } = await import("./proxy");
    const response = await proxy(makeRequest("/administrator"));
    expect(response.status).toBe(200);
  });

  it("passes through when authenticated", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } }, error: null });

    const { proxy } = await import("./proxy");
    const response = await proxy(makeRequest("/admin"));
    expect(response.status).toBe(200);
  });

  it("fails closed to /login when getClaims throws", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    getClaims.mockRejectedValue(new Error("network error"));

    const { proxy } = await import("./proxy");
    const response = await proxy(makeRequest("/mypage"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("fails closed to /login for protected paths when Supabase env is not configured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const { proxy } = await import("./proxy");
    const response = await proxy(makeRequest("/admin"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("allows public paths through when Supabase env is not configured (mock mode)", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const { proxy } = await import("./proxy");
    const response = await proxy(makeRequest("/"));
    expect(response.status).toBe(200);
  });
});
