create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null,
  idempotency_key text not null,
  request_hash text not null,
  response_status integer,
  response_body jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, operation, idempotency_key)
);

create or replace function public.set_idempotency_keys_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_idempotency_keys_set_updated_at on public.idempotency_keys;

create trigger trg_idempotency_keys_set_updated_at
before update on public.idempotency_keys
for each row
execute function public.set_idempotency_keys_updated_at();

alter table public.idempotency_keys enable row level security;
