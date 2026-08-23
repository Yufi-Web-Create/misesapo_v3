import type { Metadata } from "next";
import { PageHero } from "@/app/_components/page-hero";

export const metadata: Metadata = { title: "料金・プラン" };

export default function PricingPage() {
  return (
    <main>
      <PageHero
        eyebrow="料金・プラン"
        title="正式な金額は、無料の試作を確認してからご案内します"
        lead="以下は目安です。実際の金額は、ご相談内容とAIによる要件整理をもとに、運営者が確認したうえで正式にご提示します。"
      />
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { name: "ライト", desc: "1ページ構成のご案内ページ", note: "目安をご案内します" },
            { name: "スタンダード", desc: "複数ページの店舗サイト", note: "目安をご案内します" },
            { name: "リニューアル", desc: "既存サイトの作り直し", note: "目安をご案内します" },
          ].map((plan) => (
            <div key={plan.name} className="rounded-2xl border border-black/5 p-6">
              <h2 className="font-semibold text-ink-900">{plan.name}</h2>
              <p className="mt-2 text-sm text-ink-700">{plan.desc}</p>
              <p className="mt-4 text-sm font-medium text-brand-600">{plan.note}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-2xl bg-brand-50/70 p-6 text-sm text-ink-700">
          <p>
            相談・要件整理・無料の試作確認までは費用はかかりません。契約に進む前に、必ず金額・納期・契約範囲をマイページ上でご確認いただき、ご納得いただいた場合のみお支払いへ進みます。
          </p>
        </div>
      </section>
    </main>
  );
}
