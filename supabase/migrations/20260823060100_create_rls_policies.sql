-- Row Level Security for misesapo v3
--
-- Design:
-- - The browser only ever uses the anon/publishable key and is therefore always
--   subject to these policies (authenticated role = logged-in browser session).
-- - Tables that hold system-of-record status/money/audit data (cases.status,
--   approval_requests/decisions, payment_records, audit_logs, case_state_transitions,
--   agent_runs/decisions, jobs/job_steps) intentionally get NO insert/update policy
--   for the `authenticated` role. Those rows can only be written by the service-role
--   client, which is used exclusively from Server Actions after the state-machine /
--   authorization checks in lib/state-machine and lib/auth have run. This keeps
--   "no direct status UPDATE outside the allow-list" enforced at the DB layer, not
--   just in application code.
-- - Tables that are genuinely customer/admin authored (messages, review_comments,
--   file_assets, customer_profiles) get scoped insert/select policies so the app can
--   also write them through the RLS-checked path when no elevated privilege is needed.

create schema if not exists private;

-- ---------- helper functions (security definer, not exposed via PostgREST) ----------

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.role = 'admin'
  );
$$;

create or replace function private.accessible_store_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select store_id from public.memberships
  where user_id = auth.uid() and store_id is not null;
$$;

create or replace function private.is_store_member(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.is_admin() or p_store_id in (select private.accessible_store_ids());
$$;

create or replace function private.is_case_participant(p_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.is_admin() or exists (
    select 1 from public.cases c
    where c.id = p_case_id
      and c.store_id in (select private.accessible_store_ids())
  );
$$;

-- prevent a customer from self-escalating role via the RLS-permitted profile update
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    raise exception 'role changes must go through a privileged server action';
  end if;
  return new;
end;
$$;

create trigger user_profiles_prevent_role_escalation
  before update on public.user_profiles
  for each row execute function public.prevent_role_self_escalation();

-- ---------- enable RLS everywhere ----------

alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.stores enable row level security;
alter table public.memberships enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.cases enable row level security;
alter table public.case_state_transitions enable row level security;
alter table public.requirements enable row level security;
alter table public.tasks enable row level security;
alter table public.task_dependencies enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.agent_definitions enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_decisions enable row level security;
alter table public.jobs enable row level security;
alter table public.job_steps enable row level security;
alter table public.approval_requests enable row level security;
alter table public.approval_decisions enable row level security;
alter table public.quotes enable row level security;
alter table public.contract_scopes enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_records enable row level security;
alter table public.deliverables enable row level security;
alter table public.deliverable_versions enable row level security;
alter table public.preview_deployments enable row level security;
alter table public.preview_shares enable row level security;
alter table public.review_comments enable row level security;
alter table public.file_assets enable row level security;
alter table public.notifications enable row level security;
alter table public.attention_items enable row level security;
alter table public.audit_logs enable row level security;
alter table public.usage_records enable row level security;
alter table public.system_settings enable row level security;

-- ---------- organizations: admin only ----------
create policy organizations_select_admin on public.organizations
  for select using (private.is_admin());

-- ---------- user_profiles: self or admin ----------
create policy user_profiles_select_self_or_admin on public.user_profiles
  for select using (id = auth.uid() or private.is_admin());
create policy user_profiles_update_self_or_admin on public.user_profiles
  for update using (id = auth.uid() or private.is_admin());

-- ---------- stores: members (customer) or admin ----------
create policy stores_select_member_or_admin on public.stores
  for select using (private.is_store_member(id));

-- ---------- memberships: own rows or admin ----------
create policy memberships_select_self_or_admin on public.memberships
  for select using (user_id = auth.uid() or private.is_admin());

-- ---------- customer_profiles: own or admin, self update ----------
create policy customer_profiles_select_self_or_admin on public.customer_profiles
  for select using (user_id = auth.uid() or private.is_admin());
create policy customer_profiles_update_self_or_admin on public.customer_profiles
  for update using (user_id = auth.uid() or private.is_admin());

-- ---------- cases: participants only, no client-side writes ----------
create policy cases_select_participant on public.cases
  for select using (private.is_case_participant(id));

-- ---------- case_state_transitions: read-only for participants ----------
create policy case_state_transitions_select_participant on public.case_state_transitions
  for select using (private.is_case_participant(case_id));

-- ---------- requirements: read-only for participants ----------
create policy requirements_select_participant on public.requirements
  for select using (private.is_case_participant(case_id));

-- ---------- tasks / task_dependencies: read-only for participants ----------
create policy tasks_select_participant on public.tasks
  for select using (private.is_case_participant(case_id));
create policy task_dependencies_select_participant on public.task_dependencies
  for select using (
    exists (select 1 from public.tasks t where t.id = task_id and private.is_case_participant(t.case_id))
  );

-- ---------- conversations: participants, channel-gated ----------
create policy conversations_select_scoped on public.conversations
  for select using (
    private.is_case_participant(case_id)
    and (channel = 'customer' or private.is_admin())
  );

-- ---------- messages: channel-gated read; customer/admin authored insert ----------
create policy messages_select_scoped on public.messages
  for select using (
    exists (
      select 1 from public.conversations conv
      where conv.id = conversation_id
        and private.is_case_participant(conv.case_id)
        and (conv.channel = 'customer' or private.is_admin())
    )
  );
create policy messages_insert_customer on public.messages
  for insert with check (
    sender_type = 'customer'
    and sender_user_id = auth.uid()
    and exists (
      select 1 from public.conversations conv
      where conv.id = conversation_id
        and conv.case_id = case_id
        and conv.channel = 'customer'
        and private.is_case_participant(conv.case_id)
    )
  );
create policy messages_insert_admin on public.messages
  for insert with check (
    sender_type = 'admin'
    and sender_user_id = auth.uid()
    and private.is_admin()
    and exists (select 1 from public.conversations conv where conv.id = conversation_id and conv.case_id = case_id)
  );

-- ---------- agent_definitions: admin manages, participants can read enabled ones ----------
create policy agent_definitions_select_all_authenticated on public.agent_definitions
  for select using (auth.uid() is not null);

-- agent_runs / agent_decisions / jobs / job_steps: server-only writes, participant read
create policy agent_runs_select_participant on public.agent_runs
  for select using (private.is_case_participant(case_id));
create policy agent_decisions_select_participant on public.agent_decisions
  for select using (
    exists (select 1 from public.agent_runs r where r.id = agent_run_id and private.is_case_participant(r.case_id))
  );
create policy jobs_select_participant on public.jobs
  for select using (private.is_case_participant(case_id));
create policy job_steps_select_participant on public.job_steps
  for select using (
    exists (select 1 from public.jobs j where j.id = job_id and private.is_case_participant(j.case_id))
  );

-- ---------- approvals: participant read, server-only writes ----------
create policy approval_requests_select_participant on public.approval_requests
  for select using (private.is_case_participant(case_id));
create policy approval_decisions_select_participant on public.approval_decisions
  for select using (
    exists (
      select 1 from public.approval_requests ar
      where ar.id = approval_request_id and private.is_case_participant(ar.case_id)
    )
  );

-- ---------- money: participant read, server-only writes ----------
create policy quotes_select_participant on public.quotes
  for select using (private.is_case_participant(case_id));
create policy contract_scopes_select_participant on public.contract_scopes
  for select using (private.is_case_participant(case_id));
create policy subscriptions_select_member_or_admin on public.subscriptions
  for select using (private.is_store_member(store_id));
create policy payment_records_select_participant on public.payment_records
  for select using (private.is_case_participant(case_id));

-- ---------- deliverables / versions / previews: participant read, server-only writes ----------
create policy deliverables_select_participant on public.deliverables
  for select using (private.is_case_participant(case_id));
create policy deliverable_versions_select_participant on public.deliverable_versions
  for select using (private.is_case_participant(case_id));
create policy preview_deployments_select_participant on public.preview_deployments
  for select using (private.is_case_participant(case_id));
create policy preview_shares_select_participant on public.preview_shares
  for select using (private.is_case_participant(case_id));

-- ---------- review_comments: participant read + author insert ----------
create policy review_comments_select_participant on public.review_comments
  for select using (private.is_case_participant(case_id));
create policy review_comments_insert_participant on public.review_comments
  for insert with check (
    author_user_id = auth.uid() and private.is_case_participant(case_id)
  );

-- ---------- file_assets: participant read + uploader insert ----------
create policy file_assets_select_participant on public.file_assets
  for select using (private.is_case_participant(case_id));
create policy file_assets_insert_participant on public.file_assets
  for insert with check (
    uploaded_by_user_id = auth.uid() and private.is_case_participant(case_id)
  );

-- ---------- notifications: own rows only, self can mark read ----------
create policy notifications_select_self on public.notifications
  for select using (user_id = auth.uid());
create policy notifications_update_self on public.notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- attention_items: participant read (server-only writes) ----------
create policy attention_items_select_participant on public.attention_items
  for select using (private.is_case_participant(case_id));

-- ---------- audit_logs: admin read only ----------
create policy audit_logs_select_admin on public.audit_logs
  for select using (private.is_admin());

-- ---------- usage_records: participant read ----------
create policy usage_records_select_participant on public.usage_records
  for select using (private.is_case_participant(case_id));

-- ---------- system_settings: admin only ----------
create policy system_settings_select_admin on public.system_settings
  for select using (private.is_admin());
