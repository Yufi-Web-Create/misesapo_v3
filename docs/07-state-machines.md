# 07. 状態機械

## Case（案件）状態

```
inquiry_received（相談受付）
  → gathering_info（情報収集中）
  → awaiting_customer_reply（顧客回答待ち）※gathering_infoと相互遷移可
  → structuring_requirements（要件整理中）
  → awaiting_quote_approval（見積承認待ち・管理者）
  → awaiting_client_approval（顧客承認待ち）
  → preparing_production（制作準備）
  → in_production（制作中）
  → in_qa（品質検査中）
  → in_revision（修正中）※in_qaと相互遷移可
  → awaiting_admin_decision（管理者判断待ち）
  → awaiting_final_approval（最終承認待ち）
  → client_reviewing（顧客確認中）
  → awaiting_acceptance（検収待ち）
  → awaiting_delivery_approval（納品承認待ち）
  → delivered（納品済み）

任意の状態から: on_hold（一時停止）, failed（失敗）, cancelled（キャンセル） へ遷移可能。
on_hold からは一時停止直前の状態へ復帰可能。
```

遷移許可表は `lib/state-machine/case.ts` の `CASE_TRANSITIONS` に定義し、`transitionCase()` 関数以外からの直接UPDATEを禁止する。各遷移で `case_state_transitions` へ実行者・日時・理由・変更前後・関連task_id・関連approval_idを記録する。

## DeliverableVersion（成果物版）状態

```
DRAFT → AI_QA → ADMIN_REVIEW → CLIENT_REVIEW → (CHANGE_REQUESTED → DRAFT の新版を作成)
CLIENT_REVIEW → CLIENT_APPROVED → READY_TO_PUBLISH → PUBLISHED → ARCHIVED（新版PUBLISH時に旧版が自動遷移）
```

- `PUBLISHED` になった版は不変（`updated_at`を除く全カラムのUPDATE禁止をRLSで強制、内容修正は必ず新しい`deliverable_versions`行を作る）。
- 承認（`approval_requests`/`approval_decisions`）は必ず対象の`deliverable_version_id`を保持し、`transitionDeliverableVersion()`は承認対象の版IDと遷移先版IDが一致することを検証してから状態を進める。古い版に付与された承認を別の（より新しい）版へ流用できないようにする。

## 承認ゲート

以下の遷移は`approval_requests`のACCEPTEDが存在しない限り実行できない（`lib/state-machine/`内でチェック）。

- Case: `awaiting_quote_approval → preparing_production`（金額確定）
- Case: `awaiting_final_approval → client_reviewing`（管理者最終承認）
- Case: `awaiting_delivery_approval → delivered`（納品）
- DeliverableVersion: `ADMIN_REVIEW → CLIENT_REVIEW`（管理者レビュー通過）
- DeliverableVersion: `READY_TO_PUBLISH → PUBLISHED`（本番公開）
- 決済確定・返金・重要送信も同様に承認必須アクションとして`ApprovalRequest.kind`で区別する。

## 人間承認後の自動再開

承認が`ApprovalDecision(decision='approved')`で記録されると、待機していたjobがある場合は`jobs`テーブルの該当レコードを`pending`に戻し、ジョブランナーが自動的に後続処理（次のAI Gateway呼び出し等）を再開する。
