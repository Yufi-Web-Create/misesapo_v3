import Link from "next/link";

const NAV_LINKS = [
  { href: "/service", label: "サービス" },
  { href: "/flow", label: "利用の流れ" },
  { href: "/works", label: "制作できるもの" },
  { href: "/pricing", label: "料金" },
  { href: "/faq", label: "FAQ" },
  { href: "/company", label: "運営者情報" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-bold text-ink-900">
          ミセサポAI
        </Link>
        <nav aria-label="主要メニュー" className="hidden gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-ink-700 hover:text-brand-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden text-sm text-ink-700 hover:text-brand-600 sm:inline"
          >
            ログイン
          </Link>
          <Link
            href="/contact"
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            無料相談
          </Link>
        </div>
      </div>
    </header>
  );
}
