# 02. アーキテクチャ

## 全体構成

- Next.js 15（App Router）単一アプリ。ルートグループで公開サイト/`mypage`/`admin`/`preview`を分離する。
- Supabase（Postgres + Auth + Storage）。RLS必須。
- AI Gateway（`lib/ai/`）: converse/structure/plan/produce/review/escalateの6能力。プロバイダーアダプター越しにのみ外部LLMへアクセス。
- ジョブ基盤（`lib/jobs/`）: `jobs`/`job_steps`永続レコード + Server Actionからの同期実行トリガー。将来のワーカー分離を阻害しない抽象。
- プレビュー（`app/preview/`）: 別ルートグループ+専用CSP+noindexで信頼境界を分離。
- 決済（`lib/payments/`）: Stripeアダプター、既定はモック実装。
- 通知（`lib/notifications/`）: アプリ内通知必須、メールはアダプターのモック実装のみ。

## ディレクトリ構成

```
app/
├── (public)/          # 公開サイト
├── (auth)/            # login, register, password-reset
├── mypage/             # 顧客マイページ（要ログイン・customerロール）
├── admin/               # 管理者アプリ（要ログイン・adminロール）
├── preview/[caseId]/[versionId]/  # 実動プレビュー（別信頼境界）
├── api/webhooks/stripe/  # Stripe Webhook受信
└── _components/        # 共有UI
lib/
├── auth/                # 認証・認可（verify-session, roles）
├── supabase/            # Supabaseクライアント（browser/server/service-role）
├── ai/                  # AI Gateway + providers + context-builder
├── jobs/                 # jobs/job_steps runner
├── state-machine/        # Case/DeliverableVersion遷移許可表
├── payments/              # Stripeアダプター
├── notifications/          # 通知アダプター
├── templates/               # 業種別テンプレートスキーマ
├── preview/                  # プレビュー配信ロジック
└── validation/                # Zodスキーマ（境界入力検証）
supabase/migrations/          # DBスキーマ + RLS
scripts/                      # seed, 運用スクリプト
tests/e2e/                    # Playwright E2E
proxy.ts                      # 第一認証境界（Next.js Proxy = 旧middleware）
```

## リクエストフロー例（相談→案件生成）

1. 顧客が`/mypage`で新規相談を開始 → `messages`へ保存。
2. Server Actionが`AI Gateway.converse()`を呼び出し、応答を`messages`へ保存。会話が一定条件（AIが`nextAction: "create_case"`を返す等）を満たすと`cases`レコードを作成し状態を`inquiry_received`にする。
3. `jobs`に「要件構造化」ジョブを作成しジョブランナーが`structure()`を呼び出す。結果を`requirements`へ記録し`case.status`を`structuring_requirements`へ遷移。
4. `plan()`でタスク分解、`produce()`で成果物DRAFT生成、`review()`でQA、`escalate()`で承認要否判定という流れをdocs/07の状態機械に従って進める。
5. 各ステップは`agent_runs`/`ai_calls`相当（`usage_records`）へ記録し、承認が必要な遷移では`approval_requests`を作成して`attention_items`（赤ランプ）を管理者へ表示する。

## 環境

- 開発: ローカル`next dev`、Supabase無料プロジェクト（またはSupabase CLIローカルスタック、Docker任意）、`AI_PROVIDER=mock`、`PAYMENTS_PROVIDER=mock`。
- 本番（人間対応事項）: Vercel Pro、Supabase Pro、Stripe本番、本番AI API、独自ドメイン、プレビュー専用サブドメイン。
