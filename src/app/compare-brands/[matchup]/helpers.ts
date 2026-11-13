import { paddles } from "@/data/paddles";
import { brands, getBrandBySlug } from "@/data/brands";
import type { Paddle } from "@/types";

// Brands to include in pre-rendered matchups. Must be in brands.ts AND have
// enough paddles to make a meaningful comparison.
export const COMPARISON_BRAND_SLUGS = [
  "selkirk",
  "joola",
  "bread-and-butter",
  "11six24",
  "enhance",
  "luzz",
  "gearbox",
  "mint",
  "honolulu",
  "crbn",
];

// ── Slug helpers ──────────────────────────────────────────────────────────────

export function canonicalBrandMatchup(slugA: string, slugB: string): string {
  return [slugA, slugB].sort().join("-vs-");
}

export function parseBrandMatchup(matchup: string): [string, string] | null {
  const parts = matchup.split("-vs-");
  if (parts.length < 2) return null;

  // Brand slugs may contain hyphens themselves. Try every split point to find
  // a valid pair where both halves map to a known brand slug.
  const allSlugs = new Set(brands.map((b) => b.slug));
  for (let i = 1; i < parts.length; i++) {
    const a = parts.slice(0, i).join("-vs-");
    const b = parts.slice(i).join("-vs-");
    if (allSlugs.has(a) && allSlugs.has(b) && a !== b) return [a, b];
  }
  return null;
}

// ── Per-brand computed stats ───────────────────────────────────────────────

export interface BrandStats {
  paddleCount: number;
  avgSwingWeight: number;
  minPrice: number;
  maxPrice: number;
  shapes: string[];
  topPaddles: Paddle[];   // top 3 by trendingScore
}

export function getBrandStats(brandName: string): BrandStats {
  const brandPaddles = paddles.filter((p) => p.brand === brandName && !p.discontinued);

  const swPaddles = brandPaddles.filter((p) => p.swingWeight > 0);
  const avgSW = swPaddles.length
    ? swPaddles.reduce((s, p) => s + p.swingWeight, 0) / swPaddles.length
    : 0;

  const priced = brandPaddles
    .map((p) => (p.price ? parseFloat(p.price.replace(/[^0-9.]/g, "")) : 0))
    .filter((v) => v > 0);

  const shapes = Array.from(new Set(brandPaddles.map((p) => p.shape)));

  const topPaddles = [...brandPaddles]
    .sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0))
    .slice(0, 3);

  return {
    paddleCount: brandPaddles.length,
    avgSwingWeight: parseFloat(avgSW.toFixed(1)),
    minPrice: priced.length ? Math.min(...priced) : 0,
    maxPrice: priced.length ? Math.max(...priced) : 0,
    shapes,
    topPaddles,
  };
}

// ── Build all pre-rendered matchups ───────────────────────────────────────

export function buildBrandMatchups(): string[] {
  const out: string[] = [];
  const slugs = COMPARISON_BRAND_SLUGS.filter((s) => getBrandBySlug(s));
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      out.push(canonicalBrandMatchup(slugs[i], slugs[j]));
    }
  }
  return out;
}
