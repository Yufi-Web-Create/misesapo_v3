"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AiGateway } from "@/lib/ai/gateway";
import { verifyCustomerSession } from "@/lib/auth/verify-session";
import { runJob } from "@/lib/jobs/runner";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const startConsultationSchema = z.object({
  storeId: z.string().uuid(),
  message: z.string().trim().min(1).max(4000),
});

/**
 * Starts a new consultation: creates the case immediately (so every AI
 * Gateway call always has a real case_id — see lib/ai/types.ts), records the
 * customer's first message, gets an AI reply, and — once the AI signals it
 * has enough context — synchronously runs the requirement-structuring step
 * and parks the case at `awaiting_quote_approval` for an admin to act on.
 */
export async function startConsultation(
  input: z.infer<typeof startConsultationSchema>,
): Promise<ActionResult<{ caseId: string }>> {
  const session = await verifyCustomerSession();
  const parsed = startConsultationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "入力内容を確認してください。" };
  }
  const { storeId, message } = parsed.data;

  // Authorization: RLS on `stores`/`memberships` only returns rows the
  // logged-in user can see, so a non-empty result here proves membership.
  const sessionClient = await createSupabaseServerClient();
  const { data: store } = await sessionClient
    .from("stores")
    .select("id, organization_id")
    .eq("id", storeId)
    .maybeSingle();

  if (!store) {
    return { ok: false, error: "この店舗への相談権限がありません。" };
  }

  const admin = createSupabaseServiceRoleClient();

  const { data: newCase, error: caseError } = await admin
    .from("cases")
    .insert({
      organization_id: store.organization_id,
      store_id: storeId,
      title: message.slice(0, 40),
      status: "inquiry_received",
    })
    .select("id")
    .single();

  if (caseError || !newCase) {
    return { ok: false, error: "案件の作成に失敗しました。時間をおいて再度お試しください。" };
  }
  const caseId = newCase.id as string;

  await admin.from("case_state_transitions").insert({
    case_id: caseId,
    from_status: null,
    to_status: "inquiry_received",
    actor_user_id: session.userId,
    reason: "新規相談の開始",
  });

  const { data: conversation, error: conversationError } = await admin
    .from("conversations")
    .insert({ case_id: caseId, channel: "customer" })
    .select("id")
    .single();

  if (conversationError || !conversation) {
    return { ok: false, error: "会話の作成に失敗しました。" };
  }

  await admin.from("messages").insert({
    conversation_id: conversation.id,
    case_id: caseId,
    sender_type: "customer",
    sender_user_id: session.userId,
    body: message,
  });

  const gateway = new AiGateway(admin);
  const converseResult = await gateway.converse({
    caseId,
    history: [{ role: "customer", content: message }],
  });

  await admin.from("messages").insert({
    conversation_id: conversation.id,
    case_id: caseId,
    sender_type: "ai",
    body: converseResult.reply,
  });

  await admin
    .from("cases")
    .update({ status: "gathering_info" })
    .eq("id", caseId)
    .eq("status", "inquiry_received");
  await admin.from("case_state_transitions").insert({
    case_id: caseId,
    from_status: "inquiry_received",
    to_status: "gathering_info",
    actor_user_id: null,
    reason: "AIによる初回応答",
  });

  if (converseResult.shouldCreateCase) {
    await structureCaseRequirements(admin, gateway, caseId, [
      { role: "customer", content: message },
    ]);
  }

  revalidatePath("/mypage");
  return { ok: true, data: { caseId } };
}

async function structureCaseRequirements(
  admin: ReturnType<typeof createSupabaseServiceRoleClient>,
  gateway: AiGateway,
  caseId: string,
  history: Array<{ role: string; content: string }>,
) {
  await runJob({
    supabase: admin,
    caseId,
    kind: "structure_requirements",
    idempotencyKey: `structure:${caseId}`,
    execute: async () => {
      const structureResult = await gateway.structure({ caseId, history });

      await admin.from("requirements").insert({
        case_id: caseId,
        summary: structureResult.summary,
        structured: structureResult.structured,
      });

      await admin
        .from("cases")
        .update({ status: "structuring_requirements" })
        .eq("id", caseId)
        .eq("status", "gathering_info");
      await admin.from("case_state_transitions").insert({
        case_id: caseId,
        from_status: "gathering_info",
        to_status: "structuring_requirements",
        actor_user_id: null,
        reason: "AIによる要件構造化",
      });

      await admin
        .from("cases")
        .update({ status: "awaiting_quote_approval" })
        .eq("id", caseId)
        .eq("status", "structuring_requirements");
      await admin.from("case_state_transitions").insert({
        case_id: caseId,
        from_status: "structuring_requirements",
        to_status: "awaiting_quote_approval",
        actor_user_id: null,
        reason: "要件整理が完了し、見積作成待ちへ移行",
      });

      await admin.from("attention_items").insert({
        case_id: caseId,
        reason: "pending_money_decision",
        detail: "要件整理が完了しました。見積の作成・承認が必要です。",
      });
    },
  });
}

const sendMessageSchema = z.object({
  caseId: z.string().uuid(),
  message: z.string().trim().min(1).max(4000),
});

/** Customer sends a follow-up message in an existing case's customer channel. */
export async function sendCustomerMessage(
  input: z.infer<typeof sendMessageSchema>,
): Promise<ActionResult<{ messageId: string }>> {
  await verifyCustomerSession();
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "入力内容を確認してください。" };
  }
  const { caseId, message } = parsed.data;

  const sessionClient = await createSupabaseServerClient();
  const { data: session } = await sessionClient.auth.getClaims();
  const userId = session?.claims?.sub as string | undefined;
  if (!userId) {
    return { ok: false, error: "ログインし直してください。" };
  }

  // RLS proves case participancy: this select only returns a row if the
  // logged-in customer is a participant of `caseId`.
  const { data: conversation } = await sessionClient
    .from("conversations")
    .select("id")
    .eq("case_id", caseId)
    .eq("channel", "customer")
    .maybeSingle();

  if (!conversation) {
    return { ok: false, error: "この案件への投稿権限がありません。" };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: inserted, error } = await admin
    .from("messages")
    .insert({
      conversation_id: conversation.id,
      case_id: caseId,
      sender_type: "customer",
      sender_user_id: userId,
      body: message,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false, error: "送信に失敗しました。" };
  }

  await admin.from("attention_items").insert({
    case_id: caseId,
    reason: "unread_customer_message",
    detail: "顧客から新しいメッセージが届いています。",
  });

  revalidatePath(`/mypage/cases/${caseId}`);
  return { ok: true, data: { messageId: inserted.id } };
}
