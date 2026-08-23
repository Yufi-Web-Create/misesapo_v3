"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifyCustomerSession } from "@/lib/auth/verify-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const respondSchema = z.object({
  quoteId: z.string().uuid(),
  decision: z.enum(["accept", "decline"]),
});

/**
 * Customer's own consent to a quote. This alone does NOT start production —
 * it only records the customer's side. An admin must still separately
 * approve the matching `quote_approval` approval_request (decideApproval in
 * lib/actions/admin-case.ts checks quotes.status === "customer_accepted"
 * before allowing that) before the case can transition into
 * preparing_production. Two independent confirmations, matching the "重要な
 * 判断は運営者が確認します" principle on the public site.
 */
export async function respondToQuote(
  input: z.infer<typeof respondSchema>,
): Promise<ActionResult<{ ok: true }>> {
  await verifyCustomerSession();
  const parsed = respondSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "入力内容を確認してください。" };
  }
  const { quoteId, decision } = parsed.data;

  // RLS proves this customer is a participant of the quote's case.
  const sessionClient = await createSupabaseServerClient();
  const { data: quote } = await sessionClient
    .from("quotes")
    .select("id, case_id, status")
    .eq("id", quoteId)
    .maybeSingle();

  if (!quote) {
    return { ok: false, error: "見積が見つかりません。" };
  }
  if (quote.status !== "sent") {
    return { ok: false, error: "この見積はすでに回答済みです。" };
  }

  const admin = createSupabaseServiceRoleClient();
  const nextStatus = decision === "accept" ? "customer_accepted" : "customer_declined";

  const { error } = await admin
    .from("quotes")
    .update({ status: nextStatus })
    .eq("id", quoteId)
    .eq("status", "sent");

  if (error) {
    return { ok: false, error: "送信に失敗しました。" };
  }

  await admin.from("audit_logs").insert({
    actor_user_id: null,
    action: `quote.${decision}`,
    target_type: "quote",
    target_id: quoteId,
    case_id: quote.case_id,
  });

  revalidatePath(`/mypage/cases/${quote.case_id}`);
  return { ok: true, data: { ok: true } };
}
