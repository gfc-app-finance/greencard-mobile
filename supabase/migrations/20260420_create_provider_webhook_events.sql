create unique index if not exists uq_funding_transactions_reference
  on public.funding_transactions(reference);

create unique index if not exists uq_transfer_transactions_reference
  on public.transfer_transactions(reference);

create unique index if not exists uq_payment_transactions_reference
  on public.payment_transactions(reference);

create table if not exists public.provider_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  linked_entity_type text
    check (linked_entity_type in ('funding_transaction', 'transfer_transaction', 'payment_transaction')),
  linked_entity_id text,
  linked_reference text,
  processing_status text not null
    check (processing_status in ('received', 'processed', 'failed')),
  status_message text,
  received_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists uq_provider_webhook_events_provider_event
  on public.provider_webhook_events(provider, event_id);

create index if not exists idx_provider_webhook_events_received_at
  on public.provider_webhook_events(received_at desc);

create index if not exists idx_provider_webhook_events_linked_reference
  on public.provider_webhook_events(linked_reference);

create or replace function public.set_provider_webhook_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_provider_webhook_events_set_updated_at on public.provider_webhook_events;

create trigger trg_provider_webhook_events_set_updated_at
before update on public.provider_webhook_events
for each row
execute function public.set_provider_webhook_events_updated_at();

alter table public.provider_webhook_events enable row level security;
