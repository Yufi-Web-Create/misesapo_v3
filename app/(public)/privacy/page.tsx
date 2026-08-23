import type { Metadata } from "next";
import { PageHero } from "@/app/_components/page-hero";

export const metadata: Metadata = { title: "プライバシーポリシー" };

export default function PrivacyPage() {
  return (
    <main>
      <PageHero eyebrow="ひな型（本番公開前に法務確認が必要）" title="プライバシーポリシー" />
      <section className="mx-auto max-w-3xl space-y-6 px-4 py-14 text-sm text-ink-700 sm:px-6">
        <p className="rounded-lg bg-brand-50 p-4 text-ink-900">
          このページはひな型です。本番公開前に、実際の取得・利用状況に基づいて法務レビューを行ってください。
        </p>
        <div>
          <h2 className="font-semibold text-ink-900">1. 取得する情報</h2>
          <p className="mt-2">
            氏名・連絡先・店舗情報・チャット内容・制作物に関する情報等、本サービスの提供に必要な情報を取得します。
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-ink-900">2. 利用目的</h2>
          <p className="mt-2">
            本サービスの提供、要件整理・制作・品質検査、契約・決済手続き、サポート対応のために利用します。
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-ink-900">3. AIへの情報提供</h2>
          <p className="mt-2">
            制作・検査を担当するAIには、業務に必要な最小限の情報のみを提供し、不要な個人情報は提供しません。
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-ink-900">4. 第三者提供</h2>
          <p className="mt-2">法令に基づく場合を除き、本人の同意なく第三者に提供しません。</p>
        </div>
        <div>
          <h2 className="font-semibold text-ink-900">5. 開示・削除請求</h2>
          <p className="mt-2">マイページから、ご自身の情報のエクスポート・削除を申請できます。</p>
        </div>
      </section>
    </main>
  );
}
