import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <p className="text-sm font-semibold text-brand-600">
          相談 → ご提案 → 無料で形に → 納得してから契約
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
          まずは、形に。
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-ink-700 sm:text-lg">
          Webやパソコンに詳しくなくても大丈夫です。AIとのチャットで相談するだけで、
          お店のホームページやチラシ代わりのページが、まずは無料で形になります。
          気に入っていただけたときだけ、契約に進めます。
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/register"
            className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            無料で相談してみる
          </Link>
          <Link
            href="/flow"
            className="rounded-full border border-ink-900/10 px-6 py-3 text-sm font-semibold text-ink-900 hover:border-brand-600 hover:text-brand-600"
          >
            利用の流れを見る
          </Link>
        </div>
      </section>

      <section className="border-t border-black/5 bg-brand-50/60 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-ink-900">
            ミセサポAIが大切にしていること
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "AI利用を隠しません",
                body: "文章や画像の制作にAIを使っていることを、あらかじめお伝えします。",
              },
              {
                title: "根拠のない実績は載せません",
                body: "確認できない顧客数・満足度・成果保証は掲載しません。",
              },
              {
                title: "重要な判断は人が確認します",
                body: "金額の確定、契約、公開、納品は必ず運営者が確認してから進めます。",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-ink-900">{item.title}</h3>
                <p className="mt-2 text-sm text-ink-700">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-ink-900">相談だけなら、いつでも無料です</h2>
          <p className="mt-4 text-ink-700">
            「何を作ればいいか分からない」という状態からで構いません。まずはAIに、いまのお悩みをそのまま話しかけてみてください。
          </p>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            無料相談を始める
          </Link>
        </div>
      </section>
    </main>
  );
}
