import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-50/40">
      <header className="px-4 py-6 sm:px-6">
        <Link href="/" className="text-lg font-bold text-ink-900">
          ミセサポAI
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">{children}</main>
    </div>
  );
}
