# 06. AIエージェント

## 能力単位（AI Gateway）

`lib/ai/gateway.ts` が唯一のAI呼び出し入口。以下6能力を提供する。

| 能力 | 入力 | 出力 | 対応する人間役割イメージ |
|---|---|---|---|
| converse | 会話履歴、顧客/管理者コンテキスト | 応答メッセージ + 構造化ヒント | 顧客担当AI、司令塔AI(会話部分) |
| structure | 会話履歴 | Requirement構造化データ | 要件整理AI |
| plan | Requirement | Task[]（依存関係付き） | 案件管理AI、司令塔AI |
| produce | Task, Requirement, テンプレートスキーマ | DeliverableVersion(DRAFT)のコンテンツ | 文章制作AI、デザイン・画像制作AI、Web制作AI |
| review | DeliverableVersion | 合否 + 要件ごとのAcceptanceEvidence | 検査AI、批評AI |
| escalate | 状況コンテキスト | 承認要否判定（ルールベース優先） | 案件管理AI（判断部分） |

## AgentDefinition

各定義は `defaultModel`, `escalationModel`, `reasoningEffort`, `maxCostPerRun`, `maxRetries`, `allowedTools`, `allowedDataScopes`, `stopConditions`, `escalationConditions` を持つ。モデル名はコードへ直書きせず`agent_definitions`テーブル+`system_settings`から解決する。

## 共通構造化出力スキーマ

```ts
type AgentOutput = {
  status: "ok" | "needs_more_info" | "needs_human_approval" | "failed";
  assumptions: string[];
  missingInformation: string[];
  deliverables: Array<{ type: string; ref: string }>;
  acceptanceEvidence: Array<{ requirementId: string; passed: boolean; evidence: string }>;
  risks: string[];
  nextAction: string;
};
```

Zodスキーマで検証する。無効な出力（スキーマ不一致・JSON parse失敗）は`maxRetries`まで再試行し、それでも失敗した場合は`agent_runs.status='failed'`とし、該当`case`に`attention_items(reason='failed')`を作成して安全停止する。

## 制作AIとQA AIの独立

`produce()`と`review()`は別の`AgentRun`として実行し、`review()`の呼び出しコンテキストには`produce()`の実行者情報・プロンプトを含めない（生成物の内容とrequirementsのみを渡す）。QA不合格が既定回数（`agent_definitions.maxRetries`、既定3回）続いた場合は`in_revision`ループを打ち切り、`awaiting_admin_decision`へ遷移し`attention_items(reason='qa_limit_reached')`を作成する。

## 修正依頼のスコープ判定

顧客の`ReviewComment`/チャットからの修正依頼は`produce()`へ直結しない。司令塔AI相当の`escalate()`が`ContractScope`（残修正回数・納期・追加料金要否）と照合し、範囲内なら`Task`化して`plan()`結果へ追加、範囲外または判断困難なら`Quote`（追加見積案）と`ApprovalRequest`を作成する。

## プロバイダーアダプター

`lib/ai/providers/` 配下に `AiProvider` インターフェースの実装を置く。既定は `mock-provider.ts`（決定的、無課金、外部通信なし）。`anthropic-provider.ts` はAPIキーが環境変数にある場合のみ有効化するスタブとして用意する。`AI_PROVIDER`環境変数で選択する。
