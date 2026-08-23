import Link from "next/link";
import { verifyAdminSession } from "@/lib/auth/verify-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  await verifyAdminSession();
  const supabase = await createSupabaseServerClient();

  const { data: approvals } = await supabase
    .from("approval_requests")
    .select("id, kind, status, case_id, payload, created_at, cases(title)")
    .eq("status", "pending")
    .order("created_at");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-900">承認センター</h1>
      {!approvals || approvals.length === 0 ? (
        <p className="mt-6 text-sm text-ink-500">承認待ちの申請はありません。</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {approvals.map((a) => (
            <li key={a.id}>
              <Link
                href={`/admin/cases/${a.case_id}`}
                className="flex items-center justify-between rounded-2xl border border-black/5 p-4 hover:border-brand-500"
              >
                <span>
                  <span className="font-medium text-ink-900">
                    {(a.cases as unknown as { title: string } | null)?.title ?? a.case_id}
                  </span>
                  <span className="ml-2 text-sm text-ink-500">{a.kind}</span>
                </span>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                  承認待ち
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
