# CHANGELOG

## [Unreleased]

### Added
- プロジェクト初期化（Next.js 16 + TypeScript + Supabase + Tailwind + Biome + Vitest + Playwright構成）。
- Phase 0設計文書一式（docs/00〜11, DECISIONS/ASSUMPTIONS/BLOCKERS）。
- Phase 1: 公開サイト全12ページ（トップ/サービス/流れ/制作例/料金/FAQ/運営者情報/問い合わせ/規約/プライバシー/特商法/メンテナンス）+ 404/エラー + 共通ヘッダー・フッター。
- Phase 2: 全30テーブルのコアスキーマ + RLSポリシー(private.*ヘルパー関数、テナント分離、追記型テーブルへのクライアント書き込み禁止) + Storageバケット(case-files)のmigration。proxy.ts(第一境界)とverifySession/verifyAdminSession/verifyCustomerSession(第二境界)による二重の認証チェック。email+passwordのログイン/会員登録/ログアウト/パスワード再設定。ファイルアップロードのMIME/サイズ/拡張子検証。proxy.test.tsで9パターンのfail-closed挙動を検証。
- Phase 3/5 (垂直スライス): AI Gateway(converse/structure/plan/produce/review/escalateの6能力、Zod検証、agent_runsへの記録、失敗時のattention_item自動作成)とMockAiProvider(資格情報不要の決定的実装)。lib/state-machine/case.ts(サーバー専用の許可表+承認ゲート+楽観ロック)。lib/jobs/runner.ts(冪等キー付きjobs記録)。顧客マイページの新規相談チャット(/mypage/consult/new)が実際に案件を作成し、AIが応答し、要件整理まで自動進行して見積承認待ち状態でattention_itemを作成する一連の流れを実装。案件詳細ページ(/mypage/cases/[caseId])でチャット継続と要件要約を表示。
- Phase 4 (承認ループの完成): 管理者アプリの案件サイドバー(赤ランプ=未解決attention_itemを色+role="img"のaria-label+テキストラベルで表示)、案件ワークスペース(要件・チャット・見積・承認)、承認センター(/admin/approvals)を実装。管理者が見積を送付→顧客が承諾(respondToQuote、顧客自身の同意)→管理者が最終承認(decideApproval、顧客の承諾を確認してからのみ承認可能)→preparing_productionへ自動遷移、という二段階の人間確認(顧客の同意+運営者の承認)を経て初めて金額が確定する流れを実装。全操作をaudit_logsに記録。
