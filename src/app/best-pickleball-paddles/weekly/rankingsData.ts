import "server-only";
import { getPaddleBySlug } from "@/data/paddles";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { RankedPaddle } from "@/lib/weeklyNarrative";

// Shared data access for the weekly-rankings pages. Both /weekly (latest) and
// /weekly/[date] (archive) read the same `weekly_rankings` snapshots written by
// the Monday cron, so they render identically.

function hasSupabaseEnv(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function mapRows(rows: Record<string, unknown>[]): RankedPaddle[] {
  return rows
    .map((row) => {
      const paddle = getPaddleBySlug(row.paddle_slug as string);
      if (!paddle) return null;
      return {
        rank: row.rank as number,
        paddle,
        hearts: row.hearts as number,
        ratings: row.ratings as number,
        avgRating: row.avg_rating as number,
        views: row.views as number,
        composite: row.composite as number,
        prevRank: (row.prev_rank as number | null) ?? null,
      } satisfies RankedPaddle;
    })
    .filter(Boolean) as RankedPaddle[];
}

/** Top 10 ranked paddles for a specific week (Monday date, YYYY-MM-DD). */
export async function getWeeklyRankings(weekDate: string): Promise<RankedPaddle[] | null> {
  try {
    if (!hasSupabaseEnv()) return null;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("weekly_rankings")
      .select("*")
      .eq("week_date", weekDate)
      .order("rank", { ascending: true });

    if (error || !data || data.length === 0) return null;
    return mapRows(data);
  } catch {
    return null;
  }
}

/** The most recent week's snapshot — powers the canonical /weekly page. */
export async function getLatestWeek(): Promise<{ weekDate: string; rankings: RankedPaddle[] } | null> {
  try {
    if (!hasSupabaseEnv()) return null;
    const supabase = getSupabaseAdmin();
    const { data: latest } = await supabase
      .from("weekly_rankings")
      .select("week_date")
      .order("week_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latest?.week_date) return null;
    const rankings = await getWeeklyRankings(latest.week_date as string);
    if (!rankings) return null;
    return { weekDate: latest.week_date as string, rankings };
  } catch {
    return null;
  }
}

/** Every week_date with a snapshot, newest first — used for static params. */
export async function getAllWeekDates(): Promise<string[]> {
  try {
    if (!hasSupabaseEnv()) return [];
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("weekly_rankings")
      .select("week_date")
      .order("week_date", { ascending: false });

    if (!data) return [];
    return Array.from(new Set(data.map((d) => d.week_date as string)));
  } catch {
    return [];
  }
}
