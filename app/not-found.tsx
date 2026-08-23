import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-bold text-ink-900">ページが見つかりませんでした</h1>
      <p className="mt-4 text-ink-700">
        お探しのページは移動または削除された可能性があります。URLをご確認いただくか、トップページからお探しください。
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
      >
        トップページへ戻る
      </Link>
    </main>
  );
}
