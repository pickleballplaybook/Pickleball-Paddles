import { paddles } from "@/data/paddles";
import type { Paddle } from "@/types";

// ── Matchup slug helpers ─────────────────────────────────────────────────────

export function parseMatchup(matchup: string): [string, string] | null {
  const parts = matchup.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}

// Alphabetize so /compare/a-vs-b and /compare/b-vs-a share one canonical URL.
export function canonicalMatchup(a: string, b: string): string {
  return [a, b].sort().join("-vs-");
}

// ── Era-proximity filter ─────────────────────────────────────────────────────
// addedAt is used as a release-year proxy. Paddles bulk-loaded at site launch
// all share "2025-06-01", making them "2025 era" for comparison purposes.
// Rules:
//   - Discontinued paddles: never paired.
//   - Different brands: must be within 1 year.
//   - Same brand: may span up to 2 years (e.g. comparing a series gen-over-gen).

function paddleAddedYear(p: Paddle): number {
  return parseInt(p.addedAt.slice(0, 4), 10);
}

export function shouldComparePaddles(a: Paddle, b: Paddle): boolean {
  if (a.discontinued || b.discontinued) return false;
  const diff = Math.abs(paddleAddedYear(a) - paddleAddedYear(b));
  return a.brand === b.brand ? diff <= 2 : diff <= 1;
}

// ── Static matchup set ───────────────────────────────────────────────────────
// Pre-render every valid pair of the top N most-trending paddles.
// "Valid" means era-proximate and neither paddle discontinued.

export const STATIC_TOP_N = 50;

export function buildStaticMatchups(): string[] {
  const top = [...paddles]
    .filter((p) => !p.discontinued)
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, STATIC_TOP_N);

  const out: string[] = [];
  for (let i = 0; i < top.length; i++) {
    for (let j = i + 1; j < top.length; j++) {
      if (!shouldComparePaddles(top[i], top[j])) continue;
      out.push(canonicalMatchup(top[i].slug, top[j].slug));
    }
  }
  return out;
}
