import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MockAiProvider } from "@/lib/ai/providers/mock-provider";
import type {
  AiProvider,
  ConverseInput,
  EscalateInput,
  PlanInput,
  ProduceInput,
  ReviewInput,
  StructureInput,
} from "@/lib/ai/types";

const AGENT_KEY = "misesapo-core-agent";
const MAX_RETRIES = 3;

function resolveProvider(): AiProvider {
  const providerName = process.env.AI_PROVIDER ?? "mock";
  // anthropic/openai adapters are intentionally not wired in until real API
  // keys are configured (docs/DECISIONS.md) — unknown/unset values fall back
  // to the mock provider so the app never hard-fails for lack of credentials.
  switch (providerName) {
    default:
      return new MockAiProvider();
  }
}

/**
 * The single entry point for AI calls (docs/06-ai-agents.md). Records every
 * attempt to agent_runs, retries invalid responses up to MAX_RETRIES, and
 * marks the run failed (without throwing past this function for retryable
 * failures) so callers can create an attention_item instead of crashing.
 */
export class AiGateway {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly provider: AiProvider = resolveProvider(),
  ) {}

  private async runWithLogging<T extends { status: string }>(
    caseId: string,
    capability: string,
    input: unknown,
    call: () => Promise<{
      result: T;
      meta: { modelUsed: string; costCents: number; latencyMs: number };
    }>,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { result, meta } = await call();

        await this.supabase.from("agent_runs").insert({
          case_id: caseId,
          agent_key: AGENT_KEY,
          capability,
          input,
          output: result,
          status: result.status === "failed" ? "failed" : "succeeded",
          cost_cents: meta.costCents,
          latency_ms: meta.latencyMs,
          model_used: meta.modelUsed,
        });

        return result;
      } catch (error) {
        lastError = error;
      }
    }

    await this.supabase.from("agent_runs").insert({
      case_id: caseId,
      agent_key: AGENT_KEY,
      capability,
      input,
      status: "failed",
      error: lastError instanceof Error ? lastError.message : String(lastError),
    });

    await this.supabase.from("attention_items").insert({
      case_id: caseId,
      reason: "failed",
      detail: `AI capability '${capability}' failed after ${MAX_RETRIES} attempts.`,
    });

    throw lastError instanceof Error
      ? lastError
      : new Error(`AI capability '${capability}' failed`);
  }

  converse(input: ConverseInput) {
    return this.runWithLogging(input.caseId, "converse", input, () =>
      this.provider.converse(input),
    );
  }

  structure(input: StructureInput) {
    return this.runWithLogging(input.caseId, "structure", input, () =>
      this.provider.structure(input),
    );
  }

  plan(input: PlanInput) {
    return this.runWithLogging(input.caseId, "plan", input, () => this.provider.plan(input));
  }

  produce(input: ProduceInput) {
    return this.runWithLogging(input.caseId, "produce", input, () => this.provider.produce(input));
  }

  review(input: ReviewInput) {
    return this.runWithLogging(input.caseId, "review", input, () => this.provider.review(input));
  }

  escalate(input: EscalateInput) {
    return this.runWithLogging(input.caseId, "escalate", input, () =>
      this.provider.escalate(input),
    );
  }
}
