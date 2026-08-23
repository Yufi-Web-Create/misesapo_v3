import type { Metadata } from "next";

export const metadata: Metadata = { title: "メンテナンス中" };

export default function MaintenancePage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-ink-900">ただいまメンテナンス中です</h1>
      <p className="mt-4 text-ink-700">
        より良いサービスのため、一時的にメンテナンスを行っています。しばらくたってから再度お試しください。
      </p>
    </main>
  );
}
