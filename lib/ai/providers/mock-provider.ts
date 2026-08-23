import type {
  AiProvider,
  ConverseInput,
  ConverseResult,
  EscalateInput,
  EscalateResult,
  PlanInput,
  PlanResult,
  ProduceInput,
  ProduceResult,
  ReviewInput,
  ReviewResult,
  StructureInput,
  StructureResult,
} from "@/lib/ai/types";

/**
 * Deterministic, offline, zero-cost AiProvider implementation. This is the
 * default provider (AI_PROVIDER=mock) so the full consultation -> delivery
 * flow can run and be tested without any AI API credentials. See
 * docs/06-ai-agents.md and docs/DECISIONS.md.
 */
export class MockAiProvider implements AiProvider {
  private meta(capability: string) {
    return { capability, modelUsed: "mock-provider-v1", costCents: 0, latencyMs: 1 };
  }

  async converse(input: ConverseInput) {
    const lastCustomerMessage = [...input.history].reverse().find((m) => m.role === "customer");
    const hasEnoughContext = input.history.filter((m) => m.role === "customer").length >= 1;

    const result: ConverseResult = {
      status: "ok",
      assumptions: [],
      missingInformation: hasEnoughContext ? [] : ["店舗の業種", "作りたいものの概要"],
      deliverables: [],
      acceptanceEvidence: [],
      risks: [],
      nextAction: hasEnoughContext ? "create_case_and_structure_requirements" : "ask_follow_up",
      reply: hasEnoughContext
        ? `ご相談ありがとうございます。「${lastCustomerMessage?.content ?? ""}」について、担当のAIチームで内容を整理いたします。少々お待ちください。`
        : "ご相談ありがとうございます。どのようなお店で、どのようなページを作りたいか教えてください。",
      shouldCreateCase: hasEnoughContext,
    };
    return { result, meta: this.meta("converse") };
  }

  async structure(input: StructureInput) {
    const customerText = input.history
      .filter((m) => m.role === "customer")
      .map((m) => m.content)
      .join(" / ");

    const result: StructureResult = {
      status: "ok",
      assumptions: ["会話内容をもとにAIが要件の初稿を作成しました。詳細は管理者が確認します。"],
      missingInformation: [],
      deliverables: [],
      acceptanceEvidence: [],
      risks: [],
      nextAction: "await_quote_approval",
      summary: customerText.length > 0 ? customerText : "相談内容の要約（初稿）",
      structured: { rawCustomerText: customerText },
    };
    return { result, meta: this.meta("structure") };
  }

  async plan(input: PlanInput) {
    const result: PlanResult = {
      status: "ok",
      assumptions: [],
      missingInformation: [],
      deliverables: [],
      acceptanceEvidence: [],
      risks: [],
      nextAction: "produce_draft",
      tasks: [
        {
          title: "ページ構成の作成",
          description: `要件「${input.requirementSummary}」に基づく構成案`,
        },
        { title: "文章の下書き作成", description: "各セクションの文章を下書きする" },
      ],
    };
    return { result, meta: this.meta("plan") };
  }

  async produce(input: ProduceInput) {
    const result: ProduceResult = {
      status: "ok",
      assumptions: [],
      missingInformation: [],
      deliverables: [{ type: "page_draft", ref: input.taskTitle }],
      acceptanceEvidence: [],
      risks: [],
      nextAction: "submit_for_review",
      content: {
        title: input.taskTitle,
        sections: [
          { heading: "ご案内", body: `${input.requirementSummary}に基づく試作ページです。` },
        ],
      },
    };
    return { result, meta: this.meta("produce") };
  }

  async review(input: ReviewInput) {
    const hasContent = Object.keys(input.content).length > 0;
    const result: ReviewResult = {
      status: "ok",
      assumptions: [],
      missingInformation: [],
      deliverables: [],
      acceptanceEvidence: [
        {
          requirementId: "content-presence",
          passed: hasContent,
          evidence: hasContent ? "生成物にコンテンツが含まれています。" : "生成物が空です。",
        },
      ],
      risks: [],
      nextAction: hasContent ? "submit_for_admin_review" : "request_revision",
      passed: hasContent,
    };
    return { result, meta: this.meta("review") };
  }

  async escalate(input: EscalateInput) {
    const moneyOrPublishKeywords = ["金額", "契約", "公開", "納品", "返金", "削除"];
    const needsApproval = moneyOrPublishKeywords.some((kw) => input.situation.includes(kw));

    const result: EscalateResult = {
      status: "ok",
      assumptions: [],
      missingInformation: [],
      deliverables: [],
      acceptanceEvidence: [],
      risks: needsApproval ? ["人間承認が必要な操作です。"] : [],
      nextAction: needsApproval ? "create_approval_request" : "proceed",
      requiresHumanApproval: needsApproval,
      approvalKind: needsApproval ? "general" : undefined,
    };
    return { result, meta: this.meta("escalate") };
  }
}
