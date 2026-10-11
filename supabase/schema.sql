-- Revision OS: one private JSON document per authenticated user.
-- Run this in Supabase SQL Editor before signing in from the app.
create table if not exists public.revision_os_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.revision_os_data enable row level security;

drop policy if exists "Users can read their own revision data" on public.revision_os_data;
create policy "Users can read their own revision data"
  on public.revision_os_data for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert their own revision data" on public.revision_os_data;
create policy "Users can insert their own revision data"
  on public.revision_os_data for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update their own revision data" on public.revision_os_data;
create policy "Users can update their own revision data"
  on public.revision_os_data for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update on public.revision_os_data to authenticated;
