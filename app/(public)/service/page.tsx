import type { Metadata } from "next";
import { PageHero } from "@/app/_components/page-hero";

export const metadata: Metadata = { title: "サービス説明" };

const STEPS = [
  {
    title: "司令塔AIが相談を整理",
    body: "チャットでのやり取りを、司令塔AIが要件として整理します。専門用語を使う必要はありません。",
  },
  {
    title: "専門AIチームが分担して制作",
    body: "文章・画像・Web制作を担当するAIがそれぞれの持ち場を担当し、検査AIが独立して品質を確認します。",
  },
  {
    title: "運営者が承認してから進行",
    body: "金額の確定や公開など、重要な判断は必ず運営者(人間)が確認したうえで進めます。",
  },
];

export default function ServicePage() {
  return (
    <main>
      <PageHero
        eyebrow="サービス説明"
        title="AIとの会話だけで、お店の情報発信を形にします"
        lead="Web担当者がいない予約制の小規模店舗のために、相談から制作・確認・納品までをAIチームと一緒に進められるサービスです。"
      />
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="rounded-2xl border border-black/5 p-6">
              <p className="text-sm font-semibold text-brand-600">STEP {i + 1}</p>
              <h2 className="mt-2 font-semibold text-ink-900">{step.title}</h2>
              <p className="mt-2 text-sm text-ink-700">{step.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-2xl bg-ink-900 p-8 text-white">
          <h2 className="text-xl font-bold">既存の予約システムはそのまま使えます</h2>
          <p className="mt-3 text-white/80">
            独自の予約システムを新しく作るのではなく、すでにお使いの予約ページへ安全につなぐ形でご案内します。
          </p>
        </div>
      </section>
    </main>
  );
}
