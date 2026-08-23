# 09. テスト戦略

## レイヤー

- **単体テスト（Vitest）**: 状態遷移許可表、Zodスキーマ検証、AI Gateway（MockProvider）、契約範囲判定ロジック、費用/回数上限ロジック。
- **統合テスト（Vitest + Supabaseテストプロジェクト or ローカルスタック）**: RLSポリシー（顧客A/顧客Bの越境不可）、承認ゲート、ジョブ冪等性、Webhook重複処理。
- **E2E（Playwright）**: 公開サイト主要導線、登録/ログイン/保護ルート、相談開始→案件生成、管理者承認、プレビュー共有/失効、決済モックフロー、相談から納品までのフル架空案件フロー。
- **アクセシビリティ**: 主要画面でaxe-core相当のチェックをE2Eに組み込む。
- **セキュリティ**: IDOR/越境アクセス試行を統合テストで明示的に検証する。

## 固定シード（`scripts/seed.ts`）

- 管理者1名、顧客A/B（各1店舗以上）、複数案件（承認待ち、失敗、複数成果物版を含む）。
- 顧客Aのセッションで顧客Bの`case`/`file_asset`/`conversation`へアクセスし、いずれも403またはRLSにより空集合になることをテストで証明する。

## 実行コマンド

```bash
npm run typecheck
npm run check       # biome lint+format check
npm test            # vitest（単体+統合。Supabase未接続時は統合テストをskipし理由をログ出力）
npm run build
npm run test:e2e    # playwright（要: .env.local に開発用Supabaseプロジェクト設定）
npm run verify       # typecheck + check + test + build を一括実行
```

## CI/ローカル制約への対応

外部Supabaseプロジェクトの資格情報が無い環境では、統合テスト/E2Eはスキップし、その旨をテスト出力に明示する（サイレントに成功扱いしない）。単体テストとビルドは資格情報なしで常に実行できる状態を維持する。
