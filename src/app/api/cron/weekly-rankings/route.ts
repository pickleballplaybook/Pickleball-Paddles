import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { paddles } from "@/data/paddles";
import { submitToIndexNow } from "@/lib/indexnow";
import { engagementScore } from "@/lib/trending";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/weekly-rankings?secret=...
 *
 * Weekly cron (Monday 6am UTC) that snapshots the top 10 paddles
 * by composite engagement score (hearts + ratings + views/10)
 * into the `weekly_rankings` Supabase table.
 */
export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const querySecret = new URL(req.url).searchParams.get("secret");
  const authHeader = req.headers.get("authorization");
  const headerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (querySecret !== process.env.CRON_SECRET && headerSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  try {
    // ── 1. Fetch engagement data (rolling 7-day window) ───────────────────
    // Mirrors the /trending page: rank by activity in the trailing 7 days, not
    // all-time totals, so a paddle with stale-but-high lifetime views can't
    // dominate the weekly snapshot.
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const [heartsRes, ratingsRes, viewsRes] = await Promise.all([
      supabase.from("paddle_hearts").select("paddle_id").gte("created_at", sevenDaysAgo),
      supabase.from("paddle_ratings").select("paddle_id, stars").gte("created_at", sevenDaysAgo),
      supabase.from("page_views").select("slug").eq("page_type", "paddle").gte("created_at", sevenDaysAgo),
    ]);

    // Aggregate hearts by paddle_id
    const heartCounts = new Map<string, number>();
    for (const row of heartsRes.data ?? []) {
      heartCounts.set(row.paddle_id, (heartCounts.get(row.paddle_id) ?? 0) + 1);
    }

    // Aggregate ratings by paddle_id
    const ratingAgg = new Map<string, { count: number; sum: number }>();
    for (const row of ratingsRes.data ?? []) {
      const entry = ratingAgg.get(row.paddle_id) ?? { count: 0, sum: 0 };
      entry.count += 1;
      entry.sum += row.stars;
      ratingAgg.set(row.paddle_id, entry);
    }

    // Aggregate views by slug
    const viewCounts = new Map<string, number>();
    for (const row of viewsRes.data ?? []) {
      viewCounts.set(row.slug, (viewCounts.get(row.slug) ?? 0) + 1);
    }

    // ── 2. Compute composite scores ──────────────────────────────────────
    const scored = paddles.map((p) => {
      const hearts = heartCounts.get(p.id) ?? 0;
      const rating = ratingAgg.get(p.id);
      const ratings = rating?.count ?? 0;
      const avgRating = rating ? Math.round((rating.sum / rating.count) * 100) / 100 : 0;
      const views = viewCounts.get(p.slug) ?? 0;
      const composite = engagementScore(hearts, ratings, views);
      return { paddle: p, hearts, ratings, avgRating, views, composite };
    });

    scored.sort((a, b) => b.composite - a.composite);
    const top10 = scored.slice(0, 10);

    // ── 3. Determine this week's Monday ──────────────────────────────────
    const now = new Date();
    const day = now.getUTCDay();
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - ((day + 6) % 7));
    const weekDate = monday.toISOString().split("T")[0];

    // ── 4. Get the prior week's snapshot for rank diffs ───────────────────
    // Strictly-earlier week so movement is always week-over-week — and so
    // re-running the cron within the same week compares to the previous week
    // rather than to the version of this week it's about to overwrite.
    const { data: prevWeekData } = await supabase
      .from("weekly_rankings")
      .select("week_date")
      .lt("week_date", weekDate)
      .order("week_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const prevRankMap = new Map<string, number>();
    if (prevWeekData?.week_date) {
      const { data: prevRows } = await supabase
        .from("weekly_rankings")
        .select("paddle_slug, rank")
        .eq("week_date", prevWeekData.week_date);

      for (const row of prevRows ?? []) {
        prevRankMap.set(row.paddle_slug, row.rank);
      }
    }

    // ── 5. Delete any existing rows for this week and insert fresh ────────
    await supabase.from("weekly_rankings").delete().eq("week_date", weekDate);

    const rows = top10.map(({ paddle, hearts, ratings, avgRating, views, composite }, i) => ({
      week_date: weekDate,
      rank: i + 1,
      paddle_id: paddle.id,
      paddle_slug: paddle.slug,
      hearts,
      ratings,
      avg_rating: avgRating,
      views,
      composite,
      prev_rank: prevRankMap.get(paddle.slug) ?? null,
    }));

    const { error: insertError } = await supabase.from("weekly_rankings").insert(rows);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // ── 6. Revalidate pages ──────────────────────────────────────────────
    revalidatePath("/best-pickleball-paddles/weekly");
    revalidatePath(`/best-pickleball-paddles/weekly/${weekDate}`);

    // ── 7. Notify search engines via IndexNow ────────────────────────────
    await submitToIndexNow([
      "https://playbookpaddles.com/best-pickleball-paddles",
      "https://playbookpaddles.com/best-pickleball-paddles/weekly",
      `https://playbookpaddles.com/best-pickleball-paddles/weekly/${weekDate}`,
    ]);

    return NextResponse.json({
      ok: true,
      weekDate,
      top10: top10.map((t, i) => ({
        rank: i + 1,
        slug: t.paddle.slug,
        composite: t.composite,
        prevRank: prevRankMap.get(t.paddle.slug) ?? null,
      })),
    });
  } catch (err) {
    console.error("[weekly-rankings] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
