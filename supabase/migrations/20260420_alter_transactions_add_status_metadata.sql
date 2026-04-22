alter table public.funding_transactions
  add column if not exists status_reason text,
  add column if not exists status_source text
    check (status_source in ('system', 'simulation', 'provider', 'manual'));

alter table public.transfer_transactions
  add column if not exists status_reason text,
  add column if not exists status_source text
    check (status_source in ('system', 'simulation', 'provider', 'manual'));

alter table public.payment_transactions
  add column if not exists status_reason text,
  add column if not exists status_source text
    check (status_source in ('system', 'simulation', 'provider', 'manual'));
