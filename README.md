# ミセサポAI Version 3

予約制の小規模店舗向けAI制作・運用支援サービス「ミセサポAI」の一般公開サイト・顧客マイページ・管理者Webアプリ・AI自動進行基盤。

## ステータス

実装中。詳細な進行状況は [docs/CHANGELOG.md](docs/CHANGELOG.md) と [docs/11-definition-of-done.md](docs/11-definition-of-done.md) を参照。

- [プロダクト要求仕様](docs/01-product-requirements.md)
- [アーキテクチャ](docs/02-architecture.md)
- [データモデル](docs/03-data-model.md)
- [画面マップ](docs/04-screen-map.md)
- [AIエージェント](docs/06-ai-agents.md)
- [状態機械](docs/07-state-machines.md)
- [セキュリティ](docs/08-security.md)
- [テスト戦略](docs/09-test-strategy.md)
- [運用](docs/10-operations.md)

## 技術構成

- Next.js（App Router）+ TypeScript + Tailwind CSS
- Biome（lint / format）
- Vitest + Testing Library（単体・統合テスト）、Playwright（E2E）
- Supabase（Postgres / Auth / Storage、RLS必須）
- AI Gateway（プロバイダー非依存アダプター、既定はモック実装で資格情報不要）

## セットアップ

```bash
npm install
cp .env.example .env.local
npm run dev
```

`http://localhost:3000` で確認できる。資格情報（Supabase/AI/Stripe等）を設定しなくても、`AI_PROVIDER=mock` / `PAYMENTS_PROVIDER=mock` の既定値でモックモードの主要フローが動作する。

## npm scripts

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run lint` / `npm run format` / `npm run check` | Biome |
| `npm run typecheck` | 型チェック |
| `npm test` | 単体・統合テスト |
| `npm run test:e2e` | E2E（Playwright、Supabase接続が必要） |
| `npm run seed` | 固定シード投入 |
| `npm run verify` | typecheck + check + test + build を一括実行 |

## ディレクトリ構成

詳細は [docs/02-architecture.md](docs/02-architecture.md) を参照。

## Version 1との関係

このリポジトリは新規実装であり、`Yufi-Web-Create/misesapo`（Version 1）とは独立している。Version 1は読み取り専用の参考資料として調査した（[docs/00-current-state.md](docs/00-current-state.md)参照）。
