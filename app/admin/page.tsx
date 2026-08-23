import { LogoutButton } from "@/app/_components/logout-button";
import { verifyAdminSession } from "@/lib/auth/verify-session";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await verifyAdminSession();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">管制ダッシュボード</h1>
        <LogoutButton />
      </div>
      <p className="mt-2 text-sm text-ink-500">{session.email} としてログイン中（管理者）</p>
      <div className="mt-8 rounded-2xl border border-black/5 p-6 text-sm text-ink-700">
        対応が必要な案件はありません。
      </div>
    </main>
  );
}
