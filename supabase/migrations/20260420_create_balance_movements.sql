create table if not exists public.account_balance_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  linked_entity_type text not null
    check (linked_entity_type in ('funding_transaction', 'transfer_transaction', 'payment_transaction')),
  linked_entity_id text not null,
  movement_type text not null
    check (movement_type in ('funding_credit', 'transfer_debit', 'transfer_credit', 'payment_debit', 'reversal')),
  direction text not null
    check (direction in ('credit', 'debit')),
  amount numeric(18,2) not null check (amount > 0),
  currency text not null
    check (currency in ('NGN', 'USD', 'GBP', 'EUR')),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists uq_account_balance_movements_effect
  on public.account_balance_movements(account_id, linked_entity_type, linked_entity_id, movement_type);

create index if not exists idx_account_balance_movements_user_created_at
  on public.account_balance_movements(user_id, created_at desc);

create index if not exists idx_account_balance_movements_account_created_at
  on public.account_balance_movements(account_id, created_at desc);

alter table public.account_balance_movements enable row level security;

create or replace function public.apply_funding_completion(
  p_user_id uuid,
  p_transaction_id uuid,
  p_status_source text default 'system',
  p_status_reason text default null
)
returns setof public.funding_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  txn public.funding_transactions%rowtype;
  normalized_source text;
  normalized_reason text;
  existing_movements integer := 0;
  inserted_movement_id uuid;
begin
  normalized_source := lower(nullif(trim(coalesce(p_status_source, '')), ''));
  if normalized_source is null then
    normalized_source := 'system';
  end if;
  normalized_reason := nullif(trim(coalesce(p_status_reason, '')), '');

  select *
    into txn
  from public.funding_transactions
  where id = p_transaction_id
    and user_id = p_user_id
  for update;

  if not found then
    raise exception 'transaction_not_found';
  end if;

  if txn.status not in ('pending', 'completed') then
    raise exception 'invalid_transaction_transition';
  end if;

  perform 1
  from public.accounts
  where id = txn.account_id::uuid
    and user_id = p_user_id
    and currency = txn.currency
  for update;

  if not found then
    raise exception 'account_not_found';
  end if;

  select count(*)
    into existing_movements
  from public.account_balance_movements
  where linked_entity_type = 'funding_transaction'
    and linked_entity_id = txn.id::text
    and movement_type = 'funding_credit';

  if existing_movements > 1 then
    raise exception 'movement_state_conflict';
  end if;

  if txn.status <> 'completed'
     or txn.status_source is distinct from normalized_source
     or txn.status_reason is distinct from normalized_reason then
    update public.funding_transactions
      set status = 'completed',
          status_source = normalized_source,
          status_reason = normalized_reason,
          updated_at = timezone('utc', now())
    where id = txn.id
    returning * into txn;
  end if;

  insert into public.account_balance_movements (
    user_id,
    account_id,
    linked_entity_type,
    linked_entity_id,
    movement_type,
    direction,
    amount,
    currency
  ) values (
    p_user_id,
    txn.account_id::uuid,
    'funding_transaction',
    txn.id::text,
    'funding_credit',
    'credit',
    txn.amount,
    txn.currency
  )
  on conflict (account_id, linked_entity_type, linked_entity_id, movement_type) do nothing
  returning id into inserted_movement_id;

  if inserted_movement_id is not null then
    update public.accounts
      set balance = round((balance + txn.amount)::numeric, 2),
          available_balance = round((available_balance + txn.amount)::numeric, 2),
          updated_at = timezone('utc', now())
    where id = txn.account_id::uuid
      and user_id = p_user_id;
  end if;

  return query
    select *
    from public.funding_transactions
    where id = txn.id;
end;
$$;

create or replace function public.apply_transfer_completion(
  p_user_id uuid,
  p_transaction_id uuid,
  p_status_source text default 'system',
  p_status_reason text default null
)
returns setof public.transfer_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  txn public.transfer_transactions%rowtype;
  source_account public.accounts%rowtype;
  destination_account public.accounts%rowtype;
  normalized_source text;
  normalized_reason text;
  existing_movements integer := 0;
  debit_movement_id uuid;
  credit_movement_id uuid;
begin
  normalized_source := lower(nullif(trim(coalesce(p_status_source, '')), ''));
  if normalized_source is null then
    normalized_source := 'system';
  end if;
  normalized_reason := nullif(trim(coalesce(p_status_reason, '')), '');

  select *
    into txn
  from public.transfer_transactions
  where id = p_transaction_id
    and user_id = p_user_id
  for update;

  if not found then
    raise exception 'transaction_not_found';
  end if;

  if txn.status not in ('converting', 'completed') then
    raise exception 'invalid_transaction_transition';
  end if;

  perform 1
  from public.accounts
  where user_id = p_user_id
    and id in (txn.source_account_id::uuid, txn.destination_account_id::uuid)
  order by id
  for update;

  select *
    into source_account
  from public.accounts
  where id = txn.source_account_id::uuid
    and user_id = p_user_id;

  select *
    into destination_account
  from public.accounts
  where id = txn.destination_account_id::uuid
    and user_id = p_user_id;

  if source_account.id is null or destination_account.id is null then
    raise exception 'account_not_found';
  end if;

  if source_account.currency <> txn.source_currency or destination_account.currency <> txn.destination_currency then
    raise exception 'currency_mismatch';
  end if;

  select count(*)
    into existing_movements
  from public.account_balance_movements
  where linked_entity_type = 'transfer_transaction'
    and linked_entity_id = txn.id::text
    and movement_type in ('transfer_debit', 'transfer_credit');

  if existing_movements not in (0, 2) then
    raise exception 'movement_state_conflict';
  end if;

  if existing_movements = 0 and (source_account.balance < txn.source_amount or source_account.available_balance < txn.source_amount) then
    raise exception 'insufficient_funds';
  end if;

  if txn.status <> 'completed'
     or txn.status_source is distinct from normalized_source
     or txn.status_reason is distinct from normalized_reason then
    update public.transfer_transactions
      set status = 'completed',
          status_source = normalized_source,
          status_reason = normalized_reason,
          updated_at = timezone('utc', now())
    where id = txn.id
    returning * into txn;
  end if;

  if existing_movements = 0 then
    insert into public.account_balance_movements (
      user_id,
      account_id,
      linked_entity_type,
      linked_entity_id,
      movement_type,
      direction,
      amount,
      currency
    ) values (
      p_user_id,
      source_account.id,
      'transfer_transaction',
      txn.id::text,
      'transfer_debit',
      'debit',
      txn.source_amount,
      txn.source_currency
    )
    on conflict (account_id, linked_entity_type, linked_entity_id, movement_type) do nothing
    returning id into debit_movement_id;

    insert into public.account_balance_movements (
      user_id,
      account_id,
      linked_entity_type,
      linked_entity_id,
      movement_type,
      direction,
      amount,
      currency
    ) values (
      p_user_id,
      destination_account.id,
      'transfer_transaction',
      txn.id::text,
      'transfer_credit',
      'credit',
      txn.destination_amount,
      txn.destination_currency
    )
    on conflict (account_id, linked_entity_type, linked_entity_id, movement_type) do nothing
    returning id into credit_movement_id;

    if debit_movement_id is null or credit_movement_id is null then
      raise exception 'movement_state_conflict';
    end if;

    update public.accounts
      set balance = round((balance - txn.source_amount)::numeric, 2),
          available_balance = round((available_balance - txn.source_amount)::numeric, 2),
          updated_at = timezone('utc', now())
    where id = source_account.id
      and user_id = p_user_id;

    update public.accounts
      set balance = round((balance + txn.destination_amount)::numeric, 2),
          available_balance = round((available_balance + txn.destination_amount)::numeric, 2),
          updated_at = timezone('utc', now())
    where id = destination_account.id
      and user_id = p_user_id;
  end if;

  return query
    select *
    from public.transfer_transactions
    where id = txn.id;
end;
$$;

create or replace function public.apply_payment_completion(
  p_user_id uuid,
  p_transaction_id uuid,
  p_status_source text default 'system',
  p_status_reason text default null
)
returns setof public.payment_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  txn public.payment_transactions%rowtype;
  source_account public.accounts%rowtype;
  normalized_source text;
  normalized_reason text;
  existing_movements integer := 0;
  inserted_movement_id uuid;
begin
  normalized_source := lower(nullif(trim(coalesce(p_status_source, '')), ''));
  if normalized_source is null then
    normalized_source := 'system';
  end if;
  normalized_reason := nullif(trim(coalesce(p_status_reason, '')), '');

  select *
    into txn
  from public.payment_transactions
  where id = p_transaction_id
    and user_id = p_user_id
  for update;

  if not found then
    raise exception 'transaction_not_found';
  end if;

  if txn.status not in ('processing', 'completed') then
    raise exception 'invalid_transaction_transition';
  end if;

  select *
    into source_account
  from public.accounts
  where id = txn.source_account_id::uuid
    and user_id = p_user_id
  for update;

  if not found then
    raise exception 'account_not_found';
  end if;

  if source_account.currency <> txn.currency then
    raise exception 'currency_mismatch';
  end if;

  select count(*)
    into existing_movements
  from public.account_balance_movements
  where linked_entity_type = 'payment_transaction'
    and linked_entity_id = txn.id::text
    and movement_type = 'payment_debit';

  if existing_movements > 1 then
    raise exception 'movement_state_conflict';
  end if;

  if existing_movements = 0 and (source_account.balance < txn.total_amount or source_account.available_balance < txn.total_amount) then
    raise exception 'insufficient_funds';
  end if;

  if txn.status <> 'completed'
     or txn.status_source is distinct from normalized_source
     or txn.status_reason is distinct from normalized_reason then
    update public.payment_transactions
      set status = 'completed',
          status_source = normalized_source,
          status_reason = normalized_reason,
          updated_at = timezone('utc', now())
    where id = txn.id
    returning * into txn;
  end if;

  insert into public.account_balance_movements (
    user_id,
    account_id,
    linked_entity_type,
    linked_entity_id,
    movement_type,
    direction,
    amount,
    currency
  ) values (
    p_user_id,
    source_account.id,
    'payment_transaction',
    txn.id::text,
    'payment_debit',
    'debit',
    txn.total_amount,
    txn.currency
  )
  on conflict (account_id, linked_entity_type, linked_entity_id, movement_type) do nothing
  returning id into inserted_movement_id;

  if inserted_movement_id is not null then
    update public.accounts
      set balance = round((balance - txn.total_amount)::numeric, 2),
          available_balance = round((available_balance - txn.total_amount)::numeric, 2),
          updated_at = timezone('utc', now())
    where id = source_account.id
      and user_id = p_user_id;
  end if;

  return query
    select *
    from public.payment_transactions
    where id = txn.id;
end;
$$;
