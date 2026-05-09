import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { paddles } from "@/data/paddles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const YT_API = "https://www.googleapis.com/youtube/v3";
const CHANNEL_ID = "UCikz-D2j4_jMVYZrQuPin6A";

/**
 * GET /api/cron/sync-reviews?secret=...
 *
 * Daily cron job that:
 *  1. Fetches the latest uploads from the Pickleball Playbook YouTube channel
 *  2. Fuzzy-matches video titles to paddle names in the database
 *  3. Upserts new matches into the `paddle_review_videos` Supabase table
 *
 * Uses YouTube Data API v3 with an API key (no OAuth required).
 * Triggered daily at noon via Vercel Cron.
 */
export async function GET(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const querySecret = new URL(req.url).searchParams.get("secret");
  const authHeader = req.headers.get("authorization");
  const headerSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  if (
    querySecret !== process.env.CRON_SECRET &&
    headerSecret !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    // ── Step 1: Get the channel's uploads playlist ──────────────────────────
    const channelRes = await fetch(
      `${YT_API}/channels?part=contentDetails&id=${CHANNEL_ID}&key=${apiKey}`
    );
    if (!channelRes.ok) {
      throw new Error(`Channel fetch failed: ${channelRes.status}`);
    }
    const channelData = await channelRes.json();
    const uploadsPlaylistId =
      channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
      throw new Error("No uploads playlist found");
    }

    // ── Step 2: Fetch the latest 50 videos (most recent uploads) ────────────
    const playlistRes = await fetch(
      `${YT_API}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`
    );
    if (!playlistRes.ok) {
      throw new Error(`Playlist fetch failed: ${playlistRes.status}`);
    }
    const playlistData = await playlistRes.json();
    const videos: Array<{
      videoId: string;
      title: string;
      publishedAt: string;
    }> = [];

    for (const item of playlistData.items ?? []) {
      const snippet = item.snippet;
      const videoId = snippet?.resourceId?.videoId;
      if (videoId) {
        videos.push({
          videoId,
          title: snippet.title ?? "",
          publishedAt: snippet.publishedAt ?? "",
        });
      }
    }

    // ── Step 3: Match videos to paddles ──────────────────────────────────────
    // Build a set of paddles that already have reviewUrls (skip these)
    const paddlesWithReviews = new Set(
      paddles
        .filter((p) => p.reviewUrl || p.manualVideoId)
        .flatMap((p) => {
          const ids: string[] = [];
          if (p.manualVideoId) ids.push(p.manualVideoId);
          if (p.reviewUrl) {
            const match = p.reviewUrl.match(
              /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([^?&/]+)/
            );
            if (match) ids.push(match[1]);
          }
          return ids;
        })
    );

    const matches: Array<{
      paddle_slug: string;
      video_id: string;
      video_title: string;
      published_at: string;
    }> = [];

    for (const video of videos) {
      // Skip videos we already have linked
      if (paddlesWithReviews.has(video.videoId)) continue;

      const titleLower = video.title.toLowerCase();

      for (const paddle of paddles) {
        // Skip paddles that already have a review
        if (paddle.reviewUrl || paddle.manualVideoId) continue;

        // Match by paddle name in video title
        const nameLower = paddle.name.toLowerCase();
        const brandLower = paddle.brand.toLowerCase();

        // Try full paddle name match
        let matched = titleLower.includes(nameLower);

        // Also try brand + significant words from name
        if (!matched) {
          const words = nameLower
            .split(/\s+/)
            .filter((w) => w.length >= 3);
          matched =
            titleLower.includes(brandLower) &&
            words.length > 0 &&
            words.every((w) => titleLower.includes(w));
        }

        if (matched) {
          matches.push({
            paddle_slug: paddle.slug,
            video_id: video.videoId,
            video_title: video.title,
            published_at: video.publishedAt,
          });
        }
      }
    }

    // ── Step 4: Upsert matches into Supabase ────────────────────────────────
    const supabase = getSupabaseAdmin();
    let upserted = 0;

    if (matches.length > 0) {
      const rows = matches.map((m) => ({
        paddle_slug: m.paddle_slug,
        video_id: m.video_id,
        video_title: m.video_title,
        video_url: `https://youtu.be/${m.video_id}`,
        published_at: m.published_at,
        matched_at: new Date().toISOString(),
      }));

      const { data, error: upsertErr } = await supabase
        .from("paddle_review_videos")
        .upsert(rows, { onConflict: "paddle_slug,video_id" })
        .select("paddle_slug");

      if (upsertErr) {
        throw new Error(`Supabase upsert failed: ${upsertErr.message}`);
      }
      upserted = data?.length ?? 0;
    }

    return NextResponse.json({
      synced_at: new Date().toISOString(),
      channel: CHANNEL_ID,
      videos_fetched: videos.length,
      new_matches: matches.length,
      upserted,
      matches: matches.map((m) => ({
        paddle: m.paddle_slug,
        video: m.video_title,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message, synced_at: new Date().toISOString() },
      { status: 500 }
    );
  }
}
