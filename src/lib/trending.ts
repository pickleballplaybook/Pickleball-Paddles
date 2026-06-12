import { Paddle } from "@/types";

// ── Engagement scoring ─────────────────────────────────────────────────────────
// Single source of truth for the weekly/trending "top paddles" score, shared by
// the weekly cron, the /trending page, and the homepage Trending section so they
// can never drift. Hearts and ratings are weighted up so they aren't drowned out
// by raw view counts (1 heart ≈ 50 views of weight; 1 rating ≈ 30).
export const ENGAGEMENT_WEIGHTS = { heart: 5, rating: 3, viewDivisor: 10 } as const;

// Minimum engagement score required to appear in any trending list. A paddle
// with one heart and zero views scores exactly 5, which is "trending" only
// in the most generous sense — the floor at >5 means it takes either two
// hearts, a heart + meaningful views, or 60+ views to qualify. Keeps the
// list honest when site-wide engagement is low.
export const MIN_TRENDING_ENGAGEMENT = 6;

export function engagementScore(hearts: number, ratings: number, views: number): number {
  return (
    hearts * ENGAGEMENT_WEIGHTS.heart +
    ratings * ENGAGEMENT_WEIGHTS.rating +
    Math.floor(views / ENGAGEMENT_WEIGHTS.viewDivisor)
  );
}

// Paddle slugs that should never appear on any trending surface (homepage
// Trending Paddles, /trending page, weekly cron snapshot). Useful when a paddle
// dominates engagement for reasons we don't want reflected in editorial rankings.
// Filter BEFORE slicing the top N so excluded paddles don't consume slots.
export const TRENDING_EXCLUDED_SLUGS = new Set<string>([
  "selkirk-boomstik-elongated",
  "joola-pro-v-perseus-elongated",
]);

export function isTrendingExcluded(slug: string): boolean {
  return TRENDING_EXCLUDED_SLUGS.has(slug);
}

// Walks an already-score-sorted list and returns the top N with at most ONE
// paddle per series (later/lower-scoring paddles in the same series are
// skipped). Paddles without a seriesSlug always pass. Use this in place of
// .slice(0, N) on any trending list so a single series can't fill multiple
// slots (e.g., Honolulu J2CR + J6CR Crystal Blue both making the top 10).
export function takeTopBySeriesDedup<T extends { paddle: Paddle }>(items: T[], n: number): T[] {
  const seenSeries = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const series = it.paddle.seriesSlug;
    if (series) {
      if (seenSeries.has(series)) continue;
      seenSeries.add(series);
    }
    out.push(it);
    if (out.length >= n) break;
  }
  return out;
}

// ── Time-decay weight by age bucket ───────────────────────────────────────────

export function getHeartWeight(createdAt: Date | string | number): number {
  const days = (Date.now() - new Date(createdAt).getTime()) / 86400000;
  if (days <=   7) return 1.00;
  if (days <=  30) return 0.50;
  if (days <=  60) return 0.25;
  if (days <= 180) return 0.10;
  if (days <= 365) return 0.05;
  return 0.02;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HeartRecord {
  paddleId: string;
  userId?: string;
  createdAt: Date | string | number;
}

export interface TrendingPaddle {
  paddle: Paddle;
  totalHearts: number;
  weightedScore: number;
  lastHeart?: number; // timestamp
}

export interface RisingBrand {
  brand: string;
  totalHearts: number;
  weightedScore: number;
  topSlug: string;
  paddleCount: number;
  bestDiscount: string;
}

// ── Core functions ────────────────────────────────────────────────────────────

/**
 * Rank paddles by: weightedScore DESC → totalHearts DESC → mostRecentHeart DESC
 *
 * CRITICAL RULE: when any heart records exist, a paddle with ZERO hearts must
 * never outrank a paddle that has real hearts. Zero-heart paddles are given a
 * negative sentinel score so they always sort below all hearted paddles.
 *
 * When NO heart records exist at all (e.g. brand new site, cleared storage)
 * we fall back to trendingScore so the section is never blank.
 */
export function getTrendingPaddles(
  paddles: Paddle[],
  heartRecords: HeartRecord[] = [],
  count = 5,
): TrendingPaddle[] {
  // Build per-paddle aggregates from real heart records
  const agg = new Map<string, { total: number; weighted: number; last: number }>();
  for (const h of heartRecords) {
    const entry = agg.get(h.paddleId) ?? { total: 0, weighted: 0, last: 0 };
    entry.total    += 1;
    entry.weighted += getHeartWeight(h.createdAt);
    const ts = new Date(h.createdAt).getTime();
    if (ts > entry.last) entry.last = ts;
    agg.set(h.paddleId, entry);
  }

  const anyHeartsExist = agg.size > 0;

  return paddles
    .map((paddle) => {
      const a = agg.get(paddle.id);
      return {
        paddle,
        totalHearts: a?.total ?? 0,
        // When hearts exist: zero-heart paddles get -1 so they never beat a
        //   hearted paddle regardless of their trendingScore value.
        // When no hearts at all: fall back to trendingScore for ordering.
        weightedScore: a?.weighted ?? (anyHeartsExist ? -1 : paddle.trendingScore / 100),
        lastHeart: a?.last,
      };
    })
    .sort((a, b) =>
      b.totalHearts   - a.totalHearts   ||
      b.weightedScore - a.weightedScore ||
      (b.lastHeart ?? 0) - (a.lastHeart ?? 0)
    )
    .slice(0, count);
}

/**
 * Rank brands by sum of weighted paddle scores.
 * Falls back to trendingScore per paddle when no heartRecords provided.
 */
export function getRisingBrands(
  paddles: Paddle[],
  heartRecords: HeartRecord[] = [],
  count = 5,
): RisingBrand[] {
  // Build per-paddle heart aggregates
  const paddleAgg = new Map<string, { total: number; weighted: number }>();
  for (const h of heartRecords) {
    const entry = paddleAgg.get(h.paddleId) ?? { total: 0, weighted: 0 };
    entry.total += 1;
    entry.weighted += getHeartWeight(h.createdAt);
    paddleAgg.set(h.paddleId, entry);
  }

  // Aggregate by brand
  const brandMap = new Map<string, {
    totalHearts: number;
    weightedScore: number;
    topWeighted: number;
    topSlug: string;
    paddleCount: number;
    bestDiscount: string;
  }>();

  const anyHeartsExist = paddleAgg.size > 0;

  for (const paddle of paddles) {
    const pa = paddleAgg.get(paddle.id);
    // Same sentinel rule: zero-heart paddles contribute -1 when real hearts exist
    const weighted = pa?.weighted ?? (anyHeartsExist ? -1 : paddle.trendingScore / 100);
    const total    = pa?.total    ?? 0;

    const existing = brandMap.get(paddle.brand);
    const discount = paddle.amountOff && paddle.amountOff !== "$0" && paddle.amountOff !== ""
      ? paddle.amountOff
      : "";

    if (!existing) {
      brandMap.set(paddle.brand, {
        totalHearts:   total,
        weightedScore: weighted,
        topWeighted:   weighted,
        topSlug:       paddle.slug,
        paddleCount:   1,
        bestDiscount:  discount,
      });
    } else {
      existing.totalHearts   += total;
      existing.weightedScore += weighted;
      existing.paddleCount   += 1;
      if (weighted > existing.topWeighted) {
        existing.topWeighted = weighted;
        existing.topSlug     = paddle.slug;
      }
      if (discount && !existing.bestDiscount) {
        existing.bestDiscount = discount;
      }
    }
  }

  return Array.from(brandMap.entries())
    .map(([brand, data]) => ({ brand, ...data }))
    .sort((a, b) => b.totalHearts - a.totalHearts || b.weightedScore - a.weightedScore)
    .slice(0, count);
}

/**
 * Find similar paddles using Euclidean distance on numeric specs.
 * Shape mismatch adds a small penalty.
 */
export function getSimilarPaddles(
  paddleId: string,
  allPaddles: Paddle[],
  count = 4,
): Paddle[] {
  const target = allPaddles.find((p) => p.id === paddleId);
  if (!target) return [];

  // Normalisation bounds
  const swingWeights = allPaddles.map((p) => p.swingWeight).filter(Boolean);
  const twistWeights = allPaddles.map((p) => p.twistWeight).filter(Boolean);
  const swMin = Math.min(...swingWeights), swMax = Math.max(...swingWeights);
  const twMin = Math.min(...twistWeights), twMax = Math.max(...twistWeights);
  const normalize = (val: number, min: number, max: number) =>
    max === min ? 0 : (val - min) / (max - min);

  function parseThickness(t?: string): number {
    if (!t) return 0;
    return parseFloat(t.replace(/[^0-9.]/g, "")) || 0;
  }
  const allThick = allPaddles.map((p) => parseThickness(p.thickness));
  const thMin = Math.min(...allThick), thMax = Math.max(...allThick);

  const tSW = normalize(target.swingWeight, swMin, swMax);
  const tTW = normalize(target.twistWeight, twMin, twMax);
  const tTH = normalize(parseThickness(target.thickness), thMin, thMax);

  return allPaddles
    .filter((p) => p.id !== paddleId)
    .map((p) => {
      const sw = normalize(p.swingWeight, swMin, swMax);
      const tw = normalize(p.twistWeight, twMin, twMax);
      const th = normalize(parseThickness(p.thickness), thMin, thMax);
      const shapePenalty = p.shape !== target.shape ? 0.15 : 0;
      const dist = Math.sqrt(
        (sw - tSW) ** 2 +
        (tw - tTW) ** 2 +
        (th - tTH) ** 2
      ) + shapePenalty;
      return { paddle: p, dist };
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, count)
    .map(({ paddle }) => paddle);
}
