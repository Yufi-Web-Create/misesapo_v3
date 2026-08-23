# 03. データモデル

正規のスキーマは `supabase/migrations/` のSQLを正とする。本書は概要とRLS方針を記す。

## テナント分離の単位

- `organization_id`: 運営者側（初期は単一だが将来複数運営を想定）。
- `store_id`: 顧客の店舗単位。
- `case_id`: 案件単位。会話・要件・タスク・成果物・承認はすべて`case_id`に紐づく。

## テーブル一覧（役割）

| テーブル | 役割 |
|---|---|
| organizations | 運営組織 |
| user_profiles | Supabase Authユーザーに紐づくプロフィール（role: customer/admin） |
| memberships | user_profiles と organizations/stores の所属関係、権限ロール |
| stores | 顧客店舗 |
| customer_profiles | 顧客（店主等）プロフィール、storeに紐づく |
| cases | 案件。状態機械の主体 |
| case_state_transitions | 案件状態遷移履歴（追記型） |
| requirements | AIが整理した要件（構造化） |
| tasks | 案件内タスク |
| task_dependencies | タスク依存関係 |
| conversations | 会話スレッド（channel: customer/admin_internal で分離） |
| messages | メッセージ本文（sender_type: customer/admin/ai/system） |
| agent_definitions | AIエージェント定義（モデル、権限、上限） |
| agent_runs | AI Gateway呼び出し実行記録 |
| agent_decisions | AIの構造化判断（status/assumptions/missingInformation等） |
| approval_requests | 承認申請 |
| approval_decisions | 承認可否の記録（追記型） |
| quotes | 見積 |
| contract_scopes | 契約範囲（修正回数上限等） |
| subscriptions | 継続契約 |
| payment_records | 決済記録（追記型） |
| deliverables | 成果物（案件内の論理的な納品物単位、例: 店舗サイト） |
| deliverable_versions | 成果物の版。状態機械の主体 |
| preview_deployments | プレビュー配信インスタンス（版に対応） |
| preview_shares | プレビュー共有トークン・期限・失効 |
| review_comments | プレビュー上のコメントピン |
| file_assets | アップロードファイル |
| notifications | アプリ内通知 |
| attention_items | 赤ランプ（対応要因ごとに1レコード） |
| audit_logs | 監査ログ（追記型、全重要操作） |
| usage_records | AI利用量・費用記録（案件別集計の元データ） |
| system_settings | システム設定（緊急停止フラグ等） |

## 共通カラム方針

全テーブルに `id uuid default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`（トリガーで自動更新）を持たせる。`organization_id`（または`case_id`経由の間接テナント境界）を必ず持たせ、RLSの主キーとする。金銭・承認・公開・監査系テーブル（case_state_transitions, approval_decisions, payment_records, audit_logs, deliverable_versions公開後）は`UPDATE`/`DELETE`をRLSで禁止し追記のみ許可する。

## RLS方針

- ブラウザは常にpublishable keyのみ使用しRLSを必ず通る。service role keyはNext.jsサーバー環境変数のみに存在する。
- `is_admin()`, `is_member_of_organization(org_id)`, `is_case_participant(case_id)` 等のSQL関数（`security definer`ではなく、参照先テーブルへのSELECT権限を前提にした通常関数）をprivateスキーマに用意し、ポリシーから呼び出す。
- 顧客ロールは自分が所属する`store_id`配下の`case`とその関連レコードのみSELECT可能。他store・他caseへのアクセスは行レベルで拒否する。
- 管理者ロールは`organizations`配下全件にアクセス可能だが、`memberships.role='admin'`をDB側で確認する（アプリ側の認可チェックと二重化）。
- `conversations.channel='admin_internal'`は管理者ロールのみSELECT可能。顧客ロールは`channel='customer'`のみ。
- `preview_shares`は失効後（`revoked_at`が非NULL、または`expires_at`超過）は匿名アクセス経路からSELECT不可にする関数チェックを設ける。

## 状態機械テーブル

- `cases.status` は docs/07-state-machines.md のCase状態一覧のいずれか。
- `deliverable_versions.status` は同DRAFT〜ARCHIVEDのいずれか。
- 遷移はアプリ層の許可表関数（`lib/state-machine/`）を経由したUPDATEのみを許可し、直接の任意UPDATEはRLSのUPDATEポリシーで制限する列（statusを含む行）についてはサーバー専用のRPC/Server Actionからのみ許可する。
