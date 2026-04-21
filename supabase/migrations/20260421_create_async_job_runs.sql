create table if not exists public.async_job_runs (
  id uuid primary key default gen_random_uuid(),
  job_key text not null,
  job_type text not null,
  entity_type text not null,
  entity_id text not null,
  status text not null
    check (status in ('processing', 'succeeded', 'failed', 'abandoned')),
  attempt_count integer not null default 0
    check (attempt_count >= 0),
  max_attempts integer not null default 5
    check (max_attempts > 0),
  last_error text,
  last_processed_at timestamptz,
  locked_until timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists uq_async_job_runs_job_key
  on public.async_job_runs(job_key);

create index if not exists idx_async_job_runs_status_locked_until
  on public.async_job_runs(status, locked_until);

create index if not exists idx_async_job_runs_entity
  on public.async_job_runs(entity_type, entity_id);

create index if not exists idx_async_job_runs_updated_at
  on public.async_job_runs(updated_at desc);

create or replace function public.set_async_job_runs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_async_job_runs_set_updated_at on public.async_job_runs;

create trigger trg_async_job_runs_set_updated_at
before update on public.async_job_runs
for each row
execute function public.set_async_job_runs_updated_at();

create or replace function public.claim_async_job(
  p_job_key text,
  p_job_type text,
  p_entity_type text,
  p_entity_id text,
  p_max_attempts integer,
  p_lock_ttl_seconds integer
)
returns table (
  id uuid,
  job_key text,
  job_type text,
  entity_type text,
  entity_id text,
  status text,
  attempt_count integer,
  max_attempts integer,
  last_error text,
  last_processed_at timestamptz,
  locked_until timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  claimed boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.async_job_runs%rowtype;
  v_now timestamptz := timezone('utc', now());
  v_claimed boolean := false;
  v_max_attempts integer := greatest(coalesce(p_max_attempts, 5), 1);
  v_lock_until timestamptz := v_now + make_interval(secs => greatest(coalesce(p_lock_ttl_seconds, 60), 1));
begin
  if nullif(trim(p_job_key), '') is null
    or nullif(trim(p_job_type), '') is null
    or nullif(trim(p_entity_type), '') is null
    or nullif(trim(p_entity_id), '') is null then
    raise exception 'invalid async job claim request';
  end if;

  insert into public.async_job_runs (
    job_key,
    job_type,
    entity_type,
    entity_id,
    status,
    max_attempts
  )
  values (
    trim(p_job_key),
    trim(p_job_type),
    trim(p_entity_type),
    trim(p_entity_id),
    'failed',
    v_max_attempts
  )
  on conflict (job_key) do nothing;

  select *
    into v_job
    from public.async_job_runs
   where async_job_runs.job_key = trim(p_job_key)
   for update;

  if v_job.status in ('succeeded', 'abandoned') then
    v_claimed := false;
  elsif v_job.status = 'processing'
    and v_job.locked_until is not null
    and v_job.locked_until > v_now then
    v_claimed := false;
  elsif v_job.attempt_count >= v_max_attempts then
    update public.async_job_runs
       set status = 'abandoned',
           max_attempts = v_max_attempts,
           last_error = coalesce(public.async_job_runs.last_error, 'max attempts exceeded'),
           locked_until = null,
           last_processed_at = v_now
     where async_job_runs.job_key = trim(p_job_key)
     returning * into v_job;
    v_claimed := false;
  else
    update public.async_job_runs
       set status = 'processing',
           attempt_count = public.async_job_runs.attempt_count + 1,
           max_attempts = v_max_attempts,
           last_error = null,
           last_processed_at = v_now,
           locked_until = v_lock_until
     where async_job_runs.job_key = trim(p_job_key)
     returning * into v_job;
    v_claimed := true;
  end if;

  return query
  select
    v_job.id,
    v_job.job_key,
    v_job.job_type,
    v_job.entity_type,
    v_job.entity_id,
    v_job.status,
    v_job.attempt_count,
    v_job.max_attempts,
    v_job.last_error,
    v_job.last_processed_at,
    v_job.locked_until,
    v_job.created_at,
    v_job.updated_at,
    v_claimed;
end;
$$;

create or replace function public.complete_async_job(
  p_job_key text,
  p_status text,
  p_message text
)
returns table (
  id uuid,
  job_key text,
  job_type text,
  entity_type text,
  entity_id text,
  status text,
  attempt_count integer,
  max_attempts integer,
  last_error text,
  last_processed_at timestamptz,
  locked_until timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.async_job_runs%rowtype;
  v_now timestamptz := timezone('utc', now());
  v_status text := trim(p_status);
begin
  if nullif(trim(p_job_key), '') is null
    or v_status not in ('processing', 'succeeded', 'failed', 'abandoned') then
    raise exception 'invalid async job completion request';
  end if;

  select *
    into v_job
    from public.async_job_runs
   where async_job_runs.job_key = trim(p_job_key)
   for update;

  if not found then
    raise exception 'async job not found';
  end if;

  if v_job.status in ('succeeded', 'abandoned') then
    return query
    select
      v_job.id,
      v_job.job_key,
      v_job.job_type,
      v_job.entity_type,
      v_job.entity_id,
      v_job.status,
      v_job.attempt_count,
      v_job.max_attempts,
      v_job.last_error,
      v_job.last_processed_at,
      v_job.locked_until,
      v_job.created_at,
      v_job.updated_at;
    return;
  end if;

  update public.async_job_runs
     set status = v_status,
         last_error = case when v_status = 'failed' then nullif(trim(p_message), '') else null end,
         last_processed_at = v_now,
         locked_until = null
   where async_job_runs.job_key = trim(p_job_key)
   returning * into v_job;

  return query
  select
    v_job.id,
    v_job.job_key,
    v_job.job_type,
    v_job.entity_type,
    v_job.entity_id,
    v_job.status,
    v_job.attempt_count,
    v_job.max_attempts,
    v_job.last_error,
    v_job.last_processed_at,
    v_job.locked_until,
    v_job.created_at,
    v_job.updated_at;
end;
$$;

alter table public.async_job_runs enable row level security;
