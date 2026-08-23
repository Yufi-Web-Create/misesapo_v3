# CHANGELOG

## [Unreleased]

### Added
- プロジェクト初期化（Next.js 16 + TypeScript + Supabase + Tailwind + Biome + Vitest + Playwright構成）。
- Phase 0設計文書一式（docs/00〜11, DECISIONS/ASSUMPTIONS/BLOCKERS）。
- Phase 1: 公開サイト全12ページ（トップ/サービス/流れ/制作例/料金/FAQ/運営者情報/問い合わせ/規約/プライバシー/特商法/メンテナンス）+ 404/エラー + 共通ヘッダー・フッター。
- Phase 2: 全30テーブルのコアスキーマ + RLSポリシー(private.*ヘルパー関数、テナント分離、追記型テーブルへのクライアント書き込み禁止) + Storageバケット(case-files)のmigration。proxy.ts(第一境界)とverifySession/verifyAdminSession/verifyCustomerSession(第二境界)による二重の認証チェック。email+passwordのログイン/会員登録/ログアウト/パスワード再設定。ファイルアップロードのMIME/サイズ/拡張子検証。proxy.test.tsで9パターンのfail-closed挙動を検証。
