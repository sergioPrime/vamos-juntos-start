-- Create customers table for storing CRM data
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  document text,
  tags text[] default '{}',
  total_spent numeric(12,2) default 0,
  last_interaction timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.customers enable row level security;

-- TEMPORARY permissive policies until auth is added
-- NOTE: Replace these with user-scoped policies when authentication is implemented
create policy "Public can read customers"
  on public.customers for select
  using (true);

create policy "Public can insert customers"
  on public.customers for insert
  with check (true);

create policy "Public can update customers"
  on public.customers for update
  using (true);

create policy "Public can delete customers"
  on public.customers for delete
  using (true);

-- Function and trigger to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger trg_customers_updated_at
before update on public.customers
for each row execute function public.update_updated_at_column();