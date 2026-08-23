import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CaseStatus =
  | "inquiry_received"
  | "gathering_info"
  | "awaiting_customer_reply"
  | "structuring_requirements"
  | "awaiting_quote_approval"
  | "awaiting_client_approval"
  | "preparing_production"
  | "in_production"
  | "in_qa"
  | "in_revision"
  | "awaiting_admin_decision"
  | "awaiting_final_approval"
  | "client_reviewing"
  | "awaiting_acceptance"
  | "awaiting_delivery_approval"
  | "delivered"
  | "on_hold"
  | "failed"
  | "cancelled";

const ALWAYS_ALLOWED_TARGETS: CaseStatus[] = ["on_hold", "failed", "cancelled"];

/**
 * Allow-list of case status transitions (docs/07-state-machines.md). Any
 * transition not listed here is rejected by transitionCase(). `on_hold`,
 * `failed`, and `cancelled` are reachable from every status and are not
 * repeated in each row.
 */
export const CASE_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  inquiry_received: ["gathering_info"],
  gathering_info: ["awaiting_customer_reply", "structuring_requirements"],
  awaiting_customer_reply: ["gathering_info", "structuring_requirements"],
  structuring_requirements: ["awaiting_quote_approval", "awaiting_customer_reply"],
  awaiting_quote_approval: ["awaiting_client_approval"],
  awaiting_client_approval: ["preparing_production", "structuring_requirements"],
  preparing_production: ["in_production"],
  in_production: ["in_qa"],
  in_qa: ["in_revision", "awaiting_admin_decision", "awaiting_final_approval"],
  in_revision: ["in_qa"],
  awaiting_admin_decision: ["in_revision", "awaiting_final_approval", "awaiting_quote_approval"],
  awaiting_final_approval: ["client_reviewing"],
  client_reviewing: ["awaiting_acceptance", "in_revision"],
  awaiting_acceptance: ["awaiting_delivery_approval"],
  awaiting_delivery_approval: ["delivered"],
  delivered: [],
  on_hold: [], // resumes to the status recorded in case_state_transitions.reason at pause time
  failed: [],
  cancelled: [],
};

/**
 * Case transitions that require an ACCEPTED approval_request of the matching
 * kind before transitionCase() will apply them (docs/07-state-machines.md
 * "承認ゲート").
 */
export const CASE_APPROVAL_GATES: Partial<Record<CaseStatus, string>> = {
  preparing_production: "quote_approval",
  client_reviewing: "final_approval",
  delivered: "delivery_approval",
};

export class CaseTransitionError extends Error {}

type TransitionInput = {
  supabase: SupabaseClient;
  caseId: string;
  from: CaseStatus;
  to: CaseStatus;
  actorUserId: string | null;
  reason: string;
};

function isTransitionAllowed(from: CaseStatus, to: CaseStatus): boolean {
  if (ALWAYS_ALLOWED_TARGETS.includes(to)) return true;
  return CASE_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * The only sanctioned way to change cases.status. Must be called with a
 * service-role client (RLS grants no client-side UPDATE on cases.status at
 * all — see the RLS migration), after the caller has already verified the
 * actor is authorized for this case. Enforces the allow-list and, where
 * configured, requires an approved ApprovalRequest of the matching kind
 * before applying a gated transition.
 */
export async function transitionCase({
  supabase,
  caseId,
  from,
  to,
  actorUserId,
  reason,
}: TransitionInput): Promise<void> {
  if (!isTransitionAllowed(from, to)) {
    throw new CaseTransitionError(`Transition ${from} -> ${to} is not allowed`);
  }

  const gateKind = CASE_APPROVAL_GATES[to];
  if (gateKind) {
    const { data: approval } = await supabase
      .from("approval_requests")
      .select("id")
      .eq("case_id", caseId)
      .eq("kind", gateKind)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!approval) {
      throw new CaseTransitionError(
        `Transition ${from} -> ${to} requires an approved '${gateKind}' approval_request`,
      );
    }
  }

  const { data: current, error: readError } = await supabase
    .from("cases")
    .select("status")
    .eq("id", caseId)
    .single();

  if (readError || !current) {
    throw new CaseTransitionError(`Case ${caseId} not found`);
  }
  if (current.status !== from) {
    throw new CaseTransitionError(
      `Case ${caseId} is in status '${current.status}', not '${from}' — refusing stale transition`,
    );
  }

  const { error: updateError } = await supabase
    .from("cases")
    .update({ status: to })
    .eq("id", caseId)
    .eq("status", from);

  if (updateError) {
    throw new CaseTransitionError(updateError.message);
  }

  const { error: logError } = await supabase.from("case_state_transitions").insert({
    case_id: caseId,
    from_status: from,
    to_status: to,
    actor_user_id: actorUserId,
    reason,
  });

  if (logError) {
    throw new CaseTransitionError(logError.message);
  }
}
