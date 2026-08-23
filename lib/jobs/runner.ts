import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

type RunJobInput<T> = {
  supabase: SupabaseClient;
  caseId: string;
  kind: string;
  /** Unique per logical operation (e.g. `structure:${caseId}`) so a retried
   * trigger cannot double-run the same work. See docs/DECISIONS.md. */
  idempotencyKey: string;
  payload?: Record<string, unknown>;
  execute: () => Promise<T>;
};

/**
 * Executes `execute()` synchronously (see docs/DECISIONS.md "ジョブ実行方式")
 * while persisting a `jobs` row for audit/observability and idempotency. If a
 * job with the same idempotency_key already exists and succeeded, the cached
 * result path is short-circuited (the caller should treat this as "already
 * done" and re-read state from the DB rather than re-run side effects).
 * Failures are recorded on the job row and re-thrown for the caller to
 * surface as an attention_item.
 */
export async function runJob<T>({
  supabase,
  caseId,
  kind,
  idempotencyKey,
  payload = {},
  execute,
}: RunJobInput<T>): Promise<{ alreadyCompleted: boolean; result: T | null }> {
  const { data: existing } = await supabase
    .from("jobs")
    .select("id, status")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing?.status === "succeeded") {
    return { alreadyCompleted: true, result: null };
  }

  const { data: job, error: insertError } = existing
    ? { data: existing, error: null }
    : await supabase
        .from("jobs")
        .insert({
          case_id: caseId,
          kind,
          idempotency_key: idempotencyKey,
          payload,
          status: "running",
        })
        .select("id")
        .single();

  if (insertError || !job) {
    throw new Error(`Failed to create job '${kind}' for case ${caseId}: ${insertError?.message}`);
  }

  await supabase.from("jobs").update({ status: "running" }).eq("id", job.id);

  try {
    const result = await execute();
    await supabase.from("jobs").update({ status: "succeeded" }).eq("id", job.id);
    return { alreadyCompleted: false, result };
  } catch (error) {
    await supabase
      .from("jobs")
      .update({
        status: "failed",
        last_error: error instanceof Error ? error.message : String(error),
        attempts: 1,
      })
      .eq("id", job.id);
    throw error;
  }
}
