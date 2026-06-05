-- ─────────────────────────────────────────────────────────────────────────────
--  Profiles table — captures every signup + newsletter opt-in preference
--  Run after the match_history migration in: SQL Editor → New query → Run.
--  Idempotent: safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id                         uuid          primary key references auth.users (id) on delete cascade,
  email                      text          not null,
  newsletter_opt_in          boolean       not null default false,
  newsletter_subscribed_at   timestamptz,
  created_at                 timestamptz   not null default now(),
  updated_at                 timestamptz   not null default now()
);

create index if not exists profiles_newsletter_opt_in_idx
  on public.profiles (newsletter_opt_in) where newsletter_opt_in = true;

-- ── Auto-create a profile row whenever a new auth.users row appears ─────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Keep updated_at fresh on every row update ───────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ── RLS: users can read + update only their own profile ─────────────────────
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using ( auth.uid() = id );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- Admin reads happen via the service-role client which bypasses RLS by design.
-- No INSERT policy: profiles are created by the trigger using security definer.

-- ── Backfill any existing users that signed up BEFORE this migration ────────
insert into public.profiles (id, email)
  select id, email from auth.users
  on conflict (id) do nothing;
