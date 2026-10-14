-- Esquema do Locattor para PostgreSQL / Supabase.
-- Espelha os tipos de src/data/types.ts (camelCase no app -> snake_case aqui).
-- Rode no SQL Editor do Supabase. Cada usuário só enxerga os próprios dados (RLS).

create extension if not exists "pgcrypto";

-- Perfil público do usuário (nome). O login em si fica em auth.users.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

create table public.properties (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  address     text not null,
  type        text not null check (type in ('apartamento', 'casa', 'comercial', 'terreno', 'outro')),
  rent        numeric(12, 2) not null check (rent > 0),
  bedrooms    integer check (bedrooms >= 0),
  area        numeric(10, 2) check (area >= 0),
  notes       text,
  created_at  timestamptz not null default now()
);

create table public.tenants (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  document    text,
  phone       text,
  email       text,
  notes       text,
  created_at  timestamptz not null default now()
);

create table public.contracts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  property_id  uuid not null references public.properties (id) on delete cascade,
  tenant_id    uuid not null references public.tenants (id) on delete cascade,
  rent         numeric(12, 2) not null check (rent > 0),
  due_day      smallint not null check (due_day between 1 and 31),
  start_date   date not null,
  end_date     date check (end_date is null or end_date > start_date),
  deposit      numeric(12, 2) check (deposit >= 0),
  active       boolean not null default true,
  notes        text,
  created_at   timestamptz not null default now()
);

-- Um imóvel só pode ter um contrato ativo por vez.
create unique index contracts_one_active_per_property
  on public.contracts (property_id) where active;

create table public.payments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  contract_id  uuid not null references public.contracts (id) on delete cascade,
  month        char(7) not null check (month ~ '^\d{4}-\d{2}$'),  -- AAAA-MM
  amount       numeric(12, 2) not null,
  due_date     date not null,
  paid_at      date,
  unique (contract_id, month)
);

create table public.expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  property_id  uuid not null references public.properties (id) on delete cascade,
  description  text not null,
  category     text not null check (category in ('iptu', 'condominio', 'manutencao', 'seguro', 'outro')),
  amount       numeric(12, 2) not null check (amount > 0),
  date         date not null
);

create index on public.properties (user_id);
create index on public.tenants (user_id);
create index on public.contracts (user_id);
create index on public.payments (user_id);
create index on public.payments (contract_id);
create index on public.expenses (user_id);
create index on public.expenses (property_id);

-- Row Level Security: cada usuário lê e altera apenas as próprias linhas.
alter table public.profiles   enable row level security;
alter table public.properties enable row level security;
alter table public.tenants    enable row level security;
alter table public.contracts  enable row level security;
alter table public.payments   enable row level security;
alter table public.expenses   enable row level security;

create policy "perfil próprio" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "dados próprios" on public.properties
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "dados próprios" on public.tenants
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "dados próprios" on public.contracts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "dados próprios" on public.payments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "dados próprios" on public.expenses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Cria o perfil automaticamente no cadastro, usando o nome enviado em
-- supabase.auth.signUp({ options: { data: { name } } }).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
