# DECISIONS

意思決定の記録。日付・決定内容・理由・代替案を記す。

## 2026-08-23 技術スタック確定

- Next.js 15 (App Router) + React 19 + TypeScript strict。理由: V1で実績があり、開発端末の負荷が低く、Server Actions/Server ComponentsでバックエンドとUIを1アプリに統合できる。
- Supabase (Postgres + Auth + Storage) + RLS必須。理由: 認証・DB・ストレージを個別構築せずに済み、月額コストを抑えられる（無料枠から開始）。
- Tailwind CSS v4。理由: デザインシステムをユーティリティで一貫させやすく、追加ランタイム依存が少ない。
- Zod。境界入力検証（Server Actions/Route Handlersの入力、AI構造化出力の検証）に使用する。
- Vitest + Testing Library（単体・統合）、Playwright（E2E）。
- Biome（lint/format）。
- 依存追加は必要最小限とし、追加理由は本ファイルに記録する。

## 2026-08-23 AIプロバイダー抽象化

- 本番AI APIキーが存在しない前提で開発を進めるため、`lib/ai/gateway.ts` の下に `AiProvider` インターフェースを定義し、既定実装として `MockAiProvider`（決定的・無課金・ネットワーク不要）を使用する。
- 環境変数 `AI_PROVIDER=mock|anthropic|openai` で切り替え可能にする。anthropic/openai実装はアダプターの型を満たすスタブとして用意し、実際のAPIキーが設定されたときのみ有効化する。

## 2026-08-23 決済アダプター

- Stripeを`lib/payments/adapter.ts`のインターフェース越しにのみ扱う。`PAYMENTS_PROVIDER=mock|stripe`。mock実装はローカルで決済状態を模擬し、承認ゲート・監査ログ・状態遷移のテストを可能にする。本番Stripeキー設定時のみ実アダプターへ切替可能とする。

## 2026-08-23 プレビューの信頼境界

- 単一Vercelプロジェクト内で `/preview/[caseId]/[versionId]` ルートを、管理画面・マイページとは別のNext.js Route Groupとして分離し、以下で信頼境界を模擬する。
  - 専用のCSPヘッダ（`connect-src 'none'`など）とレスポンスヘッダ`X-Robots-Tag: noindex`。
  - プレビュー配信APIはSupabase Service Role Keyやセッションクッキーを一切参照しない、読み取り専用の匿名アクセス経路のみを使用する。
  - 埋め込み側（管理画面・マイページ）は`<iframe sandbox="allow-scripts allow-same-origin">`は使わず`allow-scripts`のみを既定にし、生成物の要求に応じて最小権限を追加する。
  - 本番運用時は別サブドメイン（例: `preview.misesapo.example`）へ切り出すことを前提に、プレビュー配信ロジックを`lib/preview/`配下に独立させ、切り出し時の変更範囲を局所化する。この切り出し自体はドメイン取得を伴うため人間対応事項とする。

## 2026-08-23 ジョブ実行方式

- 初期実装は「Server Actionからの同期呼び出し + 冪等キー付きjobs/job_stepsレコード」を採用する。トリガー時に即時実行し、失敗時はjobsレコードを`failed`にして再試行ボタン（管理画面）から再実行できるようにする。将来のワーカー分離（キュー+cron）を阻害しないよう、実行ロジックは`lib/jobs/runner.ts`に独立させ、Route Handler経由の定期実行（Vercel Cron相当）にも差し替え可能な形にする。
