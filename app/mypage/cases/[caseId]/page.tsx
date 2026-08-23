import { notFound } from "next/navigation";
import { verifyCustomerSession } from "@/lib/auth/verify-session";
import { CASE_STATUS_LABELS } from "@/lib/state-machine/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CaseChat } from "./case-chat";
import { QuoteResponse } from "./quote-response";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  await verifyCustomerSession();
  const { caseId } = await params;
  const supabase = await createSupabaseServerClient();

  // RLS (private.is_case_participant) returns null if this customer is not a
  // participant of this case — including cases belonging to other customers.
  const { data: caseRow } = await supabase
    .from("cases")
    .select("id, title, status, created_at")
    .eq("id", caseId)
    .maybeSingle();

  if (!caseRow) {
    notFound();
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("case_id", caseId)
    .eq("channel", "customer")
    .maybeSingle();

  const { data: messages } = conversation
    ? await supabase
        .from("messages")
        .select("id, sender_type, body, created_at")
        .eq("conversation_id", conversation.id)
        .order("created_at")
    : { data: [] };

  const { data: requirement } = await supabase
    .from("requirements")
    .select("summary")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: pendingQuote } = await supabase
    .from("quotes")
    .select("id, amount_cents, scope_summary")
    .eq("case_id", caseId)
    .eq("status", "sent")
    .maybeSingle();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-900">{caseRow.title}</h1>
      <p className="mt-1 inline-block rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
        {CASE_STATUS_LABELS[caseRow.status as keyof typeof CASE_STATUS_LABELS] ?? caseRow.status}
      </p>

      {pendingQuote ? (
        <div className="mt-6">
          <QuoteResponse
            quoteId={pendingQuote.id}
            amountCents={pendingQuote.amount_cents}
            scopeSummary={pendingQuote.scope_summary}
          />
        </div>
      ) : null}

      {requirement ? (
        <div className="mt-6 rounded-2xl border border-black/5 p-6">
          <h2 className="font-semibold text-ink-900">AIが整理した要件</h2>
          <p className="mt-2 text-sm text-ink-700">{requirement.summary}</p>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-black/5 p-6">
        <h2 className="font-semibold text-ink-900">AIチャット</h2>
        <CaseChat caseId={caseRow.id} initialMessages={messages ?? []} />
      </div>
    </main>
  );
}
