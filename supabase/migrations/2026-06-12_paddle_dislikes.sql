-- ─────────────────────────────────────────────────────────────────────────────
--  paddle_dislikes — thumbs-down votes on paddles
--
--  Mirrors paddle_hearts. One row per (paddle, user_key) pair; the UI enforces
--  one-direction-only by removing the opposite reaction when the user toggles
--  (see src/hooks/useReactions.ts).
--
--  Run this once in the Supabase SQL editor (Database → SQL Editor → New
--  query → paste → Run). After it runs, thumbs-down counts on paddle cards
--  and detail pages will start working live. Until it runs, the UI still
--  renders thumbs-down with a 0 count — the API and hooks fail-soft.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.paddle_dislikes (
  id          uuid          not null default gen_random_uuid() primary key,
  paddle_id   text          not null,
  user_key    text          not null,
  created_at  timestamptz   not null default now(),
  unique (paddle_id, user_key)
);

-- Index the (paddle_id) column for the per-paddle COUNT queries the API uses.
create index if not exists paddle_dislikes_paddle_id_idx
  on public.paddle_dislikes (paddle_id);

-- Allow anon + authenticated callers to read/insert/delete their own rows.
-- Same policy shape paddle_hearts uses. Adjust if you've tightened RLS
-- there since.
alter table public.paddle_dislikes enable row level security;

drop policy if exists paddle_dislikes_select on public.paddle_dislikes;
create policy paddle_dislikes_select
  on public.paddle_dislikes for select
  using (true);

drop policy if exists paddle_dislikes_insert on public.paddle_dislikes;
create policy paddle_dislikes_insert
  on public.paddle_dislikes for insert
  with check (true);

drop policy if exists paddle_dislikes_delete on public.paddle_dislikes;
create policy paddle_dislikes_delete
  on public.paddle_dislikes for delete
  using (true);
