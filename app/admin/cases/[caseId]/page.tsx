import { notFound } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth/verify-session";
import { CASE_STATUS_LABELS } from "@/lib/state-machine/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminCaseChat } from "./admin-case-chat";
import { ApprovalActions } from "./approval-actions";
import { QuoteForm } from "./quote-form";

export const dynamic = "force-dynamic";

export default async function AdminCaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  await verifyAdminSession();
  const { caseId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: caseRow } = await supabase
    .from("cases")
    .select("id, title, status, store_id, created_at")
    .eq("id", caseId)
    .maybeSingle();

  if (!caseRow) {
    notFound();
  }

  const [{ data: requirement }, { data: quotes }, { data: approvalRequests }, { data: messages }] =
    await Promise.all([
      supabase
        .from("requirements")
        .select("summary")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("quotes")
        .select("id, amount_cents, scope_summary, status")
        .eq("case_id", caseId),
      supabase
        .from("approval_requests")
        .select("id, kind, status, payload")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false }),
      supabase
        .from("conversations")
        .select("id, messages(id, sender_type, body, created_at)")
        .eq("case_id", caseId)
        .eq("channel", "customer")
        .maybeSingle(),
    ]);

  const pendingApproval = (approvalRequests ?? []).find((a) => a.status === "pending");
  const latestQuote = (quotes ?? []).at(-1);
  const customerMessages =
    (
      messages as unknown as {
        messages: Array<{ id: string; sender_type: string; body: string }>;
      } | null
    )?.messages ?? [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-900">{caseRow.title}</h1>
      <p className="mt-1 inline-block rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
        {CASE_STATUS_LABELS[caseRow.status as keyof typeof CASE_STATUS_LABELS] ?? caseRow.status}
      </p>

      {requirement ? (
        <section className="mt-6 rounded-2xl border border-black/5 p-6">
          <h2 className="font-semibold text-ink-900">AIが整理した要件</h2>
          <p className="mt-2 text-sm text-ink-700">{requirement.summary}</p>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-black/5 p-6">
        <h2 className="font-semibold text-ink-900">お客様とのチャット</h2>
        <AdminCaseChat messages={customerMessages} />
      </section>

      <section className="mt-6 rounded-2xl border border-black/5 p-6">
        <h2 className="font-semibold text-ink-900">見積・承認</h2>
        {latestQuote ? (
          <div className="mt-3 text-sm text-ink-700">
            <p>金額: {(latestQuote.amount_cents / 100).toLocaleString()}円</p>
            <p className="mt-1">内容: {latestQuote.scope_summary}</p>
            <p className="mt-1">状態: {latestQuote.status}</p>
          </div>
        ) : caseRow.status === "awaiting_quote_approval" ? (
          <QuoteForm caseId={caseRow.id} />
        ) : (
          <p className="mt-3 text-sm text-ink-500">現在、見積の作成が必要な状態ではありません。</p>
        )}

        {pendingApproval ? (
          <div className="mt-4 rounded-xl bg-brand-50 p-4">
            <p className="text-sm font-medium text-ink-900">承認申請待ち: {pendingApproval.kind}</p>
            <ApprovalActions approvalRequestId={pendingApproval.id} />
          </div>
        ) : null}
      </section>
    </main>
  );
}
