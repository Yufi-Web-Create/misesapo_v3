# CLAUDE.md — ミセサポAI Version 3

このリポジトリで作業するときの必読情報。

## このプロジェクトについて

予約制小規模店舗向けAI制作・運用支援サービス「ミセサポAI」の一般公開サイト・顧客マイページ・管理者Webアプリ・AI自動進行基盤。詳細仕様は `docs/` を参照（`docs/01-product-requirements.md` から順に読むこと）。

## 開発方針（要約。全文は docs/PROJECT_SPEC相当=01参照）

- 完成度優先。モック画面で未実装を隠さない。
- 制作AIとQA AIは独立させる。
- 金額確定・契約変更・公開・納品・重要送信・削除は必ず人間承認（`approval_requests`）を経由する。AIプロンプトだけをセキュリティ境界にせず、必ずサーバー側（RLS + Server Action）で強制する。
- 状態遷移は `lib/state-machine/` の許可表からのみ行う。直接のstatus UPDATEを追加しない。

## コマンド

```bash
npm run dev        # 開発サーバー
npm run verify      # typecheck + lint/format check + test + build を一括実行（コミット前に実行）
npm run test:e2e     # Playwright（Supabase接続が必要）
npm run seed          # 固定シード投入（管理者/顧客A/顧客B/複数案件）
```

## 変更前に確認すること

- 新しいテーブル/カラムを追加する場合は `docs/03-data-model.md` を更新し、RLSポリシーを同じmigrationに含める。
- 新しい状態遷移を追加する場合は `docs/07-state-machines.md` を更新する。
- AI Gatewayの新しい能力・エージェントを追加する場合は `docs/06-ai-agents.md` を更新する。
- 判断に迷った場合は `docs/DECISIONS.md`、軽微な仮定は `docs/ASSUMPTIONS.md` に記録する。
