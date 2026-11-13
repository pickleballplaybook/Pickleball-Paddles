-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yloxiibtewpewpvtdtvp/sql/new

create table if not exists public.coach_waitlist (
  id         bigint generated always as identity primary key,
  email      text not null unique,
  area       text,
  created_at timestamptz not null default now()
);

create table if not exists public.student_waitlist (
  id         bigint generated always as identity primary key,
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- Inserts come from server-side API routes using the service-role key,
-- so no RLS policies needed on these tables.
alter table public.coach_waitlist  enable row level security;
alter table public.student_waitlist enable row level security;
