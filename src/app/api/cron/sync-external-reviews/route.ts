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
      if (source.platform === "judgeme") {
        const data = await scrapeProductRating(source.productUrl);
        if (data) {
          rating = data.rating;
          count = data.count;
        } else {
          status = "no_data";
        }
      } else if (source.platform === "loox") {
        // Try scraping first, fall back to static values
        const data = await scrapeProductRating(source.productUrl);
        if (data) {
          rating = data.rating;
          count = data.count;
        } else {
          rating = source.staticRating ?? 0;
          count = source.staticCount ?? 0;
        }
      } else if (source.platform === "static") {
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
 * Scrape rating data from a Shopify product page.
 * Works for Judge.me, Stamped, and any platform that embeds rating
 * metafields in the page source (Klaviyo integration pattern).
 */
async function scrapeProductRating(
  productUrl: string,
): Promise<{ rating: number; count: number } | null> {
  try {
    const res = await fetch(productUrl, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "PlaybookPaddles/1.0 (review-sync)" },
    });

    if (!res.ok) return null;
    const html = await res.text();

    // Pattern 1: Klaviyo/metafield embedded rating (most common)
    const metaMatch = html.match(/"rating":\{"scale_min":"[^"]*","scale_max":"[^"]*","value":"([\d.]+)"\},"rating_count":(\d+)/);
    if (metaMatch) {
      return { rating: parseFloat(metaMatch[1]), count: parseInt(metaMatch[2], 10) };
    }

    // Pattern 2: JSON-LD ratingValue + reviewCount (anywhere in page, any order)
    const rvMatch = html.match(/"ratingValue"\s*:\s*"?([\d.]+)/);
    const rcMatch = html.match(/"reviewCount"\s*:\s*"?(\d+)/);
    const ldMatch = rvMatch && rcMatch ? [null, rvMatch[1], rcMatch[1]] : null;
    if (ldMatch && ldMatch[1] && ldMatch[2]) {
      return { rating: parseFloat(ldMatch[1]), count: parseInt(ldMatch[2], 10) };
    }

    // Pattern 3: Loox metafield
    const looxRating = html.match(/MetafieldLooxRating\s*=\s*"([\d.]+)"/);
    const looxCount = html.match(/MetafieldLooxCount\s*=\s*"?(\d+)"?/);
    if (looxRating && looxCount) {
      return { rating: parseFloat(looxRating[1]), count: parseInt(looxCount[1], 10) };
    }
  } catch {
    // timeout or network error
  }

  return null;
}
