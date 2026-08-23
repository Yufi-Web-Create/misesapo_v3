import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/app/_components/page-hero";

export const metadata: Metadata = { title: "利用の流れ" };

const FLOW = [
  { title: "無料相談", body: "会員登録し、AIチャットで今のお悩みや作りたいものを話します。" },
  { title: "AIが要件を整理", body: "会話の内容をAIが整理し、必要なページや機能の案を提示します。" },
  {
    title: "概算費用・納期の提示",
    body: "見積の案を提示します。正式な金額提示は運営者の確認後にお伝えします。",
  },
  {
    title: "無料で試作",
    body: "契約前に、実際に動くページの試作をマイページ上でプレビューできます。",
  },
  { title: "納得してから契約", body: "内容にご納得いただけた場合のみ、契約・お支払いへ進みます。" },
  { title: "制作・確認", body: "マイページのチャットで修正依頼をしながら、完成まで進めます。" },
  { title: "最終確認・納品", body: "最終確認後、運営者の承認を経て納品します。" },
];

export default function FlowPage() {
  return (
    <main>
      <PageHero eyebrow="利用の流れ" title="相談から納品まで、7つのステップ" />
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <ol className="space-y-6">
          {FLOW.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h2 className="font-semibold text-ink-900">{step.title}</h2>
                <p className="mt-1 text-sm text-ink-700">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link
          href="/register"
          className="mt-10 inline-block rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          無料相談を始める
        </Link>
      </section>
    </main>
  );
}
