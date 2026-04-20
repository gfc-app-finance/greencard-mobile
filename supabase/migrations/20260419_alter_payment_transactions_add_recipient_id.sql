alter table if exists public.payment_transactions
  add column if not exists recipient_id uuid references public.recipients(id) on delete restrict;

create index if not exists idx_payment_transactions_recipient_id
  on public.payment_transactions(recipient_id);
