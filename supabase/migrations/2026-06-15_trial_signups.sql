-- ─────────────────────────────────────────────────────────────────────────────
--  trial_signups — captures every Pickleball Drills trial-onboarding email so
--  we can run the day-0/1/3/5/6 drip from Firebase Functions and export the
--  list as CSV from /admin/email.
--
--  Sources: 'app_onboarding' (Flutter onboarding screen), 'web' (any web form).
--  Run in: SQL Editor → New query → Run.  Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

-- Defensively (re)create the shared updated_at helper. The profiles migration
-- created it too, but some envs ran into "function public.touch_updated_at()
-- does not exist" when the profiles migration was skipped.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table if not exists public.trial_signups (
  id                 uuid          primary key default gen_random_uuid(),
  email              text          not null,
  flutter_user_id    text,
  source             text          not null default 'app_onboarding',
  trial_start_at     timestamptz   not null default now(),
  trial_end_at       timestamptz,
  unsubscribed_at    timestamptz,
  bounced_at         timestamptz,
  created_at         timestamptz   not null default now(),
  updated_at         timestamptz   not null default now(),
  constraint trial_signups_email_lower_chk
    check (email = lower(email))
);

create unique index if not exists trial_signups_email_uidx
  on public.trial_signups (email);

create index if not exists trial_signups_trial_start_at_idx
  on public.trial_signups (trial_start_at)
  where unsubscribed_at is null;

create index if not exists trial_signups_flutter_user_id_idx
  on public.trial_signups (flutter_user_id)
  where flutter_user_id is not null;

drop trigger if exists trial_signups_touch_updated_at on public.trial_signups;
create trigger trial_signups_touch_updated_at
  before update on public.trial_signups
  for each row execute function public.touch_updated_at();

-- RLS: no client-side access. Reads/writes go through service-role from the
-- Next.js admin (/api/admin/email/*) and the public Flutter signup endpoint
-- (/api/trial-signup), both of which use getSupabaseAdmin().
alter table public.trial_signups enable row level security;
-- (No policies = deny-by-default for anon/auth roles.)
