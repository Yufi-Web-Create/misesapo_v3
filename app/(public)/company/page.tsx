import type { Metadata } from "next";
import { PageHero } from "@/app/_components/page-hero";

export const metadata: Metadata = { title: "運営者・サービス情報" };

const INFO = [
  { label: "サービス名", value: "ミセサポAI" },
  { label: "提供内容", value: "予約制小規模店舗向けAI制作・運用支援サービス" },
  { label: "対応地域", value: "日本国内" },
  { label: "お問い合わせ", value: "お問い合わせページよりご連絡ください" },
];

export default function CompanyPage() {
  return (
    <main>
      <PageHero eyebrow="運営者・サービス情報" title="ミセサポAIについて" />
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <dl className="divide-y divide-black/5 rounded-2xl border border-black/5">
          {INFO.map((row) => (
            <div key={row.label} className="grid grid-cols-3 gap-4 px-6 py-4">
              <dt className="text-sm font-medium text-ink-500">{row.label}</dt>
              <dd className="col-span-2 text-sm text-ink-900">{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-xs text-ink-500">
          運営会社の詳細情報（商号・所在地・代表者等）は、事業者情報の確定後に特定商取引法に基づく表記とあわせて掲載します。
        </p>
      </section>
    </main>
  );
}
