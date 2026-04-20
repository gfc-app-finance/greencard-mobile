create table if not exists public.funding_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id text not null,
  amount numeric(18,2) not null check (amount > 0),
  currency text not null
    check (currency in ('NGN', 'USD', 'GBP', 'EUR')),
  status text not null default 'initiated'
    check (status in ('initiated', 'pending', 'completed', 'failed')),
  reference text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.transfer_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_account_id text not null,
  destination_account_id text not null,
  source_currency text not null
    check (source_currency in ('NGN', 'USD', 'GBP', 'EUR')),
  destination_currency text not null
    check (destination_currency in ('NGN', 'USD', 'GBP', 'EUR')),
  source_amount numeric(18,2) not null check (source_amount > 0),
  destination_amount numeric(18,2) not null check (destination_amount > 0),
  fx_rate numeric(18,6),
  status text not null default 'initiated'
    check (status in ('initiated', 'converting', 'completed', 'failed')),
  reference text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_account_id text not null,
  recipient_reference text not null,
  payment_type text not null
    check (payment_type in ('bank', 'international')),
  amount numeric(18,2) not null check (amount > 0),
  currency text not null
    check (currency in ('NGN', 'USD', 'GBP', 'EUR')),
  fee numeric(18,2) not null default 0,
  fx_rate numeric(18,6),
  total_amount numeric(18,2) not null check (total_amount >= amount),
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'processing', 'completed', 'failed')),
  reference text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_funding_transactions_user_id on public.funding_transactions(user_id);
create index if not exists idx_funding_transactions_created_at on public.funding_transactions(user_id, created_at desc);
create index if not exists idx_transfer_transactions_user_id on public.transfer_transactions(user_id);
create index if not exists idx_transfer_transactions_created_at on public.transfer_transactions(user_id, created_at desc);
create index if not exists idx_payment_transactions_user_id on public.payment_transactions(user_id);
create index if not exists idx_payment_transactions_created_at on public.payment_transactions(user_id, created_at desc);

create or replace function public.set_transactions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_funding_transactions_set_updated_at on public.funding_transactions;
create trigger trg_funding_transactions_set_updated_at
before update on public.funding_transactions
for each row
execute function public.set_transactions_updated_at();

drop trigger if exists trg_transfer_transactions_set_updated_at on public.transfer_transactions;
create trigger trg_transfer_transactions_set_updated_at
before update on public.transfer_transactions
for each row
execute function public.set_transactions_updated_at();

drop trigger if exists trg_payment_transactions_set_updated_at on public.payment_transactions;
create trigger trg_payment_transactions_set_updated_at
before update on public.payment_transactions
for each row
execute function public.set_transactions_updated_at();

alter table public.funding_transactions enable row level security;
alter table public.transfer_transactions enable row level security;
alter table public.payment_transactions enable row level security;
