"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body>
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-2xl font-bold text-ink-900">エラーが発生しました</h1>
          <p className="mt-4 text-ink-700">
            予期しない問題が発生しました。お手数ですが、もう一度お試しください。
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            もう一度試す
          </button>
        </main>
      </body>
    </html>
  );
}
