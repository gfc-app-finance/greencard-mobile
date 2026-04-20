create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null
    check (
      type in (
        'funding_created',
        'funding_completed',
        'funding_failed',
        'transfer_created',
        'transfer_completed',
        'transfer_failed',
        'payment_created',
        'payment_processing',
        'payment_completed',
        'payment_failed',
        'ticket_created',
        'ticket_updated',
        'ticket_resolved',
        'account_created'
      )
    ),
  title text not null,
  subtitle text,
  amount numeric(18,2),
  currency text
    check (currency is null or currency in ('NGN', 'USD', 'GBP', 'EUR')),
  status text not null
    check (
      status in (
        'initiated',
        'pending',
        'completed',
        'failed',
        'submitted',
        'under_review',
        'processing',
        'converting',
        'open',
        'investigating',
        'resolved',
        'closed'
      )
    ),
  linked_entity_type text not null
    check (
      linked_entity_type in (
        'funding_transaction',
        'transfer_transaction',
        'payment_transaction',
        'support_ticket',
        'account'
      )
    ),
  linked_entity_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists uq_activities_user_entity
  on public.activities(user_id, linked_entity_type, linked_entity_id);

create index if not exists idx_activities_user_updated_at
  on public.activities(user_id, updated_at desc, created_at desc);

create or replace function public.set_activities_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_activities_set_updated_at on public.activities;

create trigger trg_activities_set_updated_at
before update on public.activities
for each row
execute function public.set_activities_updated_at();

alter table public.activities enable row level security;
