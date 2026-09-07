-- Packing List schema for Supabase
-- Run this entire file in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.master_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  category text not null check (char_length(category) between 1 and 80),
  bag text not null check (bag in ('suitcase', 'backpack', 'optional')),
  is_optional boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  start_date date,
  end_date date,
  status text not null default 'preparing' check (status in ('preparing', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_trip_dates check (end_date is null or start_date is null or end_date >= start_date)
);

create table if not exists public.trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  master_item_id uuid references public.master_items(id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  category text not null check (char_length(category) between 1 and 80),
  bag text not null check (bag in ('suitcase', 'backpack', 'optional')),
  is_optional boolean not null default false,
  sort_order integer not null default 0,
  checked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists master_items_user_order_idx on public.master_items(user_id, sort_order);
create index if not exists trips_user_start_idx on public.trips(user_id, start_date);
create index if not exists trip_items_trip_order_idx on public.trip_items(trip_id, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists master_items_set_updated_at on public.master_items;
create trigger master_items_set_updated_at before update on public.master_items
for each row execute function public.set_updated_at();

drop trigger if exists trips_set_updated_at on public.trips;
create trigger trips_set_updated_at before update on public.trips
for each row execute function public.set_updated_at();

drop trigger if exists trip_items_set_updated_at on public.trip_items;
create trigger trip_items_set_updated_at before update on public.trip_items
for each row execute function public.set_updated_at();

alter table public.master_items enable row level security;
alter table public.trips enable row level security;
alter table public.trip_items enable row level security;

revoke all on public.master_items from anon;
revoke all on public.trips from anon;
revoke all on public.trip_items from anon;
grant select, insert, update, delete on public.master_items to authenticated;
grant select, insert, update, delete on public.trips to authenticated;
grant select, insert, update, delete on public.trip_items to authenticated;

drop policy if exists "Users manage own master items" on public.master_items;
create policy "Users manage own master items"
on public.master_items
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own trips" on public.trips;
create policy "Users manage own trips"
on public.trips
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users view items from own trips" on public.trip_items;
create policy "Users view items from own trips"
on public.trip_items
for select
to authenticated
using (exists (
  select 1 from public.trips
  where trips.id = trip_items.trip_id
    and trips.user_id = (select auth.uid())
));

drop policy if exists "Users add items to own trips" on public.trip_items;
create policy "Users add items to own trips"
on public.trip_items
for insert
to authenticated
with check (exists (
  select 1 from public.trips
  where trips.id = trip_items.trip_id
    and trips.user_id = (select auth.uid())
));

drop policy if exists "Users update items from own trips" on public.trip_items;
create policy "Users update items from own trips"
on public.trip_items
for update
to authenticated
using (exists (
  select 1 from public.trips
  where trips.id = trip_items.trip_id
    and trips.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.trips
  where trips.id = trip_items.trip_id
    and trips.user_id = (select auth.uid())
));

drop policy if exists "Users delete items from own trips" on public.trip_items;
create policy "Users delete items from own trips"
on public.trip_items
for delete
to authenticated
using (exists (
  select 1 from public.trips
  where trips.id = trip_items.trip_id
    and trips.user_id = (select auth.uid())
));

