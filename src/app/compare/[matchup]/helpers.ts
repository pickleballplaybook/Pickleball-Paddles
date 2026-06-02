import { paddles } from "@/data/paddles";

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

// ── Static matchup set ───────────────────────────────────────────────────────
// Pre-render every pair of the top N most-trending paddles. Strategic SEO
// surface area; any other pair still renders on-demand via dynamicParams.

export const STATIC_TOP_N = 30;

function topPaddleSlugs(n: number): string[] {
  return [...paddles]
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, n)
    .map((p) => p.slug);
}

export function buildStaticMatchups(): string[] {
  const top = topPaddleSlugs(STATIC_TOP_N);
  const out: string[] = [];
  for (let i = 0; i < top.length; i++) {
    for (let j = i + 1; j < top.length; j++) {
      out.push(canonicalMatchup(top[i], top[j]));
    }
  }
  return out;
}
