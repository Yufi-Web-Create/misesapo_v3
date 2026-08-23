# 04. 画面マップ

## 公開サイト `(public)`
`/` トップ / `/service` サービス説明 / `/flow` 利用の流れ / `/works` 制作できるもの・業種別制作例 / `/pricing` 料金・プラン / `/faq` FAQ / `/company` 運営者情報 / `/contact` 問い合わせ / `/terms` 利用規約 / `/privacy` プライバシーポリシー / `/legal` 特定商取引法表記 / `not-found` 404 / `error` エラー / `/maintenance` メンテナンス。

## 認証 `(auth)`
`/login` / `/register` / `/password-reset` / `/password-reset/confirm`

## 顧客マイページ `mypage`
`/mypage` ダッシュボード（案件一覧・次の行動） / `/mypage/consult/new` 新規相談 / `/mypage/cases/[caseId]` 案件詳細（会話・要件要約・進捗） / `/mypage/cases/[caseId]/chat` AIチャット / `/mypage/cases/[caseId]/preview` 実動プレビュー（幅切替・版・差分・コメント） / `/mypage/cases/[caseId]/approvals` 見積/要件/最終確認の承認 / `/mypage/cases/[caseId]/files` ファイル / `/mypage/billing` 契約・支払い・請求 / `/mypage/profile` プロフィール・店舗情報・通知設定 / `/mypage/account/close` 退会・エクスポート・削除申請。

## 管理者アプリ `admin`
`/admin` 管制ダッシュボード / `/admin/cases` 案件一覧（サイドバー相当をレイアウトで共通化） / `/admin/cases/[caseId]` 案件ワークスペース（概要・司令塔AIチャット・顧客会話・要件・タスク・成果物・プレビュー・承認・見積決済・ファイル・AI実行履歴・監査） / `/admin/approvals` 承認センター / `/admin/customers` 顧客・店舗管理 / `/admin/agents` AI稼働状況・エージェント設定（有効化/モデル/費用上限） / `/admin/billing` 見積・料金・契約・決済一覧 / `/admin/audit` 監査ログ / `/admin/settings` システム設定・緊急停止 / `/admin/notifications` 通知。

管理者レイアウトは左サイドバーに案件一覧（検索・絞り込み・並べ替え・ページング、赤ランプ表示）を常設し、モバイルではドロワーに切り替える。

## プレビュー `preview`
`/preview/[caseId]/[versionId]`（共有トークン必須、管理者/顧客共有からのみ到達）。noindex、別CSP。
