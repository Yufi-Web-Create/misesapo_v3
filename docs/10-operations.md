# 10. 運用

## セットアップ（クリーン環境）

```bash
git clone <repo>
cd misesapo_v3
npm install
cp .env.example .env.local   # 値は任意。未設定でもモックモードで主要フローが動く
npm run dev
```

Supabaseに接続する場合は`.env.local`に`NEXT_PUBLIC_SUPABASE_URL`等を設定し、`supabase/migrations/`を適用する（`npx supabase db push`、または開発用プロジェクトのSQL Editorで順に実行）。

## 障害対応

- ジョブ失敗: `/admin/cases/[caseId]`のAI実行履歴から失敗理由を確認し、再試行操作を行う。`jobs.status='failed'`は自動再試行しない（無限ループ防止）。
- AI費用超過: `system_settings`の緊急停止フラグ、または`agent_definitions.maxCostPerRun`超過で自動停止し`attention_items`を作成する。
- 決済Webhook不達: Stripeダッシュボード（本番接続後）からの再送、または`payment_records`の状態を手動照合する運用手順を用意する（モック環境ではテストのみ）。

## バックアップ・秘密情報

- 開発段階: migrationの再実行可能性でスキーマを担保。データバックアップは対象外（開発データのため）。
- 秘密情報は`.env.local`のみ、Gitには`.env.example`のみをコミットする。

## 本番接続手順（人間対応事項の一覧、実行はしない）

1. Supabase Proプロジェクト作成、migration適用、RLS最終確認。
2. Vercel Proプロジェクト作成、環境変数投入、独自ドメイン設定。
3. Stripe本番アカウント接続、Webhookエンドポイント登録。
4. 本番AI APIキー投入、`AI_PROVIDER`切替。
5. メール送信サービス契約、`MAIL_PROVIDER`切替。
6. プレビュー専用サブドメイン発行。
7. 利用規約・特定商取引法表記の法的最終確定。
8. MFA有効化、監査ログ運用開始。
