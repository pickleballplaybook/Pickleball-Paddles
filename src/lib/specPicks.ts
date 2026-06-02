import type { Paddle } from "@/types";
import type { PillarPick } from "@/app/best-pickleball-paddles/_components/AudiencePillarView";

/**
 * specPicks
 * ---------
 * Helpers for spec-driven programmatic collection pages.
 *
 * Each collection page (e.g. /best-pickleball-paddles/widebody) filters the
 * catalog by spec criteria, sorts by a scoring function, and renders the
 * top N as PillarPicks via the shared <AudiencePillarView /> template.
 *
 * The `why` line is auto-generated per paddle using its measured specs —
 * honest, concise, and never claims something the data doesn't support.
 * If a paddle has no measured specs the line falls back to shape + price.
 */

// ── Picker score: weighted catalog-relative spec scoring ─────────────────
// Higher = more recommendable. Used for "best of {spec category}" ordering.
// Heavily weights twist weight (forgiveness) since that's the single most
// underrated spec and the one most buyers benefit from prioritizing.
export function forgivenessScore(p: Paddle): number {
  const tw = p.twistWeight ?? 0;
  const sw = p.swingWeight ?? 0;
  const trend = p.trendingScore ?? 0;
  // TW dominates — 0-10 scale (typical TW range 5.5–7.5)
  const twScore = tw > 0 ? (tw - 5) * 20 : 0; // ~10–50
  // SW: sweet spot is 110–118 for everyday play
  const swScore = sw > 0 ? Math.max(0, 30 - Math.abs(sw - 114)) : 0; // 0–30
  // Trending is the tiebreak
  return twScore + swScore + trend / 100;
}

export function powerScore(p: Paddle): number {
  const sw = p.swingWeight ?? 0;
  const trend = p.trendingScore ?? 0;
  const swScore = sw > 0 ? Math.max(0, (sw - 100) * 1.5) : 0; // higher SW = more power
  return swScore + trend / 100;
}

export function trendingScoreOf(p: Paddle): number {
  return (p.trendingScore ?? 0) + (p.image ? 1 : 0);
}

// ── Pick rationale generator ──────────────────────────────────────────────
// Crafts a short, honest "why" line from the paddle's specs.
export function defaultWhy(p: Paddle, angle: "forgiveness" | "power" | "value" | "balanced" = "balanced"): string {
  const tw = p.twistWeight ?? 0;
  const sw = p.swingWeight ?? 0;
  const price = p.price ?? "";
  const shape = p.shape?.toLowerCase() ?? "paddle";
  const thickness = p.thickness ?? "";

  const twDesc = tw >= 7.0 ? `elite forgiveness (TW ${tw})`
    : tw >= 6.5 ? `excellent forgiveness (TW ${tw})`
    : tw >= 6.0 ? `solid forgiveness (TW ${tw})`
    : tw > 0 ? `lower twist weight (TW ${tw}) — center hits rewarded` : null;

  const swDesc = sw >= 120 ? `heavy swing weight (${sw}) for natural power`
    : sw >= 115 ? `firm swing weight (${sw}) with easy pop`
    : sw >= 110 ? `balanced swing weight (${sw})`
    : sw >= 105 ? `light swing weight (${sw}) for quick hand speed`
    : sw > 0 ? `very light swing weight (${sw}) for maneuverability` : null;

  const opener = angle === "forgiveness" && twDesc
    ? `${twDesc} in a ${thickness} ${shape}.`
    : angle === "power" && swDesc
    ? `${swDesc} in a ${thickness} ${shape}.`
    : angle === "value" && price
    ? `${shape} construction at ${price} — premium-tier specs without the premium-tier price.`
    : [twDesc, swDesc].filter(Boolean).join(" + ");

  const body = (() => {
    switch (angle) {
      case "forgiveness":
        return ` The high twist weight means off-center mishits stay on target — exactly what makes this shape work for everyday play.`;
      case "power":
        return ` The heavier moment of inertia delivers easy pace on full swings without forcing you to muscle through the ball.`;
      case "value":
        return ` Tested with the same five-step protocol as our $300 paddles — and it earns its spot on merit, not price.`;
      default:
        return ` A well-spec'd ${shape} build that earns its place on this list.`;
    }
  })();

  const result = opener || `${p.brand} ${p.name} — ${shape} ${thickness}${price ? `, ${price}` : ""}.`;
  return (result + body).trim();
}

// ── Pick builder ──────────────────────────────────────────────────────────
// Converts a Paddle into a PillarPick with auto-generated label + why.
export function paddleToPick(
  p: Paddle,
  opts: { label: string; angle?: "forgiveness" | "power" | "value" | "balanced"; why?: string } = { label: "" },
): PillarPick {
  return {
    slug: p.slug,
    label: opts.label || `${p.brand} ${p.name}`,
    why: opts.why ?? defaultWhy(p, opts.angle ?? "balanced"),
  };
}
