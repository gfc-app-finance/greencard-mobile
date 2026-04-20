create table if not exists public.recipients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null
    check (type in ('bank', 'international_bank')),
  full_name text not null,
  bank_name text not null,
  account_number text,
  iban text,
  routing_number text,
  sort_code text,
  swift_code text,
  country text not null,
  currency text not null
    check (currency in ('NGN', 'USD', 'GBP', 'EUR')),
  nickname text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_recipients_user_created_at
  on public.recipients(user_id, created_at desc);

create or replace function public.set_recipients_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_recipients_set_updated_at on public.recipients;

create trigger trg_recipients_set_updated_at
before update on public.recipients
for each row
execute function public.set_recipients_updated_at();

alter table public.recipients enable row level security;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  issue_type text not null
    check (
      issue_type in (
        'payment_failed',
        'delayed_payment',
        'transfer_issue',
        'funding_issue',
        'account_issue',
        'card_issue',
        'other'
      )
    ),
  description text not null,
  status text not null default 'open'
    check (status in ('open', 'investigating', 'resolved', 'closed')),
  linked_entity_type text
    check (linked_entity_type is null or linked_entity_type in ('funding_transaction', 'transfer_transaction', 'payment_transaction')),
  linked_entity_id text,
  priority text
    check (priority is null or priority in ('low', 'normal', 'high')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (linked_entity_type is null and linked_entity_id is null)
    or
    (linked_entity_type is not null and linked_entity_id is not null)
  )
);

create index if not exists idx_support_tickets_user_created_at
  on public.support_tickets(user_id, created_at desc);

create index if not exists idx_support_tickets_user_status
  on public.support_tickets(user_id, status);

create or replace function public.set_support_tickets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_support_tickets_set_updated_at on public.support_tickets;

create trigger trg_support_tickets_set_updated_at
before update on public.support_tickets
for each row
execute function public.set_support_tickets_updated_at();

alter table public.support_tickets enable row level security;

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_type text not null
    check (sender_type in ('user', 'support')),
  message text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_support_ticket_messages_ticket_created_at
  on public.support_ticket_messages(ticket_id, created_at asc);

alter table public.support_ticket_messages enable row level security;
