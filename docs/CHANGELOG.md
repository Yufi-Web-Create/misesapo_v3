# CHANGELOG

## [Unreleased]

### Added
- プロジェクト初期化（Next.js 16 + TypeScript + Supabase + Tailwind + Biome + Vitest + Playwright構成）。
- Phase 0設計文書一式（docs/00〜11, DECISIONS/ASSUMPTIONS/BLOCKERS）。
- Phase 1: 公開サイト全12ページ（トップ/サービス/流れ/制作例/料金/FAQ/運営者情報/問い合わせ/規約/プライバシー/特商法/メンテナンス）+ 404/エラー + 共通ヘッダー・フッター。
- Phase 2: 全30テーブルのコアスキーマ + RLSポリシー(private.*ヘルパー関数、テナント分離、追記型テーブルへのクライアント書き込み禁止) + Storageバケット(case-files)のmigration。proxy.ts(第一境界)とverifySession/verifyAdminSession/verifyCustomerSession(第二境界)による二重の認証チェック。email+passwordのログイン/会員登録/ログアウト/パスワード再設定。ファイルアップロードのMIME/サイズ/拡張子検証。proxy.test.tsで9パターンのfail-closed挙動を検証。
- Phase 3/5 (垂直スライス): AI Gateway(converse/structure/plan/produce/review/escalateの6能力、Zod検証、agent_runsへの記録、失敗時のattention_item自動作成)とMockAiProvider(資格情報不要の決定的実装)。lib/state-machine/case.ts(サーバー専用の許可表+承認ゲート+楽観ロック)。lib/jobs/runner.ts(冪等キー付きjobs記録)。顧客マイページの新規相談チャット(/mypage/consult/new)が実際に案件を作成し、AIが応答し、要件整理まで自動進行して見積承認待ち状態でattention_itemを作成する一連の流れを実装。案件詳細ページ(/mypage/cases/[caseId])でチャット継続と要件要約を表示。
