import Link from "next/link";
import { LogoutButton } from "@/app/_components/logout-button";
import { verifyCustomerSession } from "@/lib/auth/verify-session";
import { CASE_STATUS_LABELS } from "@/lib/state-machine/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MyPageDashboard() {
  const session = await verifyCustomerSession();
  const supabase = await createSupabaseServerClient();

  const { data: cases } = await supabase
    .from("cases")
    .select("id, title, status, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">マイページ</h1>
        <LogoutButton />
      </div>
      <p className="mt-2 text-sm text-ink-500">{session.email} としてログイン中</p>

      <Link
        href="/mypage/consult/new"
        className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
      >
        新しく相談する
      </Link>

      <div className="mt-8">
        <h2 className="font-semibold text-ink-900">案件一覧</h2>
        {!cases || cases.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-black/5 p-6 text-sm text-ink-700">
            まだ案件がありません。相談を開始すると、ここに案件が表示されます。
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {cases.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/mypage/cases/${c.id}`}
                  className="flex items-center justify-between rounded-2xl border border-black/5 p-4 hover:border-brand-500"
                >
                  <span className="font-medium text-ink-900">{c.title}</span>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                    {CASE_STATUS_LABELS[c.status as keyof typeof CASE_STATUS_LABELS] ?? c.status}
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
