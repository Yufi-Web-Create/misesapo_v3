import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/terms", label: "利用規約" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/legal", label: "特定商取引法に基づく表記" },
  { href: "/contact", label: "問い合わせ" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-black/5 bg-ink-900 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-sm font-semibold">ミセサポAI</p>
        <p className="mt-2 max-w-xl text-sm text-white/70">
          予約制の小規模店舗向けに、AIとの会話だけで相談・要件整理・制作・確認・納品まで進められる制作・運用支援サービスです。
        </p>
        <nav aria-label="フッターメニュー" className="mt-6 flex flex-wrap gap-4">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-white/70 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="mt-8 text-xs text-white/50">© {new Date().getFullYear()} ミセサポAI</p>
      </div>
    </footer>
  );
}
