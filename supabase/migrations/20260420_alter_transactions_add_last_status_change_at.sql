alter table public.funding_transactions
  add column if not exists last_status_change_at timestamptz;

alter table public.transfer_transactions
  add column if not exists last_status_change_at timestamptz;

alter table public.payment_transactions
  add column if not exists last_status_change_at timestamptz;

update public.funding_transactions
set last_status_change_at = coalesce(last_status_change_at, updated_at, created_at)
where last_status_change_at is null;

update public.transfer_transactions
set last_status_change_at = coalesce(last_status_change_at, updated_at, created_at)
where last_status_change_at is null;

update public.payment_transactions
set last_status_change_at = coalesce(last_status_change_at, updated_at, created_at)
where last_status_change_at is null;

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
  transition_time timestamptz := timezone('utc', now());
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
          last_status_change_at = case
            when txn.status <> 'completed' then transition_time
            else coalesce(txn.last_status_change_at, txn.updated_at, txn.created_at, transition_time)
          end,
          updated_at = transition_time
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
          updated_at = transition_time
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
  transition_time timestamptz := timezone('utc', now());
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
          last_status_change_at = case
            when txn.status <> 'completed' then transition_time
            else coalesce(txn.last_status_change_at, txn.updated_at, txn.created_at, transition_time)
          end,
          updated_at = transition_time
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
          updated_at = transition_time
    where id = source_account.id
      and user_id = p_user_id;

    update public.accounts
      set balance = round((balance + txn.destination_amount)::numeric, 2),
          available_balance = round((available_balance + txn.destination_amount)::numeric, 2),
          updated_at = transition_time
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
  transition_time timestamptz := timezone('utc', now());
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
          last_status_change_at = case
            when txn.status <> 'completed' then transition_time
            else coalesce(txn.last_status_change_at, txn.updated_at, txn.created_at, transition_time)
          end,
          updated_at = transition_time
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
          updated_at = transition_time
    where id = source_account.id
      and user_id = p_user_id;
  end if;

  return query
    select *
    from public.payment_transactions
    where id = txn.id;
end;
$$;
