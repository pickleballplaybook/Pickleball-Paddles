/**
 * Pure filtering and sorting functions for the paddles catalogue.
 * No side effects — safe to use in both server and client contexts
 * (the PriceCache is serialisable plain JSON).
 */

import { Paddle, ActiveFilters, PriceCache, SortOption, ReactionMap } from "@/types";

// ── Price helpers (no fs dependency — safe for client bundles) ────────────────

export function getEffectivePrice(
  paddleId:    string,
  paddlePrice: string | undefined,
  cache:       PriceCache
): number | null {
  const entry = cache[paddleId];
  if (entry?.currentPrice != null) return entry.currentPrice;
  if (paddlePrice) {
    const n = parseFloat(paddlePrice.replace(/[^0-9.]/g, ""));
    if (!isNaN(n) && n > 0) return n;
  }
  return null;
}

// ── Price range logic ─────────────────────────────────────────────────────────

export function priceInRange(price: number, range: string): boolean {
  switch (range) {
    case "under-100": return price < 100;
    case "100-149":   return price >= 100  && price <= 149.99;
    case "150-199":   return price >= 150  && price <= 199.99;
    case "200-249":   return price >= 200  && price <= 249.99;
    case "250-plus":  return price >= 250;
    default:          return true;
  }
}

export function getPriceRangeLabel(range: string): string {
  const map: Record<string, string> = {
    "all":       "All Prices",
    "under-100": "Under $100",
    "100-149":   "$100–$149",
    "150-199":   "$150–$199",
    "200-249":   "$200–$249",
    "250-plus":  "$250+",
  };
  return map[range] ?? range;
}

// ── Filter ────────────────────────────────────────────────────────────────────

export function filterPaddles(
  allPaddles: Paddle[],
  filters: ActiveFilters,
  priceCache: PriceCache
): Paddle[] {
  return allPaddles.filter((p) => {
    // Brand
    if (filters.brand !== "All" && p.brand !== filters.brand) return false;

    // Shape
    if (filters.shape !== "All" && p.shape !== filters.shape) return false;

    // Thickness
    if (filters.thickness !== "all" && p.thickness !== filters.thickness) return false;

    // Play Style — skip paddles without a play style when filtering
    // so paddles without categorisation still appear
    if (filters.playStyle !== "all") {
      if (p.playStyle && p.playStyle !== filters.playStyle) return false;
    }

    // Sweet Spot — same: only exclude if the field is set and mismatches
    if (filters.sweetSpot !== "all") {
      if (p.sweetSpot && p.sweetSpot !== filters.sweetSpot) return false;
    }

    // Price range — use cached price or paddle.price string
    if (filters.priceRange !== "all") {
      const price = getEffectivePrice(p.id, p.price, priceCache);
      // If we have no price data, exclude from price-range filters
      if (price === null) return false;
      if (!priceInRange(price, filters.priceRange)) return false;
    }

    return true;
  });
}

// ── Sort ──────────────────────────────────────────────────────────────────────

const HALF_LIFE_MS = 30 * 86_400_000; // 30 days in ms

function weightedHeart(reactions: ReactionMap, id: string): number {
  const e = reactions[id];
  if (!e || e.r !== "heart") return 0;
  return Math.exp(-(Date.now() - e.ts) / HALF_LIFE_MS);
}

// Type for aggregated heart counts from API
export type HeartCountMap = Record<string, number>;

export function sortPaddles(
  paddles:   Paddle[],
  sort:      SortOption,
  priceCache: PriceCache,
  reactions:  ReactionMap = {},
  heartCounts: HeartCountMap = {}
): Paddle[] {
  return [...paddles].sort((a, b) => {
    switch (sort) {
      case "price-high": {
        const pa = getEffectivePrice(a.id, a.price, priceCache) ?? -Infinity;
        const pb = getEffectivePrice(b.id, b.price, priceCache) ?? -Infinity;
        // Paddles without price go to end
        if (pa === -Infinity && pb !== -Infinity) return 1;
        if (pb === -Infinity && pa !== -Infinity) return -1;
        return pb - pa || b.trendingScore - a.trendingScore;
      }

      case "price-low": {
        const pa = getEffectivePrice(a.id, a.price, priceCache) ?? Infinity;
        const pb = getEffectivePrice(b.id, b.price, priceCache) ?? Infinity;
        if (pa === Infinity && pb !== Infinity) return 1;
        if (pb === Infinity && pa !== Infinity) return -1;
        return pa - pb || b.trendingScore - a.trendingScore;
      }

      case "newest":  return b.addedAt.localeCompare(a.addedAt);
      case "oldest":  return a.addedAt.localeCompare(b.addedAt);

      case "most-hearts": {
        const ha = heartCounts[a.id] ?? 0;
        const hb = heartCounts[b.id] ?? 0;
        if (hb !== ha) return hb - ha;
        return b.addedAt.localeCompare(a.addedAt);
      }

      case "power":
        return (b.ratings?.power ?? 0) - (a.ratings?.power ?? 0)
          || b.trendingScore - a.trendingScore;

      case "control":
        return (b.ratings?.control ?? 0) - (a.ratings?.control ?? 0)
          || b.trendingScore - a.trendingScore;

      case "spin":
        return (b.ratings?.spin ?? 0) - (a.ratings?.spin ?? 0)
          || b.trendingScore - a.trendingScore;

      case "twist-weight":
        return (b.twistWeight ?? 0) - (a.twistWeight ?? 0)
          || b.trendingScore - a.trendingScore;

      case "popular-month":
      case "default":
      default: {
        const ha = heartCounts[a.id] ?? 0;
        const hb = heartCounts[b.id] ?? 0;
        if (hb !== ha) return hb - ha;
        return b.addedAt.localeCompare(a.addedAt);
      }
    }
  });
}

// ── Combined ──────────────────────────────────────────────────────────────────

export function applyFiltersAndSort(
  allPaddles: Paddle[],
  filters:    ActiveFilters,
  priceCache: PriceCache,
  reactions:  ReactionMap = {},
  heartCounts: HeartCountMap = {}
): Paddle[] {
  const filtered = filterPaddles(allPaddles, filters, priceCache);
  return sortPaddles(filtered, filters.sort, priceCache, reactions, heartCounts);
}

// ── URL param helpers ─────────────────────────────────────────────────────────

export const DEFAULT_FILTERS: ActiveFilters = {
  brand:      "All",
  shape:      "All",
  priceRange: "all",
  playStyle:  "all",
  thickness:  "all",
  sweetSpot:  "all",
  sort:       "popular-month",
};

const VALID_SORTS: SortOption[] = [
  "default", "price-high", "price-low", "newest", "oldest",
  "most-hearts", "popular-month", "power", "control", "spin", "twist-weight",
];

export function parseSearchParams(
  params: Record<string, string | string[] | undefined>
): ActiveFilters {
  const str = (key: string) => {
    const v = params[key];
    return typeof v === "string" ? v : undefined;
  };

  const sort = str("sort") as SortOption | undefined;

  return {
    brand:      str("brand")     ?? DEFAULT_FILTERS.brand,
    shape:      str("shape")     ?? DEFAULT_FILTERS.shape,
    priceRange: str("price")     ?? DEFAULT_FILTERS.priceRange,
    playStyle:  str("style")     ?? DEFAULT_FILTERS.playStyle,
    thickness:  str("thick")     ?? DEFAULT_FILTERS.thickness,
    sweetSpot:  str("sweet")     ?? DEFAULT_FILTERS.sweetSpot,
    sort:       (sort && VALID_SORTS.includes(sort)) ? sort : DEFAULT_FILTERS.sort,
  };
}

export function filtersToSearchParams(filters: ActiveFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.brand      !== DEFAULT_FILTERS.brand)      p.set("brand",  filters.brand);
  if (filters.shape      !== DEFAULT_FILTERS.shape)      p.set("shape",  filters.shape);
  if (filters.priceRange !== DEFAULT_FILTERS.priceRange) p.set("price",  filters.priceRange);
  if (filters.playStyle  !== DEFAULT_FILTERS.playStyle)  p.set("style",  filters.playStyle);
  if (filters.thickness  !== DEFAULT_FILTERS.thickness)  p.set("thick",  filters.thickness);
  if (filters.sweetSpot  !== DEFAULT_FILTERS.sweetSpot)  p.set("sweet",  filters.sweetSpot);
  if (filters.sort       !== DEFAULT_FILTERS.sort)       p.set("sort",   filters.sort);
  return p;
}

export function countActiveFilters(f: ActiveFilters): number {
  let n = 0;
  if (f.brand      !== "All") n++;
  if (f.shape      !== "All") n++;
  if (f.priceRange !== "all") n++;
  if (f.playStyle  !== "all") n++;
  if (f.thickness  !== "all") n++;
  if (f.sweetSpot  !== "all") n++;
  return n;
}
