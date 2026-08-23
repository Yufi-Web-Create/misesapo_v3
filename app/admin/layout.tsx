import Link from "next/link";
import { LogoutButton } from "@/app/_components/logout-button";
import { verifyAdminSession } from "@/lib/auth/verify-session";
import { CASE_STATUS_LABELS } from "@/lib/state-machine/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await verifyAdminSession();
  const supabase = await createSupabaseServerClient();

  const { data: cases } = await supabase
    .from("cases")
    .select("id, title, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  const { data: attentionItems } = await supabase
    .from("attention_items")
    .select("case_id")
    .is("resolved_at", null);

  const attentionCaseIds = new Set((attentionItems ?? []).map((a) => a.case_id as string));

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-72 flex-none border-r border-black/5 bg-white md:block">
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-4">
          <Link href="/admin" className="font-bold text-ink-900">
            ミセサポAI 管理
          </Link>
        </div>
        <nav className="border-b border-black/5 px-2 py-2 text-sm">
          <Link href="/admin" className="block rounded-lg px-3 py-2 hover:bg-brand-50">
            ダッシュボード
          </Link>
          <Link href="/admin/approvals" className="block rounded-lg px-3 py-2 hover:bg-brand-50">
            承認センター
          </Link>
        </nav>
        <div className="px-2 py-2">
          <p className="px-3 py-1 text-xs font-semibold text-ink-500">案件一覧</p>
          <ul className="mt-1 space-y-1">
            {(cases ?? []).map((c) => {
              const needsAttention = attentionCaseIds.has(c.id);
              return (
                <li key={c.id}>
                  <Link
                    href={`/admin/cases/${c.id}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-brand-50"
                  >
                    {needsAttention ? (
                      <span
                        role="img"
                        aria-label="対応が必要です"
                        title="対応が必要です"
                        className="h-2 w-2 flex-none rounded-full bg-red-600"
                      />
                    ) : (
                      <span aria-hidden className="h-2 w-2 flex-none rounded-full bg-transparent" />
                    )}
                    <span className="flex-1 truncate">{c.title}</span>
                  </Link>
                  <p className="px-3 pb-1 text-xs text-ink-500">
                    {CASE_STATUS_LABELS[c.status as keyof typeof CASE_STATUS_LABELS] ?? c.status}
                    {needsAttention ? "・要対応" : ""}
                  </p>
                </li>
              );
            })}
            {(cases ?? []).length === 0 ? (
              <li className="px-3 py-2 text-sm text-ink-500">案件はまだありません。</li>
            ) : null}
          </ul>
        </div>
      </aside>
      <div className="flex-1">
        <div className="flex justify-end border-b border-black/5 px-4 py-3 md:hidden">
          <LogoutButton />
        </div>
        {children}
      </div>
    </div>
  );
}
