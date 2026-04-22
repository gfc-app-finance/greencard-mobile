create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  source text not null default 'system',
  metadata_summary jsonb not null default '{}'::jsonb,
  request_id text,
  ip_summary text,
  provider text,
  correlation_id text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_user_id_created_at_idx
  on public.audit_logs (actor_user_id, created_at desc);

create index if not exists audit_logs_entity_created_at_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);

create index if not exists audit_logs_action_created_at_idx
  on public.audit_logs (action, created_at desc);

create index if not exists audit_logs_provider_correlation_idx
  on public.audit_logs (provider, correlation_id)
  where provider is not null and correlation_id is not null;

alter table public.audit_logs enable row level security;

comment on table public.audit_logs is
  'Durable audit/compliance event trail. Read/write through the backend service role only.';
