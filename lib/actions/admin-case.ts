"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifyAdminSession } from "@/lib/auth/verify-session";
import { transitionCase } from "@/lib/state-machine/case";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const createQuoteSchema = z.object({
  caseId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  scopeSummary: z.string().trim().min(1).max(2000),
});

/**
 * Admin drafts and sends a quote. This does NOT confirm a price by itself —
 * it moves the case to awaiting_client_approval so the customer can respond,
 * and opens a `quote_approval` approval_request that only an admin can later
 * decide (decideApproval below). The state-machine gate on
 * `preparing_production` will refuse to let the case proceed until that
 * approval_request is APPROVED — see lib/state-machine/case.ts.
 */
export async function createAndSendQuote(
  input: z.infer<typeof createQuoteSchema>,
): Promise<ActionResult<{ quoteId: string }>> {
  const session = await verifyAdminSession();
  const parsed = createQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "入力内容を確認してください。" };
  }
  const { caseId, amountCents, scopeSummary } = parsed.data;

  const admin = createSupabaseServiceRoleClient();

  const { data: caseRow } = await admin
    .from("cases")
    .select("status")
    .eq("id", caseId)
    .maybeSingle();
  if (!caseRow) {
    return { ok: false, error: "案件が見つかりません。" };
  }
  if (caseRow.status !== "awaiting_quote_approval") {
    return { ok: false, error: "この案件は現在、見積を送付できる状態ではありません。" };
  }

  const { data: quote, error: quoteError } = await admin
    .from("quotes")
    .insert({
      case_id: caseId,
      amount_cents: amountCents,
      scope_summary: scopeSummary,
      status: "sent",
    })
    .select("id")
    .single();

  if (quoteError || !quote) {
    return { ok: false, error: "見積の作成に失敗しました。" };
  }

  const { data: approval, error: approvalError } = await admin
    .from("approval_requests")
    .insert({
      case_id: caseId,
      kind: "quote_approval",
      target_type: "quote",
      target_id: quote.id,
      payload: { amountCents, scopeSummary },
      status: "pending",
      requested_by: "admin",
    })
    .select("id")
    .single();

  if (approvalError || !approval) {
    return { ok: false, error: "承認申請の作成に失敗しました。" };
  }

  await transitionCase({
    supabase: admin,
    caseId,
    from: "awaiting_quote_approval",
    to: "awaiting_client_approval",
    actorUserId: session.userId,
    reason: "見積を送付し、お客様の確認待ちへ移行",
  });

  await admin.from("audit_logs").insert({
    actor_user_id: session.userId,
    action: "quote.sent",
    target_type: "quote",
    target_id: quote.id,
    case_id: caseId,
    after: { amountCents, scopeSummary },
  });

  revalidatePath(`/admin/cases/${caseId}`);
  return { ok: true, data: { quoteId: quote.id } };
}

const decideApprovalSchema = z.object({
  approvalRequestId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().trim().max(2000).optional(),
});

/**
 * The only path by which an approval_request can be resolved. Approving a
 * `quote_approval` request additionally advances the case past its gate
 * (awaiting_client_approval -> preparing_production) — this is the human
 * confirmation required before money/scope is finalized (docs/08-security.md).
 */
export async function decideApproval(
  input: z.infer<typeof decideApprovalSchema>,
): Promise<ActionResult<{ ok: true }>> {
  const session = await verifyAdminSession();
  const parsed = decideApprovalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "入力内容を確認してください。" };
  }
  const { approvalRequestId, decision, reason } = parsed.data;

  const admin = createSupabaseServiceRoleClient();

  const { data: approvalRequest } = await admin
    .from("approval_requests")
    .select("id, case_id, kind, status, target_id")
    .eq("id", approvalRequestId)
    .maybeSingle();

  if (!approvalRequest) {
    return { ok: false, error: "承認申請が見つかりません。" };
  }
  if (approvalRequest.status !== "pending") {
    return { ok: false, error: "この承認申請はすでに処理済みです。" };
  }

  if (
    decision === "approved" &&
    approvalRequest.kind === "quote_approval" &&
    approvalRequest.target_id
  ) {
    const { data: quote } = await admin
      .from("quotes")
      .select("status")
      .eq("id", approvalRequest.target_id)
      .maybeSingle();
    if (quote?.status !== "customer_accepted") {
      return {
        ok: false,
        error: "お客様がまだ見積を承諾していません。先にお客様の回答をお待ちください。",
      };
    }
  }

  const { error: updateError } = await admin
    .from("approval_requests")
    .update({ status: decision })
    .eq("id", approvalRequestId)
    .eq("status", "pending");
  if (updateError) {
    return { ok: false, error: "承認処理に失敗しました。" };
  }

  await admin.from("approval_decisions").insert({
    approval_request_id: approvalRequestId,
    decision,
    decided_by_user_id: session.userId,
    reason: reason ?? null,
  });

  await admin.from("audit_logs").insert({
    actor_user_id: session.userId,
    action: `approval.${decision}`,
    target_type: "approval_request",
    target_id: approvalRequestId,
    case_id: approvalRequest.case_id,
    reason,
  });

  await admin
    .from("attention_items")
    .update({ resolved_at: new Date().toISOString() })
    .eq("case_id", approvalRequest.case_id)
    .eq("reason", "pending_money_decision")
    .is("resolved_at", null);

  if (decision === "approved" && approvalRequest.kind === "quote_approval") {
    if (approvalRequest.target_id) {
      await admin.from("quotes").update({ status: "approved" }).eq("id", approvalRequest.target_id);
    }
    await transitionCase({
      supabase: admin,
      caseId: approvalRequest.case_id,
      from: "awaiting_client_approval",
      to: "preparing_production",
      actorUserId: session.userId,
      reason: "見積承認により制作準備へ移行",
    });
  }

  revalidatePath("/admin/approvals");
  revalidatePath(`/admin/cases/${approvalRequest.case_id}`);
  return { ok: true, data: { ok: true } };
}
