-- Paste this whole file into Supabase: SQL Editor -> New query -> Run.
-- It makes two tables. Row Level Security means each person can only ever see their own rows.

create table checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  sender text,
  subject text,
  score integer not null,
  findings jsonb,
  created_at timestamptz not null default now()
);
alter table checks enable row level security;
create policy "own checks select" on checks for select using (auth.uid() = user_id);
create policy "own checks insert" on checks for insert with check (auth.uid() = user_id);
create policy "own checks delete" on checks for delete using (auth.uid() = user_id);

create table progress (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table progress enable row level security;
create policy "own progress select" on progress for select using (auth.uid() = user_id);
create policy "own progress insert" on progress for insert with check (auth.uid() = user_id);
create policy "own progress update" on progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
