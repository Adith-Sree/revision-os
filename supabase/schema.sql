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

-- ============================================================================
-- Normalized tables for Assessments & Holidays (per EXAM_TRACKER.md spec)
-- ============================================================================

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  title text not null,
  type text not null check (type in ('Quiz 1', 'Midsem', 'Quiz 2', 'Endsem', 'Assignment', 'Lab/Practical', 'Other')),
  scheduled_at timestamptz,
  status text not null default 'tentative' check (status in ('tentative', 'confirmed', 'completed', 'postponed', 'cancelled')),
  marks_obtained numeric check (marks_obtained >= 0),
  max_marks numeric check (max_marks > 0),
  weightage_percent numeric check (weightage_percent >= 0 and weightage_percent <= 100),
  extra_credit boolean not null default false,
  syllabus text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assessments_user_date on public.assessments (user_id, scheduled_at);
create index if not exists idx_assessments_user_course on public.assessments (user_id, course_id);

alter table public.assessments enable row level security;

drop policy if exists "Users can read their own assessments" on public.assessments;
create policy "Users can read their own assessments"
  on public.assessments for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert their own assessments" on public.assessments;
create policy "Users can insert their own assessments"
  on public.assessments for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update their own assessments" on public.assessments;
create policy "Users can update their own assessments"
  on public.assessments for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own assessments" on public.assessments;
create policy "Users can delete their own assessments"
  on public.assessments for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.assessments to authenticated;

-- Holidays table
create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date,
  start_date date,
  end_date date,
  label text,
  is_range boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_holidays_user_date on public.holidays (user_id, date);

alter table public.holidays enable row level security;

drop policy if exists "Users can manage their own holidays" on public.holidays;
create policy "Users can manage their own holidays"
  on public.holidays for all to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.holidays to authenticated;

