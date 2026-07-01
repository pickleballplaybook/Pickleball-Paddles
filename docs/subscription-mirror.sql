-- subscription_mirror
-- ---------------------
-- Local mirror of Stripe subscription state, kept live by the webhook at
-- src/app/api/webhooks/stripe/route.ts. Admin pages read from this table
-- instead of paginating Stripe directly, dropping page load times from
-- 15-30s to ~50ms while keeping data fresh.
--
-- Backfill once after creating: POST /api/admin/stripe-backfill
-- Then point Stripe Dashboard → Webhooks at /api/webhooks/stripe and
-- subscribe to customer.subscription.* (created/updated/deleted) + customer.deleted.

create table if not exists subscription_mirror (
  stripe_subscription_id  text        primary key,
  email                   text        not null,
  stripe_customer_id      text        not null,
  -- Raw Stripe status: trialing, active, past_due, canceled, incomplete,
  -- incomplete_expired, unpaid, paused. Mapped to our internal label set
  -- (trial / active / canceled / churned) by the admin page at read time.
  status                  text        not null,
  subscription_created_at timestamptz not null,
  trial_end               timestamptz,
  canceled_at             timestamptz,
  plan_label              text,
  updated_at              timestamptz not null default now()
);

-- Lookups by email (admin page joins on lowercased email).
create index if not exists idx_subscription_mirror_email
  on subscription_mirror(lower(email));

-- Filters by status (e.g. all canceled, all trialing).
create index if not exists idx_subscription_mirror_status
  on subscription_mirror(status);

-- Time-window queries — sorted desc since the admin page wants newest first.
create index if not exists idx_subscription_mirror_created_at
  on subscription_mirror(subscription_created_at desc);

-- updated_at auto-bump on every UPSERT, even when only a couple fields change.
create or replace function subscription_mirror_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_subscription_mirror_updated on subscription_mirror;
create trigger trg_subscription_mirror_updated
  before update on subscription_mirror
  for each row execute function subscription_mirror_set_updated_at();
