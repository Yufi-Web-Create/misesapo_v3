-- Core schema for misesapo v3
-- All tables carry an explicit tenant boundary (organization_id / store_id / case_id)
-- so that RLS (next migration) can enforce isolation.

create extension if not exists pgcrypto;

-- =========================================
-- Enums
-- =========================================
create type user_role as enum ('customer', 'admin');

create type case_status as enum (
  'inquiry_received',
  'gathering_info',
  'awaiting_customer_reply',
  'structuring_requirements',
  'awaiting_quote_approval',
  'awaiting_client_approval',
  'preparing_production',
  'in_production',
  'in_qa',
  'in_revision',
  'awaiting_admin_decision',
  'awaiting_final_approval',
  'client_reviewing',
  'awaiting_acceptance',
  'awaiting_delivery_approval',
  'delivered',
  'on_hold',
  'failed',
  'cancelled'
);

create type deliverable_version_status as enum (
  'DRAFT',
  'AI_QA',
  'ADMIN_REVIEW',
  'CLIENT_REVIEW',
  'CHANGE_REQUESTED',
  'CLIENT_APPROVED',
  'READY_TO_PUBLISH',
  'PUBLISHED',
  'ARCHIVED'
);

create type conversation_channel as enum ('customer', 'admin_internal');
create type message_sender_type as enum ('customer', 'admin', 'ai', 'system');
create type job_status as enum ('pending', 'running', 'succeeded', 'failed', 'needs_approval');
create type approval_status as enum ('pending', 'approved', 'rejected');
create type attention_reason as enum (
  'needs_admin_approval',
  'unread_customer_message',
  'ai_needs_decision',
  'failed',
  'qa_limit_reached',
  'deadline_risk',
  'pending_money_decision'
);

-- =========================================
-- updated_at trigger helper
-- =========================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================
-- Organizations / users / memberships / stores
-- =========================================
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'customer',
  display_name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  industry text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete cascade,
  store_id uuid references public.stores (id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  constraint memberships_scope_check check (organization_id is not null or store_id is not null)
);
create index memberships_user_id_idx on public.memberships (user_id);
create index memberships_store_id_idx on public.memberships (store_id);

create table public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index customer_profiles_store_id_idx on public.customer_profiles (store_id);

-- =========================================
-- Cases and state machine
-- =========================================
create table public.cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  title text not null,
  status case_status not null default 'inquiry_received',
  priority text not null default 'normal',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cases_store_id_idx on public.cases (store_id);
create index cases_status_idx on public.cases (status);

create table public.case_state_transitions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  from_status case_status,
  to_status case_status not null,
  actor_user_id uuid references public.user_profiles (id),
  reason text,
  related_task_id uuid,
  related_approval_id uuid,
  created_at timestamptz not null default now()
);
create index case_state_transitions_case_id_idx on public.case_state_transitions (case_id);

create table public.requirements (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  summary text not null,
  structured jsonb not null default '{}'::jsonb,
  source_message_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index requirements_case_id_idx on public.requirements (case_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending',
  assignee_agent_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_case_id_idx on public.tasks (case_id);

create table public.task_dependencies (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks (id) on delete cascade
);

-- =========================================
-- Conversations & messages
-- =========================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  channel conversation_channel not null,
  created_at timestamptz not null default now()
);
create index conversations_case_id_idx on public.conversations (case_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  sender_type message_sender_type not null,
  sender_user_id uuid references public.user_profiles (id),
  body text not null,
  structured jsonb,
  created_at timestamptz not null default now()
);
create index messages_conversation_id_idx on public.messages (conversation_id);
create index messages_case_id_idx on public.messages (case_id);

-- =========================================
-- AI agents
-- =========================================
create table public.agent_definitions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  default_model text not null,
  escalation_model text,
  reasoning_effort text not null default 'medium',
  max_cost_per_run_cents integer not null default 100,
  max_retries integer not null default 3,
  enabled boolean not null default true,
  allowed_tools jsonb not null default '[]'::jsonb,
  allowed_data_scopes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  agent_key text not null references public.agent_definitions (key),
  capability text not null,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  status text not null default 'pending',
  cost_cents integer not null default 0,
  latency_ms integer,
  model_used text,
  error text,
  created_at timestamptz not null default now()
);
create index agent_runs_case_id_idx on public.agent_runs (case_id);

create table public.agent_decisions (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid not null references public.agent_runs (id) on delete cascade,
  status text not null,
  assumptions jsonb not null default '[]'::jsonb,
  missing_information jsonb not null default '[]'::jsonb,
  deliverables jsonb not null default '[]'::jsonb,
  acceptance_evidence jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  next_action text,
  created_at timestamptz not null default now()
);

-- =========================================
-- Jobs
-- =========================================
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  kind text not null,
  status job_status not null default 'pending',
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index jobs_case_id_idx on public.jobs (case_id);
create index jobs_status_idx on public.jobs (status);

create table public.job_steps (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  step_order integer not null,
  kind text not null,
  status job_status not null default 'pending',
  result jsonb,
  retries integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index job_steps_job_id_idx on public.job_steps (job_id);

-- =========================================
-- Approvals
-- =========================================
create table public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  kind text not null,
  target_type text not null,
  target_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  status approval_status not null default 'pending',
  requested_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index approval_requests_case_id_idx on public.approval_requests (case_id);

create table public.approval_decisions (
  id uuid primary key default gen_random_uuid(),
  approval_request_id uuid not null references public.approval_requests (id) on delete cascade,
  decision approval_status not null,
  decided_by_user_id uuid references public.user_profiles (id),
  reason text,
  created_at timestamptz not null default now()
);

-- =========================================
-- Quotes / contracts / payments
-- =========================================
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  amount_cents integer not null,
  currency text not null default 'JPY',
  scope_summary text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quotes_case_id_idx on public.quotes (case_id);

create table public.contract_scopes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  quote_id uuid references public.quotes (id),
  max_revisions integer not null default 3,
  revisions_used integer not null default 0,
  deadline_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases (id) on delete set null,
  store_id uuid not null references public.stores (id) on delete cascade,
  plan text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_records (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  quote_id uuid references public.quotes (id),
  provider text not null,
  provider_event_id text not null unique,
  amount_cents integer not null,
  currency text not null default 'JPY',
  status text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index payment_records_case_id_idx on public.payment_records (case_id);

-- =========================================
-- Deliverables / previews / comments
-- =========================================
create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  kind text not null,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index deliverables_case_id_idx on public.deliverables (case_id);

create table public.deliverable_versions (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references public.deliverables (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  version_number integer not null,
  status deliverable_version_status not null default 'DRAFT',
  content jsonb not null default '{}'::jsonb,
  produced_by_agent_run_id uuid references public.agent_runs (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique (deliverable_id, version_number)
);
create index deliverable_versions_case_id_idx on public.deliverable_versions (case_id);
create index deliverable_versions_deliverable_id_idx on public.deliverable_versions (deliverable_id);

create table public.preview_deployments (
  id uuid primary key default gen_random_uuid(),
  deliverable_version_id uuid not null references public.deliverable_versions (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.preview_shares (
  id uuid primary key default gen_random_uuid(),
  deliverable_version_id uuid not null references public.deliverable_versions (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index preview_shares_case_id_idx on public.preview_shares (case_id);

create table public.review_comments (
  id uuid primary key default gen_random_uuid(),
  deliverable_version_id uuid not null references public.deliverable_versions (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  author_user_id uuid references public.user_profiles (id),
  author_type text not null,
  anchor jsonb not null,
  text text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index review_comments_case_id_idx on public.review_comments (case_id);

-- =========================================
-- Files
-- =========================================
create table public.file_assets (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  uploaded_by_user_id uuid references public.user_profiles (id),
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null,
  created_at timestamptz not null default now()
);
create index file_assets_case_id_idx on public.file_assets (case_id);

-- =========================================
-- Notifications & attention items
-- =========================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  case_id uuid references public.cases (id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_id_idx on public.notifications (user_id);

create table public.attention_items (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  reason attention_reason not null,
  detail text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index attention_items_case_id_idx on public.attention_items (case_id);
create index attention_items_unresolved_idx on public.attention_items (case_id) where resolved_at is null;

-- =========================================
-- Audit & usage
-- =========================================
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.user_profiles (id),
  action text not null,
  target_type text not null,
  target_id uuid,
  case_id uuid references public.cases (id) on delete set null,
  reason text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_case_id_idx on public.audit_logs (case_id);

create table public.usage_records (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  agent_run_id uuid references public.agent_runs (id),
  tokens_input integer not null default 0,
  tokens_output integer not null default 0,
  cost_cents integer not null default 0,
  created_at timestamptz not null default now()
);
create index usage_records_case_id_idx on public.usage_records (case_id);

create table public.system_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- =========================================
-- updated_at triggers
-- =========================================
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'organizations', 'user_profiles', 'stores', 'customer_profiles', 'cases',
      'requirements', 'tasks', 'agent_definitions', 'jobs', 'job_steps',
      'approval_requests', 'quotes', 'contract_scopes', 'subscriptions',
      'deliverables', 'deliverable_versions'
    ])
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end $$;
