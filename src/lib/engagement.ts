// PLACEHOLDER ENGAGEMENT LAYER
//
// Heart / thumbs-down reactions are stored in localStorage via useReactions (hooks/useReactions.ts).
// Key: "ppb_reactions_v1"  →  { [paddleId]: "heart" | "dislike" }
//
// When a server-side API is ready, aggregate these into a score:
//   score = hearts / (hearts + dislikes) × 100
//
// Replace the PLACEHOLDER values below with real DB queries:
//   getTrendingPaddles  →  ORDER BY (hearts - dislikes) DESC
//   getHottestPaddleSlug → paddle with highest net hearts in last 7 days
//
// Also integrate page-view and affiliate-click signals when available.

import { paddles, getPaddleBySlug } from "@/data/paddles";
import { Paddle } from "@/types";

// Trending order — PLACEHOLDER
// Real: SELECT paddle_id FROM reactions WHERE reaction='heart' GROUP BY paddle_id ORDER BY count DESC
const TRENDING_SLUGS = [
  "11six24-hurache-power-2-elongated",
  "bread-and-butter-loco-hybrid",
  "enhance-turbo-mpp-elongated",
  "friday-aura-pro-elongated",
  "11six24-vapor-power-2-hybrid",
];

export function getTrendingPaddles(count = 5): Paddle[] {
  const ordered = TRENDING_SLUGS
    .map((slug) => getPaddleBySlug(slug))
    .filter((p): p is Paddle => !!p);

  if (ordered.length < count) {
    const seen = new Set(ordered.map((p) => p.id));
    const rest = [...paddles]
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .filter((p) => !seen.has(p.id));
    ordered.push(...rest.slice(0, count - ordered.length));
  }

  return ordered.slice(0, count);
}

// Hottest Paddle — PLACEHOLDER
// Real: highest net hearts (hearts - dislikes) across all users
export function getHottestPaddleSlug(): string {
  return "11six24-vapor-power-2-hybrid";
}

// Paddle of the Week — PLACEHOLDER
// Real: highest net hearts in rolling 7-day window
export function getPaddleOfTheWeekSlug(): string {
  return "holbrook-mav-elongated";
}
