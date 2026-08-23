# 05. API契約

境界入力はすべてZodで検証する。ここではServer Actions/Route Handlerの主要な入出力契約を記す（詳細な型は各実装ファイルを正とする）。

## Server Actions（`lib/actions/`）

| Action | 入力 | 認可 | 出力/エラー |
|---|---|---|---|
| `startConsultation` | `{ storeId, message }` | customer（自store限定） | `{ caseId, conversationId }` |
| `sendCustomerMessage` | `{ caseId, message }` | customer（case参加者） | `{ messageId }` |
| `sendAdminCommand` | `{ caseId, instruction }` | admin | `{ commandId, structuredCommand, requiresApproval }`（直接実行せず影響・費用・承認要否を返す） |
| `requestApproval` | `{ kind, caseId, targetId, payload }` | admin/system | `{ approvalRequestId }` |
| `decideApproval` | `{ approvalRequestId, decision, reason }` | admin | `{ ok }`。承認後に該当jobを`pending`へ戻す |
| `submitQuote` | `{ caseId, amount, scope }` | admin | `{ quoteId }`。承認前は`status=DRAFT` |
| `respondToQuote` | `{ quoteId, decision }` | customer | `{ ok }` |
| `shareDeliverablePreview` | `{ deliverableVersionId, expiresAt }` | admin | `{ previewShareId, url }` |
| `revokePreviewShare` | `{ previewShareId }` | admin | `{ ok }` |
| `postReviewComment` | `{ deliverableVersionId, anchor, text }` | customer/admin | `{ reviewCommentId }` |
| `requestRevision` | `{ caseId, reviewCommentIds[] }` | customer | `{ ok }`。escalate()経由で契約範囲判定 |
| `approveDeliverable` | `{ deliverableVersionId }` | customer | `{ ok }` |
| `publishDeliverable` | `{ deliverableVersionId }` | admin | `{ ok }`。承認済みでなければ拒否 |
| `uploadFile` | `multipart: { caseId, file }` | customer/admin | `{ fileAssetId }`。MIME/サイズ検証 |
| `emergencyStopAgents` | `{ scope }` | admin | `{ ok }`。`system_settings`即時反映 |

## Route Handlers

- `POST /api/webhooks/stripe`: 署名検証必須。冪等キー（Stripeイベントid）で重複無視。
- `GET /preview/[caseId]/[versionId]`: `preview_shares`のトークン検証、失効/期限切れは404。

## 共通エラー形式

```ts
type ActionError = { code: string; message: string; fieldErrors?: Record<string, string[]> };
```

認可失敗は常に`403`相当・`code: "forbidden"`とし、対象の存在有無を漏らさない（IDOR対策として404ではなく一律403、または存在しない場合も403と同一応答にする）。
