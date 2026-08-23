import type { Metadata } from "next";
import { PageHero } from "@/app/_components/page-hero";

export const metadata: Metadata = { title: "制作できるもの" };

const CATEGORIES = [
  {
    name: "飲食店",
    items: ["店舗紹介ページ", "メニュー紹介", "アクセス・営業時間の案内", "予約ページへの導線"],
  },
  {
    name: "美容・サロン",
    items: [
      "メニュー・料金の比較表",
      "スタイル・施術例の紹介",
      "予約ページへの導線",
      "スタッフ紹介",
    ],
  },
  {
    name: "小規模サービス業",
    items: ["サービス紹介ページ", "料金プランの案内", "よくある質問(FAQ)", "問い合わせ導線"],
  },
  {
    name: "教室・スクール",
    items: ["開催スケジュール(月表示カレンダー)", "コース紹介", "講師紹介", "体験申し込み導線"],
  },
];

export default function WorksPage() {
  return (
    <main>
      <PageHero
        eyebrow="制作できるもの"
        title="業種別の制作テンプレートをご用意しています"
        lead="いずれも共通のデータ形式で管理しており、店舗ごとの内容に合わせてAIが調整します。"
      />
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {CATEGORIES.map((category) => (
            <div key={category.name} className="rounded-2xl border border-black/5 p-6">
              <h2 className="font-semibold text-ink-900">{category.name}</h2>
              <ul className="mt-3 space-y-1 text-sm text-ink-700">
                {category.items.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-ink-500">
          上記以外の業種・ご要望についても、まずは無料相談でお聞かせください。
        </p>
      </section>
    </main>
  );
}
