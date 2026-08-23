import type { CaseStatus } from "./case";

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  inquiry_received: "相談受付",
  gathering_info: "情報収集中",
  awaiting_customer_reply: "お客様の回答待ち",
  structuring_requirements: "要件整理中",
  awaiting_quote_approval: "見積作成・承認待ち",
  awaiting_client_approval: "お客様の承認待ち",
  preparing_production: "制作準備中",
  in_production: "制作中",
  in_qa: "品質検査中",
  in_revision: "修正中",
  awaiting_admin_decision: "運営者の判断待ち",
  awaiting_final_approval: "最終承認待ち",
  client_reviewing: "お客様確認中",
  awaiting_acceptance: "検収待ち",
  awaiting_delivery_approval: "納品承認待ち",
  delivered: "納品済み",
  on_hold: "一時停止中",
  failed: "失敗",
  cancelled: "キャンセル",
};
