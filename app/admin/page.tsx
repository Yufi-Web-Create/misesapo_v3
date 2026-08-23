import Link from "next/link";
import { LogoutButton } from "@/app/_components/logout-button";
import { verifyAdminSession } from "@/lib/auth/verify-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await verifyAdminSession();
  const supabase = await createSupabaseServerClient();

  const { data: attentionItems } = await supabase
    .from("attention_items")
    .select("id, case_id, reason, detail, cases(title)")
    .is("resolved_at", null)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">管制ダッシュボード</h1>
        <LogoutButton />
      </div>
      <p className="mt-2 text-sm text-ink-500">{session.email} としてログイン中（管理者）</p>

      <div className="mt-8">
        <h2 className="font-semibold text-ink-900">対応が必要な案件</h2>
        {!attentionItems || attentionItems.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-black/5 p-6 text-sm text-ink-700">
            対応が必要な案件はありません。
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {attentionItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/admin/cases/${item.case_id}`}
                  className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 p-4 hover:border-red-300"
                >
                  <span aria-hidden className="h-2 w-2 flex-none rounded-full bg-red-600" />
                  <span>
                    <span className="font-medium text-ink-900">
                      {(item.cases as unknown as { title: string } | null)?.title ?? item.case_id}
                    </span>
                    <span className="ml-2 text-sm text-ink-700">{item.detail ?? item.reason}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
