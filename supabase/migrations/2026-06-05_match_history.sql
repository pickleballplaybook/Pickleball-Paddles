-- ─────────────────────────────────────────────────────────────────────────────
--  Match History table for /match/analysis  + /match/history
--  Run this in: Supabase Dashboard → SQL Editor → New query → Paste → Run
--  Idempotent: safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.match_history (
  id            uuid          primary key default gen_random_uuid(),
  user_id       uuid          not null references auth.users (id) on delete cascade,
  saved_at      timestamptz   not null default now(),

  -- Raw per-shot tallies (Record<string, number> shape from the client)
  ue_data       jsonb         not null default '{}'::jsonb,
  fe_data       jsonb         not null default '{}'::jsonb,
  win_data      jsonb         not null default '{}'::jsonb,
  notes         text          not null default '',

  -- Derived totals stored so the history page reads fast w/o recomputing
  ue_total       integer       not null default 0,
  fe_total       integer       not null default 0,
  total_errors   integer       not null default 0,
  winners_total  integer       not null default 0,
  ratio          numeric(8,4)  not null default 0
);

create index if not exists match_history_user_id_saved_at_idx
  on public.match_history (user_id, saved_at desc);

-- ── RLS: users can only see + write their own rows ──────────────────────────
alter table public.match_history enable row level security;

drop policy if exists "match_history_select_own" on public.match_history;
create policy "match_history_select_own"
  on public.match_history for select
  using ( auth.uid() = user_id );

drop policy if exists "match_history_insert_own" on public.match_history;
create policy "match_history_insert_own"
  on public.match_history for insert
  with check ( auth.uid() = user_id );

drop policy if exists "match_history_update_own" on public.match_history;
create policy "match_history_update_own"
  on public.match_history for update
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

drop policy if exists "match_history_delete_own" on public.match_history;
create policy "match_history_delete_own"
  on public.match_history for delete
  using ( auth.uid() = user_id );
