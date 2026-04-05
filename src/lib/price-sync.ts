/**
 * Server-side price sync system.
 *
 * Architecture:
 *  1. fetchProductPrice(url)   — fetches the retailer page and extracts price
 *  2. syncPaddlePrice(paddle)  — syncs one paddle and writes to prices.json
 *  3. syncAllPaddlePrices()    — syncs all paddles in small batches
 *  4. readPriceCache()         — reads the current cached prices
 *
 * Storage: src/data/prices.json (local dev).
 * Production note: replace readPriceCache/writeCache with a proper DB
 * (Vercel KV, Supabase, PlanetScale, etc.) — the filesystem is read-only
 * on most hosting platforms.
 *
 * Price extraction strategy (in priority order):
 *  1. JSON-LD schema.org Product → offers.price  (Shopify, WooCommerce, most stores)
 *  2. <meta property="product:price:amount">       (Open Graph for products)
 *  3. Shopify-specific window.__st / variant JSON patterns
 *  4. Regex sweep for common "$NNN.NN" patterns near "price" keywords
 *
 * Most pickleball brands use Shopify — JSON-LD alone covers the majority.
 */

import fs   from "fs";
import path from "path";
import { Paddle, PriceCacheEntry, PriceCache } from "@/types";

// ── Storage ───────────────────────────────────────────────────────────────────

const PRICES_FILE = path.join(process.cwd(), "src", "data", "prices.json");

export function readPriceCache(): PriceCache {
  try {
    const raw = fs.readFileSync(PRICES_FILE, "utf-8");
    return JSON.parse(raw) as PriceCache;
  } catch {
    return {};
  }
}

function writeCache(cache: PriceCache): void {
  try {
    fs.writeFileSync(PRICES_FILE, JSON.stringify(cache, null, 2), "utf-8");
  } catch (err) {
    console.error("[price-sync] Failed to write price cache:", err);
  }
}

// ── Price extractors ──────────────────────────────────────────────────────────

/** Parse a raw price string (e.g. "149.99", "14999" cents) into a dollar float. */
function toFloat(raw: string, likelyCents = false): number | null {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (isNaN(n) || n <= 0) return null;
  // Shopify stores prices as cents (integer); if > 10000 assume cents
  if (likelyCents && n > 10000) return Math.round((n / 100) * 100) / 100;
  return n;
}

/**
 * Extract price from JSON-LD schema.org Product blocks.
 * Works for: Shopify, WooCommerce, BigCommerce, most modern stores.
 */
function extractJsonLd(html: string): number | null {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;

  while ((m = re.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]);
      const nodes: unknown[] = Array.isArray(data)
        ? data
        : data?.["@graph"] ?? [data];

      for (const node of nodes) {
        const n = node as Record<string, unknown>;
        if (n["@type"] !== "Product") continue;
        const raw  = n["offers"] as Record<string, unknown> | Record<string, unknown>[];
        const ofrs = Array.isArray(raw) ? raw : [raw];
        for (const o of ofrs) {
          if (!o?.["price"]) continue;
          const price = toFloat(String(o["price"]));
          if (price !== null && price > 0) return price;
        }
      }
    } catch {
      // malformed JSON, skip
    }
  }
  return null;
}

/** Extract price from Open Graph product meta tags. */
function extractOpenGraph(html: string): number | null {
  const m = html.match(
    /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i
  );
  if (!m) return null;
  return toFloat(m[1]);
}

/**
 * Shopify-specific patterns:
 *  - window.ShopifyAnalytics.meta.price  (in cents)
 *  - Product JSON embedded via liquid: "price":12999
 */
function extractShopify(html: string): number | null {
  // ShopifyAnalytics.meta (cents)
  let m = html.match(/ShopifyAnalytics\.meta\s*=\s*\{[^}]*"price"\s*:\s*(\d+)/);
  if (m) {
    const price = toFloat(m[1], true);
    if (price !== null) return price;
  }

  // Embedded product variant JSON — look for "price":NNNNN near "available":true
  m = html.match(/"price"\s*:\s*(\d{3,6})(?=\s*[,}])/);
  if (m) {
    const price = toFloat(m[1], true);
    if (price !== null && price < 2000) return price; // sanity: < $2000
  }

  return null;
}

/**
 * Last-resort regex sweep: look for dollar amounts near price-related keywords.
 * Returns the most common/median value from nearby matches to avoid outliers.
 */
function extractRegexFallback(html: string): number | null {
  // Reduce HTML to a block around price keywords
  const priceBlockRe = /(?:sale[-_\s]?price|current[-_\s]?price|our[-_\s]?price|regular[-_\s]?price|product[-_\s]?price)[\s\S]{0,200}/gi;
  const amounts: number[] = [];

  let m: RegExpExecArray | null;
  while ((m = priceBlockRe.exec(html)) !== null) {
    const inner = m[0];
    const dollarRe = /\$\s*(\d{2,3}(?:\.\d{1,2})?)/g;
    let dm: RegExpExecArray | null;
    while ((dm = dollarRe.exec(inner)) !== null) {
      const n = parseFloat(dm[1]);
      if (!isNaN(n) && n >= 20 && n <= 1500) amounts.push(n);
    }
  }

  if (amounts.length === 0) return null;
  // Return the mode or median to avoid sale-price outliers
  amounts.sort((a, b) => a - b);
  return amounts[Math.floor(amounts.length / 2)];
}

function extractPriceFromHtml(html: string): number | null {
  return (
    extractJsonLd(html)        ??
    extractOpenGraph(html)     ??
    extractShopify(html)       ??
    extractRegexFallback(html) ??
    null
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface FetchPriceResult {
  currentPrice:  number | null;
  originalPrice: number | null;
  currency:      string;
  status:        PriceCacheEntry["status"];
  retailer:      string;
  error?:        string;
}

/**
 * Fetch and parse the price from a retailer product URL.
 * Safe to call from API routes / server components only.
 */
export async function fetchProductPrice(url: string): Promise<FetchPriceResult> {
  const empty = (
    status: FetchPriceResult["status"],
    error?: string,
    retailer = ""
  ): FetchPriceResult => ({
    currentPrice: null, originalPrice: null, currency: "USD",
    status, retailer, error,
  });

  if (!url || url.trim() === "") return empty("unavailable", "No URL provided");

  let retailer = "";
  try {
    retailer = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return empty("failed", "Invalid URL");
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/124.0.0.0 Safari/537.36",
        Accept:          "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const status = res.status === 404 ? "unavailable" : "failed";
      return empty(status, `HTTP ${res.status}`, retailer);
    }

    const html  = await res.text();
    const price = extractPriceFromHtml(html);

    if (price === null) {
      return empty("failed", "Price not found in page markup", retailer);
    }

    return { currentPrice: price, originalPrice: null, currency: "USD", status: "active", retailer };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return empty("failed", msg, retailer);
  }
}

/**
 * Sync the price for a single paddle and persist to prices.json.
 */
export async function syncPaddlePrice(paddle: Paddle): Promise<PriceCacheEntry> {
  const result  = await fetchProductPrice(paddle.discountLink ?? "");
  const entry: PriceCacheEntry = {
    currentPrice:  result.currentPrice,
    originalPrice: result.originalPrice,
    currency:      result.currency,
    lastChecked:   new Date().toISOString(),
    status:        result.status,
    retailer:      result.retailer || null,
  };

  const cache = readPriceCache();
  cache[paddle.id] = entry;
  writeCache(cache);

  return entry;
}

/**
 * Sync prices for all paddles.
 * @param paddles  - full paddle list
 * @param concurrency - simultaneous requests (default 3 to be polite to retailers)
 * @param onProgress  - optional callback called after each batch
 */
export async function syncAllPaddlePrices(
  paddles: Paddle[],
  {
    concurrency = 3,
    onProgress,
    forceResync = false,
    maxAgeHours = 24,
  }: {
    concurrency?:  number;
    onProgress?:   (done: number, total: number, paddle: Paddle, entry: PriceCacheEntry) => void;
    forceResync?:  boolean;
    maxAgeHours?:  number;
  } = {}
): Promise<PriceCache> {
  const cache      = readPriceCache();
  const staleMs    = maxAgeHours * 3_600_000;
  const toSync     = paddles.filter((p) => {
    if (forceResync) return true;
    const e = cache[p.id];
    if (!e || !e.lastChecked) return true;
    return Date.now() - new Date(e.lastChecked).getTime() > staleMs;
  });

  let done = 0;
  for (let i = 0; i < toSync.length; i += concurrency) {
    const batch   = toSync.slice(i, i + concurrency);
    const results = await Promise.all(batch.map((p) => syncPaddlePrice(p)));

    batch.forEach((p, idx) => {
      cache[p.id] = results[idx];
      done++;
      onProgress?.(done, toSync.length, p, results[idx]);
    });
  }

  writeCache(cache);
  return cache;
}

// getEffectivePrice lives in paddle-filter.ts (client-safe, no fs dependency)
