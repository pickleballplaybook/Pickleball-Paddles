-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yloxiibtewpewpvtdtvp/sql/new

-- ── Reactions table ───────────────────────────────────────────────────────────

create table if not exists public.reactions (
  id         bigint generated always as identity primary key,
  session_id text        not null,
  paddle_id  text        not null,
  reaction   text        not null check (reaction in ('heart', 'dislike')),
  created_at timestamptz not null default now(),
  constraint reactions_session_paddle_unique unique (session_id, paddle_id)
);

-- Fast lookups by session (loading a user's own hearts)
create index if not exists idx_reactions_session_id on public.reactions (session_id);
-- Fast lookups by paddle (counting hearts for trending)
create index if not exists idx_reactions_paddle_id  on public.reactions (paddle_id);
-- Fast filter by reaction type
create index if not exists idx_reactions_reaction    on public.reactions (reaction);

-- ── Row-Level Security ────────────────────────────────────────────────────────
-- Heart data is intentionally public — it powers the trending section.
-- Anyone with the anon key can read all reactions and write their own.

alter table public.reactions enable row level security;

-- Allow anon users to read all reactions (needed for trending across all users)
create policy "anon can read all reactions"
  on public.reactions for select
  to anon using (true);

-- Allow anon users to insert/update/delete (they are identified by session_id)
create policy "anon can write reactions"
  on public.reactions for insert
  to anon with check (true);

create policy "anon can update reactions"
  on public.reactions for update
  to anon using (true) with check (true);

create policy "anon can delete reactions"
  on public.reactions for delete
  to anon using (true);

-- ── Paddle ratings table ───────────────────────────────────────────────────────

create table if not exists public.paddle_ratings (
  id         bigint generated always as identity primary key,
  paddle_id  text        not null,
  user_key   text        not null,
  stars      smallint    not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  constraint paddle_ratings_paddle_user_unique unique (paddle_id, user_key)
);

create index if not exists idx_paddle_ratings_paddle_id on public.paddle_ratings (paddle_id);

alter table public.paddle_ratings enable row level security;

create policy "anon can read paddle ratings"
  on public.paddle_ratings for select
  to anon using (true);

create policy "anon can insert paddle ratings"
  on public.paddle_ratings for insert
  to anon with check (true);

create policy "anon can update paddle ratings"
  on public.paddle_ratings for update
  to anon using (true) with check (true);

-- ── Auto-matched YouTube reviews table ──────────────────────────────────────
-- Populated by the daily /api/cron/sync-reviews cron job.
-- Maps paddle slugs to YouTube video IDs discovered automatically.

create table if not exists public.paddle_review_videos (
  id           bigint generated always as identity primary key,
  paddle_slug  text        not null,
  video_id     text        not null,
  video_title  text        not null default '',
  video_url    text        not null default '',
  published_at timestamptz,
  matched_at   timestamptz not null default now(),
  constraint paddle_review_videos_slug_video_unique unique (paddle_slug, video_id)
);

create index if not exists idx_prv_paddle_slug on public.paddle_review_videos (paddle_slug);
create index if not exists idx_prv_video_id    on public.paddle_review_videos (video_id);

alter table public.paddle_review_videos enable row level security;

create policy "anon can read review videos"
  on public.paddle_review_videos for select
  to anon using (true);

create policy "service role can manage review videos"
  on public.paddle_review_videos for all
  to service_role using (true) with check (true);
