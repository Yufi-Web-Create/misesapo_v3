# 00. 現状・Version 1からの引き継ぎ方針

## Version 3の位置づけ

このリポジトリ（`Yufi-Web-Create/misesapo_v3`）は、ミセサポAIの新規実装である。作成時点で空リポジトリであり、Version 1/2の履歴は含まない。Version 1は別リポジトリ `Yufi-Web-Create/misesapo`（private, TypeScript）を読み取り専用の参考資料として調査した。

## Version 1の状態（調査結果）

- 実装フェーズ: Phase 0（開発基盤）完了、Phase 1（アプリ基盤・認証・データ分離）の途中（1.4 Auth導入まで）。
- 技術構成: Next.js（App Router）+ TypeScript、Biome、Vitest + Testing Library、Supabase（Postgres/Auth/Storage）。
- 実装済み: `proxy.ts`（Next.js Proxy、旧middleware相当）による `/admin` `/mypage` の未ログインリダイレクト（fail-closed）、`lib/auth/verify-session.ts` によるServer Component側の二重確認、email+password ログイン/ログアウトのServer Action、コア schema migration、RLSポリシーとprivateヘルパー関数。
- 未実装: 顧客マイページ・管理画面の実際の業務機能、AIチーム、ジョブ基盤、プレビュー、決済、通知はすべてこれから。
- 既知の設計判断（アーキテクチャ確定事項）:
  - AI Gatewayを唯一のAI呼び出し入口とし、`converse/structure/plan/produce/review/escalate` の6能力に整理する。
  - `jobs`/`job_steps` による永続ジョブ管理。実行方式（何が定期実行するか）は未決定のまま残されていた。
  - プレビューは別信頼境界（別オリジン想定）で実行し、管理画面・マイページの資格情報を持たせない。
  - Vercel Hobby不可（商用不可のため）。本番はVercel Pro + Supabase Pro + Stripe本番 + 独自ドメイン。
- 既知の未決定事項（V1 ARCHITECTURE.md 16節）: ジョブ実行方式の具体、artifactsテーブルのバージョン採番方式、AI費用の予算・按分方式、プレビュー専用サブドメインの発行方法、tenantデータモデルの具体、赤ランプの実装方式、ディレクトリ構成。

## Version 3で再利用する設計判断

- Next.js 1アプリ内でルート分離（公開/`mypage`/`admin`）する構成を踏襲する。
- `proxy.ts` によるfail-closedな第一境界 + Server Component側の直前検証という二重防御パターンを踏襲する（設計は再評価の上、V3として独自に実装する）。
- Supabase（Postgres/Auth/Storage）+ RLS必須という基盤選定を踏襲する。
- AI Gatewayの6能力抽象化、jobs/job_steps、プレビュー別信頼境界という設計思想を踏襲し、V3ではjobs実行方式・バージョン採番・tenant/organizationモデル・赤ランプ実装など、V1で未決定だった事項をすべて確定させる。

## 破棄・再設計する部分

- V1はまだ業務機能を持たないため「破棄すべき実装」は基本的にない。V3では要件が大幅に拡張されている（案件状態機械、成果物版状態機械、承認ゲート、テンプレートスキーマ、実動プレビュー、決済、通知、監査、AIエージェント群）ため、V1のコードをそのまま複製せず、テーブル設計・ディレクトリ構成を含めてV3として作り直す。

## 既知の失敗・リスクの引き継ぎ

- V1 AUTODEV_PROGRESS.mdより: ログイン方式はemail+passwordを選択（magic link/OTPは外部SMTP設定を要するため自走モードでは選択しなかった）。V3でも同様の制約下にあるため踏襲する。
- 本番Supabaseへの実際のmigration適用・実アカウントでのログイン確認はいずれも人間作業として残る（本番資格情報が必要なため）。V3でも同様に「人間対応事項」として扱う。
