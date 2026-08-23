# 08. セキュリティ

## 脅威モデル（概要）

- 顧客間の水平権限昇格（IDOR）: 他店舗・他案件のデータ閲覧/改ざん。
- 顧客→管理者境界の垂直権限昇格。
- プレビューiframe経由での管理画面/マイページへのアクセス（クリックジャッキング、Cookie窃取）。
- AI生成コンテンツ（プロンプトインジェクション）による権限外操作の誘発。
- 公開済み成果物の不正な上書き。
- 承認なしの金額確定・課金・公開・納品・重要送信。
- ファイルアップロード経由のマルウェア/危険拡張子。
- 決済Webhookの重複/なりすまし受信。

## 対策方針

- 認証境界を`proxy.ts`（第一防御）とServer Component直前の`verifySession()`（第二防御）の二重にする。layoutを唯一の認証境界にしない。
- 全テーブルにRLSを実装し、`organization_id`/`store_id`/`case_id`単位でテナント分離する。顧客Aが顧客Bの`case`/`conversation`/`file_asset`等へアクセスできないことをテストで証明する。
- サーバー側状態遷移許可表（docs/07）以外での`status`列直接更新を禁止する。
- プレビューは別ルートグループ+専用CSP+`iframe sandbox`+noindexで隔離し、Supabase service role keyやセッションCookieを一切渡さない。
- AIへ渡す情報は必要最小限にする。制作/QA AIには`customer_profiles`の連絡先等の個人情報を渡さず、`case`内の要件・成果物のみを渡す（`lib/ai/context-builder.ts`で個人情報フィールドを除外）。
- 重要操作（承認、公開、決済、削除、送信）はすべて`audit_logs`に実行者・日時・理由・対象・変更前後を記録する。
- ファイルアップロードはMIMEタイプ検証、サイズ上限、拡張子allowlist、Supabase Storageのバケットポリシーで検証する（拡張子のみの信用をしない）。
- CSRF対策としてServer Actionsを使用（Next.jsの組み込み保護）し、状態変更を伴うRoute HandlerはOriginヘッダ検証を行う。
- 決済WebhookはStripe署名検証必須、`payment_records`に外部イベントIDのUNIQUE制約を設け重複処理を防止する（冪等性）。
- 秘密情報はコード・ログ・DB・AIプロンプトへ平文保存しない。`.env.local`のみに保持し、`.gitignore`で除外する。
- 本番データを開発/テストへコピーしない。E2E/開発は`scripts/seed.ts`のシードデータのみ使用する。

## MFA・暗号化・監査・バックアップ（本番接続時の方針、現段階は接続点のみ）

- MFA: Supabase Authの多要素認証機能を有効化する接続点を`docs/10-operations.md`に記載し、本番接続時に人間が有効化する。
- 暗号化: Supabase管理下の保存時暗号化を前提とし、追加のアプリ層暗号化は機密度の高いカラム（該当時）にのみ適用を検討する（現段階では対象カラムなし）。
- 監査: `audit_logs`をアプリ機能として実装済みとし、本番ではSupabaseの監査ログ機能と併用する。
- バックアップ: Supabase Pro移行後の自動バックアップに依存する。開発段階はmigrationの再実行可能性でカバーする。
- 異常検知: 本MVPでは実装せず、将来課題としてdocs/11に記載する。
