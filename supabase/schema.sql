-- TCF Swipe Cards: one progress row per user.
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  learned    integer[] not null default '{}',
  exam_fr_en integer[] not null default '{}',
  exam_en_fr integer[] not null default '{}',
  srs        jsonb     not null default '{}'::jsonb,  -- review schedule: { word id: [box, due day, last reviewed day] }
  stats      jsonb     not null default '{}'::jsonb,  -- daily goal and cards done per day, for the streak
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

-- Each signed-in user can only see and change their own row
create policy "read own progress"   on public.progress for select using (auth.uid() = user_id);
create policy "insert own progress" on public.progress for insert with check (auth.uid() = user_id);
create policy "update own progress" on public.progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Already set up before review schedules and streaks were added? Run just these two lines once:
alter table public.progress add column if not exists srs   jsonb not null default '{}'::jsonb;
alter table public.progress add column if not exists stats jsonb not null default '{}'::jsonb;
