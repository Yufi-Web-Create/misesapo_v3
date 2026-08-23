import type { Metadata } from "next";
import { PageHero } from "@/app/_components/page-hero";

export const metadata: Metadata = { title: "特定商取引法に基づく表記" };

const ROWS = [
  { label: "販売事業者", value: "（事業者情報確定後に記載）" },
  { label: "運営責任者", value: "（事業者情報確定後に記載）" },
  { label: "所在地", value: "（事業者情報確定後に記載。請求があれば遅滞なく開示）" },
  { label: "連絡先", value: "お問い合わせページよりご連絡ください" },
  { label: "販売価格", value: "個別の見積・契約内容によります（料金ページ参照）" },
  { label: "支払方法・時期", value: "契約時にご案内する方法によります" },
  { label: "商品引渡時期", value: "契約時にご案内する納期によります" },
  { label: "返品・キャンセル", value: "契約内容・進行状況に応じて個別にご案内します" },
];

export default function LegalPage() {
  return (
    <main>
      <PageHero
        eyebrow="ひな型（本番公開前に事業者情報の確定が必要）"
        title="特定商取引法に基づく表記"
      />
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="rounded-lg bg-brand-50 p-4 text-sm text-ink-900">
          このページはひな型です。本番公開前に、実際の事業者情報を確定して記載してください。
        </p>
        <dl className="mt-6 divide-y divide-black/5 rounded-2xl border border-black/5">
          {ROWS.map((row) => (
            <div key={row.label} className="grid grid-cols-3 gap-4 px-6 py-4">
              <dt className="text-sm font-medium text-ink-500">{row.label}</dt>
              <dd className="col-span-2 text-sm text-ink-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
