import { z } from "zod";

/** Common structured output every AI Gateway capability returns (docs/06-ai-agents.md). */
export const agentOutputSchema = z.object({
  status: z.enum(["ok", "needs_more_info", "needs_human_approval", "failed"]),
  assumptions: z.array(z.string()),
  missingInformation: z.array(z.string()),
  deliverables: z.array(z.object({ type: z.string(), ref: z.string() })),
  acceptanceEvidence: z.array(
    z.object({ requirementId: z.string(), passed: z.boolean(), evidence: z.string() }),
  ),
  risks: z.array(z.string()),
  nextAction: z.string(),
});
export type AgentOutput = z.infer<typeof agentOutputSchema>;

export type ConverseInput = {
  // The consultation flow always creates a case shell before the first
  // message is sent (see lib/actions/consultation.ts), so this is never null.
  caseId: string;
  history: Array<{ role: "customer" | "ai"; content: string }>;
};
export type ConverseResult = AgentOutput & { reply: string; shouldCreateCase: boolean };

export type StructureInput = { caseId: string; history: Array<{ role: string; content: string }> };
export type StructureResult = AgentOutput & {
  summary: string;
  structured: Record<string, unknown>;
};

export type PlanInput = { caseId: string; requirementSummary: string };
export type PlanResult = AgentOutput & {
  tasks: Array<{ title: string; description: string }>;
};

export type ProduceInput = { caseId: string; taskTitle: string; requirementSummary: string };
export type ProduceResult = AgentOutput & { content: Record<string, unknown> };

export type ReviewInput = {
  caseId: string;
  content: Record<string, unknown>;
  requirementSummary: string;
};
export type ReviewResult = AgentOutput & { passed: boolean };

export type EscalateInput = {
  caseId: string;
  situation: string;
  contractRemainingRevisions: number | null;
};
export type EscalateResult = AgentOutput & {
  requiresHumanApproval: boolean;
  approvalKind?: string;
};

export type AiCallMeta = {
  capability: string;
  modelUsed: string;
  costCents: number;
  latencyMs: number;
};

export interface AiProvider {
  converse(input: ConverseInput): Promise<{ result: ConverseResult; meta: AiCallMeta }>;
  structure(input: StructureInput): Promise<{ result: StructureResult; meta: AiCallMeta }>;
  plan(input: PlanInput): Promise<{ result: PlanResult; meta: AiCallMeta }>;
  produce(input: ProduceInput): Promise<{ result: ProduceResult; meta: AiCallMeta }>;
  review(input: ReviewInput): Promise<{ result: ReviewResult; meta: AiCallMeta }>;
  escalate(input: EscalateInput): Promise<{ result: EscalateResult; meta: AiCallMeta }>;
}
