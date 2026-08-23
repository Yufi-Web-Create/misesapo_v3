import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { CASE_TRANSITIONS, CaseTransitionError, transitionCase } from "./case";

type Response = { data: unknown; error: { message: string } | null };

/**
 * Minimal fake Postgrest-style client covering exactly the call shapes
 * transitionCase() makes: select().eq()...single()/maybeSingle(), and
 * insert()/update() which resolve directly (no terminal method) the way the
 * real supabase-js query builder does when awaited without .single().
 */
function createFakeSupabase(responses: Partial<Record<string, Response>>) {
  const inserted: Array<{ table: string; payload: unknown }> = [];
  const updated: Array<{ table: string; payload: unknown }> = [];

  function builder(table: string) {
    let op: "select" | "insert" | "update" = "select";
    const state = {
      select() {
        op = "select";
        return state;
      },
      insert(payload: unknown) {
        op = "insert";
        inserted.push({ table, payload });
        return state;
      },
      update(payload: unknown) {
        op = "update";
        updated.push({ table, payload });
        return state;
      },
      eq() {
        return state;
      },
      order() {
        return state;
      },
      limit() {
        return state;
      },
      async maybeSingle() {
        return responses[`${table}:maybeSingle`] ?? { data: null, error: null };
      },
      async single() {
        return responses[`${table}:single`] ?? { data: null, error: null };
      },
      // biome-ignore lint/suspicious/noThenProperty: must be a real thenable, mimicking supabase-js
      then(resolve: (v: Response) => void) {
        resolve(responses[`${table}:${op}`] ?? { data: null, error: null });
      },
    };
    return state;
  }

  const supabase = { from: (table: string) => builder(table) } as unknown as SupabaseClient;
  return { supabase, inserted, updated };
}

describe("CASE_TRANSITIONS allow-list", () => {
  it("does not allow skipping straight from inquiry_received to delivered", () => {
    expect(CASE_TRANSITIONS.inquiry_received).not.toContain("delivered");
  });

  it("allows the documented happy path from awaiting_client_approval to preparing_production", () => {
    expect(CASE_TRANSITIONS.awaiting_client_approval).toContain("preparing_production");
  });
});

describe("transitionCase", () => {
  it("rejects a transition that is not in the allow-list", async () => {
    const { supabase } = createFakeSupabase({});
    await expect(
      transitionCase({
        supabase,
        caseId: "case-1",
        from: "inquiry_received",
        to: "delivered",
        actorUserId: null,
        reason: "invalid skip",
      }),
    ).rejects.toBeInstanceOf(CaseTransitionError);
  });

  it("refuses a stale transition when the case's current status no longer matches `from`", async () => {
    const { supabase } = createFakeSupabase({
      "cases:single": { data: { status: "gathering_info" }, error: null },
    });
    await expect(
      transitionCase({
        supabase,
        caseId: "case-1",
        from: "inquiry_received",
        to: "gathering_info",
        actorUserId: null,
        reason: "stale",
      }),
    ).rejects.toBeInstanceOf(CaseTransitionError);
  });

  it("applies an allowed transition and logs it", async () => {
    const { supabase, inserted, updated } = createFakeSupabase({
      "cases:single": { data: { status: "inquiry_received" }, error: null },
      "cases:update": { data: null, error: null },
      "case_state_transitions:insert": { data: null, error: null },
    });

    await transitionCase({
      supabase,
      caseId: "case-1",
      from: "inquiry_received",
      to: "gathering_info",
      actorUserId: "user-1",
      reason: "ok",
    });

    expect(updated).toEqual([{ table: "cases", payload: { status: "gathering_info" } }]);
    expect(inserted).toEqual([
      {
        table: "case_state_transitions",
        payload: {
          case_id: "case-1",
          from_status: "inquiry_received",
          to_status: "gathering_info",
          actor_user_id: "user-1",
          reason: "ok",
        },
      },
    ]);
  });

  it("blocks a gated transition (preparing_production) without an approved approval_request", async () => {
    const { supabase } = createFakeSupabase({
      "approval_requests:maybeSingle": { data: null, error: null },
    });

    await expect(
      transitionCase({
        supabase,
        caseId: "case-1",
        from: "awaiting_client_approval",
        to: "preparing_production",
        actorUserId: null,
        reason: "no approval yet",
      }),
    ).rejects.toBeInstanceOf(CaseTransitionError);
  });

  it("allows always-reachable targets like on_hold from any status", async () => {
    const { supabase } = createFakeSupabase({
      "cases:single": { data: { status: "in_production" }, error: null },
      "cases:update": { data: null, error: null },
      "case_state_transitions:insert": { data: null, error: null },
    });

    await expect(
      transitionCase({
        supabase,
        caseId: "case-1",
        from: "in_production",
        to: "on_hold",
        actorUserId: "admin-1",
        reason: "pausing",
      }),
    ).resolves.toBeUndefined();
  });
});
