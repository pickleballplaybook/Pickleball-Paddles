import { Paddle } from "@/types";

export interface RankedPaddle {
  rank: number;
  paddle: Paddle;
  hearts: number;
  ratings: number;
  avgRating: number;
  views: number;
  composite: number;
  prevRank: number | null;
}

export function generateNarrative(rankings: RankedPaddle[]): string {
  if (rankings.length === 0) return "";
  const parts: string[] = [];
  const top = rankings[0];

  // Lead with #1
  parts.push(
    `This week, the ${top.paddle.brand} ${top.paddle.name} takes the #1 spot` +
    ` with ${top.hearts} hearts, ${top.ratings} ratings, and ${top.views} page views.`
  );

  // Movers
  const risers = rankings
    .filter((r) => r.prevRank !== null && r.prevRank > r.rank)
    .sort((a, b) => (b.prevRank! - b.rank) - (a.prevRank! - a.rank));

  for (const r of risers.slice(0, 2)) {
    parts.push(
      `${r.paddle.brand} ${r.paddle.name} climbed from #${r.prevRank} to #${r.rank}.`
    );
  }

  // Newcomers
  const newcomers = rankings.filter((r) => r.prevRank === null);
  if (newcomers.length > 0) {
    const names = newcomers.map((n) => `${n.paddle.brand} ${n.paddle.name} (#${n.rank})`);
    parts.push(`New to the list this week: ${names.join(", ")}.`);
  }

  // Fallers
  const fallers = rankings
    .filter((r) => r.prevRank !== null && r.prevRank < r.rank)
    .sort((a, b) => (a.rank - a.prevRank!) - (b.rank - b.prevRank!));

  if (fallers.length > 0) {
    const f = fallers[0];
    parts.push(
      `${f.paddle.brand} ${f.paddle.name} dropped from #${f.prevRank} to #${f.rank}.`
    );
  }

  return parts.join(" ");
}

export function formatWeekDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}
