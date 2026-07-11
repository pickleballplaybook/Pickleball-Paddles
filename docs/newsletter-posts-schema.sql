-- newsletter_posts — mirrored copies of Substack posts.
-- Populated by /api/cron/sync-substack which pulls from
-- https://pickleballplaybook.substack.com/feed every 6 hours.
--
-- Source of truth stays Substack (subscribers, email delivery). This
-- table exists so we can render the same content on playbookpaddles.com
-- with our own layout + ads (Ezoic later) + SEO metadata.
--
-- Idempotent: run in Supabase SQL editor. Safe to re-run.

create table if not exists newsletter_posts (
  slug             text primary key,               -- Substack URL slug, e.g. "drop-masterclass-day-4"
  substack_url     text not null,                  -- canonical https://…/p/<slug>
  title            text not null,
  excerpt          text,                           -- from RSS <description>
  content_html     text not null,                  -- from <content:encoded>
  featured_image   text,                           -- from <enclosure url="…"/>
  published_at     timestamptz not null,
  updated_at       timestamptz not null default now()
);

create index if not exists newsletter_posts_published_at_idx
  on newsletter_posts (published_at desc);

-- Auto-update updated_at on any row modification.
create or replace function newsletter_posts_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists newsletter_posts_touch on newsletter_posts;
create trigger newsletter_posts_touch
  before update on newsletter_posts
  for each row execute function newsletter_posts_touch_updated_at();
