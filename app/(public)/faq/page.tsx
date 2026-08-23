import type { Metadata } from "next";
import { PageHero } from "@/app/_components/page-hero";

export const metadata: Metadata = { title: "FAQ" };

const FAQS = [
  {
    q: "パソコンやWebに詳しくなくても利用できますか。",
    a: "はい。チャットで普段の言葉で相談していただければ、AIが要件を整理します。専門知識は必要ありません。",
  },
  {
    q: "費用はいつ発生しますか。",
    a: "相談・要件整理・無料の試作確認までは費用はかかりません。正式な金額提示にご納得いただき、契約に進んだ場合のみ費用が発生します。",
  },
  {
    q: "AIが作った文章や画像だと分かりますか。",
    a: "はい。AIを利用して制作していることを隠さずお伝えします。",
  },
  {
    q: "今使っている予約システムはそのまま使えますか。",
    a: "はい。独自の予約システムを新しく作るのではなく、既存の予約ページへ安全につなぐ形でご案内します。",
  },
  {
    q: "途中で内容を変更したくなったらどうすればいいですか。",
    a: "マイページのチャットでいつでも修正を依頼できます。契約範囲を超える大きな変更の場合は、追加のご案内をしてから進めます。",
  },
];

export default function FaqPage() {
  return (
    <main>
      <PageHero eyebrow="FAQ" title="よくあるご質問" />
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <dl className="space-y-8">
          {FAQS.map((item) => (
            <div key={item.q}>
              <dt className="font-semibold text-ink-900">Q. {item.q}</dt>
              <dd className="mt-2 text-sm text-ink-700">A. {item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
