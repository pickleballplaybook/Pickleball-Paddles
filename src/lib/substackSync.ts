import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Substack RSS → newsletter_posts mirror.
 *
 * The RSS feed at https://pickleballplaybook.substack.com/feed returns
 * the most recent 20 posts as XML. We parse each <item>, extract the
 * fields we need, and upsert to Supabase. Idempotent: re-running only
 * changes rows whose title / content / date has actually changed.
 *
 * Not using an XML library because the parse we need is trivial and
 * bringing in a dep for one function is overkill — regex on `<field>`
 * blocks is fine here.
 */

const SUBSTACK_FEED = "https://pickleballplaybook.substack.com/feed";

// Category inference from post title. Ordered — first match wins.
// Case-insensitive substring on title only. Four buckets total:
//   - Paddles: paddle reviews / roundups
//   - Gear: physical stuff other than paddles (grips, shoes, ball
//     machines, weights, bags)
//   - Pickleball 101: technique + strategy education (any masterclass,
//     shot-specific content, drills, strategy breakdowns)
//   - Pickleball Tips: everything else (short-form advice)
//
// Manual overrides: if the auto-inference gets one wrong, edit the
// row directly in Supabase (`update newsletter_posts set category='X'
// where slug='...'`). Manual edits are overwritten on the next sync
// unless you also add a rule here that matches the title.
const CATEGORY_RULES: Array<{ match: RegExp; category: NewsletterCategory }> = [
  // Paddles first — "best paddles of 2026" beats other keywords.
  {
    match: /\b(paddle review|paddle reviews|best paddle|best paddles|paddle test|paddle spec|paddle showdown|tested paddle|paddles of \d{4})\b/i,
    category: "Paddles",
  },
  // Gear = physical product content ONLY (shoes, bags, ball machines,
  // weights, overgrip PRODUCTS). Note: "grip", "holding", "paddle
  // wrong" are NOT here — those describe technique (how to hold the
  // paddle), which belongs in Pickleball 101 below.
  {
    match: /\b(shoe(s)?|bag(s)?|ball machine|weights?|overgrip|slyce)\b/i,
    category: "Gear",
  },
  // Pickleball 101 — anything that teaches a specific shot, drill,
  // strategy, or technique (including how to grip / hold the paddle).
  {
    match: /\b(drop|reset|dink|volley|serve|return|hands battle|kitchen point|net play|drill|masterclass|strateg|system to win|beat \d+%|smart play|positioning|stack|formation|iq|win \d+% of|figured out|technique|footwork|grip|holding|paddle wrong|hold your)\b/i,
    category: "Pickleball 101",
  },
];

export type NewsletterCategory =
  | "Pickleball 101"
  | "Pickleball Tips"
  | "Paddles"
  | "Gear";

export const ALL_CATEGORIES: NewsletterCategory[] = [
  "Pickleball 101",
  "Pickleball Tips",
  "Paddles",
  "Gear",
];

function inferCategory(title: string): NewsletterCategory {
  for (const rule of CATEGORY_RULES) {
    if (rule.match.test(title)) return rule.category;
  }
  return "Pickleball Tips";
}

export type SyncResult = {
  fetched: number;
  upserted: number;
  skipped: number;
  errors: string[];
};

// Match a specific top-level RSS field inside a <item> block. Supports
// both plain and CDATA-wrapped values. `field` is unescaped, e.g. "title".
function pluck(item: string, field: string): string | null {
  // Try namespaced first (e.g. content:encoded, dc:creator), then plain.
  const re = new RegExp(
    `<(?:[a-z]+:)?${field}(?:\\s[^>]*)?>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/(?:[a-z]+:)?${field}>`,
  );
  const m = item.match(re);
  if (!m) return null;
  return (m[1] ?? m[2] ?? "").trim();
}

// <enclosure url="…" …/> — self-closing, only need the url attribute.
function pluckEnclosureUrl(item: string): string | null {
  const m = item.match(/<enclosure\s[^>]*url="([^"]+)"/);
  return m ? m[1] : null;
}

// From https://…/p/drop-masterclass-day-4 → "drop-masterclass-day-4"
function slugFromLink(link: string): string | null {
  const m = link.match(/\/p\/([^/?#]+)/);
  return m ? m[1] : null;
}

export async function syncSubstackFeed(): Promise<SyncResult> {
  const result: SyncResult = { fetched: 0, upserted: 0, skipped: 0, errors: [] };
  let xml: string;
  try {
    const res = await fetch(SUBSTACK_FEED, {
      // Avoid stale Vercel edge cache during backfills.
      cache: "no-store",
      headers: { accept: "application/rss+xml, application/xml, text/xml" },
    });
    if (!res.ok) {
      result.errors.push(`RSS fetch ${res.status}`);
      return result;
    }
    xml = await res.text();
  } catch (e) {
    result.errors.push(`RSS fetch threw: ${e instanceof Error ? e.message : String(e)}`);
    return result;
  }

  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  result.fetched = itemBlocks.length;

  const supabase = getSupabaseAdmin();

  for (const item of itemBlocks) {
    const link = pluck(item, "link");
    const slug = link ? slugFromLink(link) : null;
    const title = pluck(item, "title");
    const content = pluck(item, "encoded"); // matches content:encoded
    const pub = pluck(item, "pubDate");
    if (!slug || !link || !title || !content || !pub) {
      result.skipped++;
      result.errors.push(`missing required field on item (slug=${slug ?? "?"})`);
      continue;
    }
    const excerpt = pluck(item, "description");
    const featured_image = pluckEnclosureUrl(item);
    const published_at = new Date(pub).toISOString();
    const category = inferCategory(title);

    const { error } = await supabase.from("newsletter_posts").upsert(
      {
        slug,
        substack_url: link,
        title,
        excerpt,
        content_html: content,
        featured_image,
        published_at,
        category,
      },
      { onConflict: "slug" },
    );
    if (error) {
      result.errors.push(`${slug}: ${error.message}`);
      result.skipped++;
      continue;
    }
    result.upserted++;
  }

  return result;
}
