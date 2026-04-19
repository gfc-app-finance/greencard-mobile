create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  date_of_birth date,
  residential_address text,
  nationality text,
  verification_status text not null default 'basic'
    check (
      verification_status in (
        'basic',
        'profile_completed',
        'verified',
        'under_review',
        'restricted'
      )
    ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;

create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

alter table public.profiles enable row level security;
