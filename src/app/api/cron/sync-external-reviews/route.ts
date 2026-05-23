import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { REVIEW_SOURCES, ReviewSource } from "@/lib/externalReviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/sync-external-reviews?secret=...
 *
 * Daily cron that fetches review ratings from brand product pages
 * (Judge.me API, or static for Loox) and caches them in Supabase.
 */
export async function GET(req: NextRequest) {
  const querySecret = new URL(req.url).searchParams.get("secret");
  const authHeader = req.headers.get("authorization");
  const headerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (querySecret !== process.env.CRON_SECRET && headerSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const results: { slug: string; rating: number; count: number; source: string; status: string }[] = [];

  for (const source of REVIEW_SOURCES) {
    let rating = 0;
    let count = 0;
    let status = "ok";

    try {
      if (source.platform === "judgeme" && source.productHandle) {
        const data = await fetchJudgeMeReview(source.shopDomain, source.productHandle);
        if (data) {
          rating = data.rating;
          count = data.count;
        } else {
          status = "no_data";
        }
      } else if (source.platform === "loox" || source.platform === "static") {
        rating = source.staticRating ?? 0;
        count = source.staticCount ?? 0;
      }
    } catch (err) {
      status = "error";
      console.error(`[sync-external-reviews] Failed for ${source.sourceName}:`, err);
    }

    if (rating > 0 && count > 0) {
      for (const slug of source.paddleSlugs) {
        const { error } = await supabase
          .from("external_reviews")
          .upsert({
            paddle_slug: slug,
            rating,
            review_count: count,
            source_name: source.sourceName,
            source_url: source.productUrl,
            platform: source.platform,
            last_fetched: new Date().toISOString(),
          }, { onConflict: "paddle_slug" });

        results.push({
          slug,
          rating,
          count,
          source: source.sourceName,
          status: error ? `db_error: ${error.message}` : status,
        });
      }
    } else {
      for (const slug of source.paddleSlugs) {
        results.push({ slug, rating, count, source: source.sourceName, status });
      }
    }
  }

  return NextResponse.json({ ok: true, synced: results.length, results });
}

/**
 * Fetch review data from Judge.me public API.
 */
async function fetchJudgeMeReview(
  shopDomain: string,
  productHandle: string,
): Promise<{ rating: number; count: number } | null> {
  // Judge.me public widget API — no auth required
  const url = `https://judge.me/api/v1/widgets/product_review?url=${encodeURIComponent(shopDomain)}&handle=${encodeURIComponent(productHandle)}&per_page=1`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    // Fallback: try the badge endpoint
    return fetchJudgeMeBadge(shopDomain, productHandle);
  }

  const html = await res.text();

  // Parse rating from the badge HTML response
  const ratingMatch = html.match(/data-average-rating="([\d.]+)"/);
  const countMatch = html.match(/data-number-of-reviews="(\d+)"/);

  if (ratingMatch && countMatch) {
    return {
      rating: parseFloat(ratingMatch[1]),
      count: parseInt(countMatch[1], 10),
    };
  }

  return fetchJudgeMeBadge(shopDomain, productHandle);
}

/**
 * Fallback: fetch from Judge.me badge endpoint.
 */
async function fetchJudgeMeBadge(
  shopDomain: string,
  productHandle: string,
): Promise<{ rating: number; count: number } | null> {
  const url = `https://judge.me/api/v1/widgets/product_review?url=${encodeURIComponent(shopDomain)}&handle=${encodeURIComponent(productHandle)}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const text = await res.text();

    // Try to extract from various Judge.me response formats
    const ratingMatch = text.match(/(\d+\.\d+)\s*out of/i) || text.match(/rating.*?(\d+\.\d+)/i);
    const countMatch = text.match(/(\d+)\s*review/i);

    if (ratingMatch && countMatch) {
      return {
        rating: parseFloat(ratingMatch[1]),
        count: parseInt(countMatch[1], 10),
      };
    }
  } catch {
    // ignore
  }

  return null;
}
