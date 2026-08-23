import { describe, expect, it } from "vitest";
import { agentOutputSchema } from "@/lib/ai/types";
import { MockAiProvider } from "./mock-provider";

describe("MockAiProvider", () => {
  const provider = new MockAiProvider();

  it("converse() asks a follow-up question when there is no customer history yet", async () => {
    const { result } = await provider.converse({ caseId: "case-1", history: [] });
    expect(agentOutputSchema.safeParse(result).success).toBe(true);
    expect(result.shouldCreateCase).toBe(false);
    expect(result.nextAction).toBe("ask_follow_up");
  });

  it("converse() is ready to structure requirements once the customer has spoken", async () => {
    const { result } = await provider.converse({
      caseId: "case-1",
      history: [{ role: "customer", content: "ネイルサロンの紹介ページを作りたいです。" }],
    });
    expect(agentOutputSchema.safeParse(result).success).toBe(true);
    expect(result.shouldCreateCase).toBe(true);
    expect(result.reply.length).toBeGreaterThan(0);
  });

  it("structure() returns a schema-valid, non-empty summary", async () => {
    const { result } = await provider.structure({
      caseId: "case-1",
      history: [{ role: "customer", content: "ネイルサロンの紹介ページを作りたいです。" }],
    });
    expect(agentOutputSchema.safeParse(result).success).toBe(true);
    expect(result.summary).toContain("ネイルサロン");
  });

  it("plan() produces at least one task", async () => {
    const { result } = await provider.plan({ caseId: "case-1", requirementSummary: "紹介ページ" });
    expect(agentOutputSchema.safeParse(result).success).toBe(true);
    expect(result.tasks.length).toBeGreaterThan(0);
  });

  it("review() fails a deliverable with no content", async () => {
    const { result } = await provider.review({
      caseId: "case-1",
      content: {},
      requirementSummary: "紹介ページ",
    });
    expect(result.passed).toBe(false);
    expect(result.nextAction).toBe("request_revision");
  });

  it("escalate() requires human approval for money/publish-related situations", async () => {
    const { result } = await provider.escalate({
      caseId: "case-1",
      situation: "正式な金額を提示する必要があります",
      contractRemainingRevisions: null,
    });
    expect(result.requiresHumanApproval).toBe(true);
  });

  it("escalate() does not require approval for routine situations", async () => {
    const { result } = await provider.escalate({
      caseId: "case-1",
      situation: "文章のタイポを修正します",
      contractRemainingRevisions: 2,
    });
    expect(result.requiresHumanApproval).toBe(false);
  });
});
