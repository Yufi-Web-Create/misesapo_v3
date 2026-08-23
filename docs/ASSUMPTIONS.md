# ASSUMPTIONS

軽微な不明点について、事業目的・安全性・保守性・低コストを基準に置いた仮定。

- ログイン方式はemail+passwordとする（V1踏襲）。magic link/OTPは外部SMTP等の設定を要するため対象外。
- 初期対象業種は個人美容室・ネイルサロンを中心に、飲食店・美容/サロン・小規模サービス・教室/スクールの4テンプレートを実装する。
- 組織モデルは「運営者側は単一Organization」「顧客は各自1つ以上のStoreを持つCustomerProfile」とする。将来複数運営者（フランチャイズ運営代行等）に拡張できるようOrganizationテーブルは維持する。
- 料金・プランは公開サイトに目安額を掲示するが、正式金額提示は必ずQuote+ApprovalRequestを経由する（PROJECT_SPEC.mdの人間承認対象に明記）。
- 通知はアプリ内(Notification/AttentionItem)を必須実装とし、メール送信は`lib/notifications/adapter.ts`のアダプターとしてモック実装のみ用意する（本番メール送信サービスの資格情報がないため）。
- AI呼び出しは既定でMockAiProviderを使用し、決定的な構造化出力を返す。これにより資格情報なしでも相談→案件生成→要件化→制作→QA→承認→納品のフルフローをテストできる。
- 案件(Case)の識別子はUUID。バージョン採番は `DeliverableVersion.version_number`（Case×Deliverable単位の連番、DB側でトランザクション+一意制約により採番する）とする。
- 赤ランプ（AttentionItem）は理由コード（`needs_admin_approval`, `unread_customer_message`, `ai_needs_decision`, `failed`, `qa_limit_reached`, `deadline_risk`, `pending_money_decision`）ごとにレコードを持ち、該当理由が解消された時のみサーバー側でそのレコードを解決済みにする。画面を開いただけでは解決しない。
- 開発機のリソース制約（V1のARCHITECTURE.md記載: 2017 MacBook Pro/Core i5/RAM8GB相当）を踏襲し、Dockerを必須にしない。Supabase CLIのローカルスタックは任意（Docker必要）とし、Docker無しでもリモートのSupabase無料プロジェクト接続、またはmigration SQLのレビューのみで開発を継続できるようにする。
- E2Eテストは実際のブラウザ操作をPlaywrightで行うが、外部Supabaseプロジェクトが必要なため、CI/ローカルでSupabaseが利用できない場合はunit/integrationテスト（DBアクセスをモックしたリポジトリ層のテスト）で代替する。E2Eの実行手順はdocs/09-test-strategy.mdに明記する。
- Supabaseの型生成（`supabase gen types typescript`）は、実際のSupabaseプロジェクトが必要なため本セッションでは実行していない。`.from("table_name")`呼び出しは現状ゆるい型（`any`相当）になっている。開発用Supabaseプロジェクト接続後、`npm run db:migrate`でmigration適用→型生成を行い、`lib/supabase/database.types.ts`を追加して各クライアントに型を付与することをBLOCKERS.mdではなく通常のフォローアップ実装として次のイテレーションで行う。
- Supabase Authのメール確認（Confirm email）設定は環境依存のため、開発用プロジェクトでは無効化するか、`register()`の`status: "check-email"`分岐で確認メール待ちを案内する。V1同様、magic link/OTPは採用しない。
