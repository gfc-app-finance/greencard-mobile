create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  currency text not null
    check (currency in ('NGN', 'USD', 'GBP', 'EUR')),
  account_type text not null default 'personal',
  display_name text not null,
  balance numeric(18,2) not null default 0,
  available_balance numeric(18,2) not null default 0,
  masked_identifier text,
  provider text not null default 'Greencard',
  status text not null default 'active'
    check (status in ('pending', 'active', 'restricted')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_accounts_user_id on public.accounts(user_id);
create index if not exists idx_accounts_user_currency on public.accounts(user_id, currency);

create or replace function public.set_accounts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_accounts_set_updated_at on public.accounts;

create trigger trg_accounts_set_updated_at
before update on public.accounts
for each row
execute function public.set_accounts_updated_at();

alter table public.accounts enable row level security;
