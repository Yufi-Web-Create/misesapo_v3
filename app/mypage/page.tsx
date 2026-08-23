import { LogoutButton } from "@/app/_components/logout-button";
import { verifyCustomerSession } from "@/lib/auth/verify-session";

export const dynamic = "force-dynamic";

export default async function MyPageDashboard() {
  const session = await verifyCustomerSession();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">マイページ</h1>
        <LogoutButton />
      </div>
      <p className="mt-2 text-sm text-ink-500">{session.email} としてログイン中</p>
      <div className="mt-8 rounded-2xl border border-black/5 p-6 text-sm text-ink-700">
        まだ案件がありません。相談を開始すると、ここに案件が表示されます。
      </div>
    </main>
  );
}
