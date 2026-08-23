import type { Metadata } from "next";
import { PageHero } from "@/app/_components/page-hero";

export const metadata: Metadata = { title: "利用規約" };

export default function TermsPage() {
  return (
    <main>
      <PageHero eyebrow="ひな型（本番公開前に法務確認が必要）" title="利用規約" />
      <section className="mx-auto max-w-3xl space-y-6 px-4 py-14 text-sm text-ink-700 sm:px-6">
        <p className="rounded-lg bg-brand-50 p-4 text-ink-900">
          このページはひな型です。本番公開前に、事業者情報の確定とあわせて法務レビューを行い、内容を確定してください。
        </p>
        <div>
          <h2 className="font-semibold text-ink-900">第1条（適用）</h2>
          <p className="mt-2">
            本規約は、ミセサポAI（以下「本サービス」）の利用条件を定めるものです。
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-ink-900">第2条（利用登録）</h2>
          <p className="mt-2">
            利用希望者は、本規約に同意のうえ、所定の方法により利用登録を行うものとします。
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-ink-900">第3条（契約の成立）</h2>
          <p className="mt-2">
            本サービスにおける制作契約は、運営者が提示した見積・契約範囲について利用者が承認した時点で成立します。
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-ink-900">第4条（禁止事項）</h2>
          <p className="mt-2">
            法令または公序良俗に違反する行為、本サービスの運営を妨げる行為等を禁止します。
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-ink-900">第5条（免責事項）</h2>
          <p className="mt-2">本サービスの内容は予告なく変更される場合があります。</p>
        </div>
      </section>
    </main>
  );
}
