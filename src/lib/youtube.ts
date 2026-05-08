/**
 * YouTube Utilities — Pickleball Playbook
 *
 * This module handles:
 *   1. Fetching videos from a YouTube playlist via the YouTube Data API v3
 *   2. Auto-matching playlist videos to paddles by paddle name in video title
 *   3. Graceful fallback to manualVideoId when API is not configured or no match
 *
 * To activate auto-matching:
 *   1. Set youtubeApiKey in src/config/site.ts
 *   2. Set youtubePlaylistUrl in src/config/site.ts
 *   3. Redeploy — the matching happens at build time (Next.js server component)
 */

import { siteConfig } from "@/config/site";
import { Paddle, ReviewGroup, YouTubeVideo } from "@/types";

// ── Extract YouTube video ID from any YouTube URL ─────────────────────────────
export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0] || null;
    if (u.hostname.includes("youtube.com")) {
      const parts = u.pathname.split("/");
      const si = parts.indexOf("shorts");
      if (si !== -1) return parts[si + 1] || null;
      return u.searchParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
}

// ── Extract playlist ID from a full playlist URL ──────────────────────────────
function extractPlaylistId(url: string): string | null {
  try {
    const u = new URL(url);
    return u.searchParams.get("list");
  } catch {
    return null;
  }
}

// ── Fetch all videos from a playlist (handles pagination) ────────────────────
export async function fetchPlaylistVideos(): Promise<YouTubeVideo[]> {
  const apiKey = siteConfig.youtubeApiKey;
  const playlistId = extractPlaylistId(siteConfig.youtubePlaylistUrl);

  if (!apiKey || !playlistId || playlistId === "REPLACE_WITH_YOUR_PLAYLIST_ID") {
    return [];
  }

  const videos: YouTubeVideo[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const params = new URLSearchParams({
        part: "snippet",
        playlistId,
        maxResults: "50",
        key: apiKey,
        ...(pageToken ? { pageToken } : {}),
      });

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?${params}`,
        { next: { revalidate: 3600 } } // cache for 1 hour
      );

      if (!res.ok) break;

      const data = await res.json();

      for (const item of data.items ?? []) {
        const snippet = item.snippet;
        const videoId = snippet?.resourceId?.videoId;
        if (!videoId) continue;

        videos.push({
          videoId,
          title: snippet.title ?? "",
          thumbnail:
            snippet.thumbnails?.maxres?.url ??
            snippet.thumbnails?.high?.url ??
            snippet.thumbnails?.medium?.url ??
            `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          publishedAt: snippet.publishedAt ?? "",
          description: snippet.description ?? "",
        });
      }

      pageToken = data.nextPageToken;
    } while (pageToken);
  } catch {
    // API failure — fall through to manual IDs
  }

  return videos;
}

// ── Match a paddle to a video by searching for paddle name in video title ─────
export function matchVideoToPaddle(
  paddle: Paddle,
  videos: YouTubeVideo[]
): YouTubeVideo | null {
  if (!videos.length) return null;

  const paddleNameLower = paddle.name.toLowerCase();

  // Exact name match first
  let match = videos.find((v) =>
    v.title.toLowerCase().includes(paddleNameLower)
  );

  // Fallback: match significant words (>= 4 chars) from paddle name
  if (!match) {
    const words = paddleNameLower
      .split(/\s+/)
      .filter((w) => w.length >= 4);

    match = videos.find((v) => {
      const titleLower = v.title.toLowerCase();
      return words.every((w) => titleLower.includes(w));
    });
  }

  return match ?? null;
}

// ── Get the resolved video ID for a paddle ────────────────────────────────────
// Priority: reviewUrl (CSV) > manualVideoId > playlist match > null
export async function getVideoForPaddle(
  paddle: Paddle,
  playlistVideos: YouTubeVideo[]
): Promise<{ videoId: string | null; source: "manual" | "playlist" | "none" }> {
  if (paddle.reviewUrl) {
    const id = extractYouTubeId(paddle.reviewUrl);
    if (id) return { videoId: id, source: "manual" };
  }
  if (paddle.manualVideoId) {
    return { videoId: paddle.manualVideoId, source: "manual" };
  }
  const matched = matchVideoToPaddle(paddle, playlistVideos);
  if (matched) return { videoId: matched.videoId, source: "playlist" };
  return { videoId: null, source: "none" };
}

// ── Fetch view counts for video IDs via YouTube Data API v3 ──────────────────
// Returns { videoId: viewCount } — empty map if no API key configured
// Cached for 1 hour so counts stay reasonably fresh without hammering the API
export async function fetchVideoViewCounts(
  videoIds: string[]
): Promise<Record<string, number>> {
  const apiKey = siteConfig.youtubeApiKey;
  if (!apiKey || !videoIds.length) return {};
  const result: Record<string, number> = {};
  try {
    // API allows up to 50 IDs per request
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);
      const params = new URLSearchParams({ part: "statistics", id: batch.join(","), key: apiKey });
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?${params}`,
        { next: { revalidate: 3600 } } // cache 1 hour
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const item of data.items ?? []) {
        const n = parseInt(item.statistics?.viewCount ?? "", 10);
        if (!isNaN(n)) result[item.id] = n;
      }
    }
  } catch {
    // silently return whatever we have
  }
  return result;
}

// ── Fetch publish dates for video IDs via YouTube Data API v3 ─────────────────
// Returns { videoId: "YYYY-MM-DD" } — empty map if no API key configured
export async function fetchVideoPublishDates(
  videoIds: string[]
): Promise<Record<string, string>> {
  const apiKey = siteConfig.youtubeApiKey;
  if (!apiKey || !videoIds.length) return {};
  try {
    const params = new URLSearchParams({ part: "snippet", id: videoIds.join(","), key: apiKey });
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params}`,
      { next: { revalidate: 86400 } } // cache 24 h
    );
    if (!res.ok) return {};
    const data = await res.json();
    const result: Record<string, string> = {};
    for (const item of data.items ?? []) {
      const d: string = item.snippet?.publishedAt ?? "";
      if (d) result[item.id] = d.slice(0, 10);
    }
    return result;
  } catch {
    return {};
  }
}

// ── Build a combined review title for paddles sharing one video ────────────────
function buildGroupTitle(brand: string, names: string[]): string {
  if (names.length === 1) return names[0];
  const wordSets = names.map((n) => new Set(n.toLowerCase().split(/\s+/)));
  const common = Array.from(wordSets[0]).filter((w) => wordSets.every((s) => s.has(w)));
  if (common.length > 0) {
    const ordered = names[0].split(/\s+/).filter((w) => common.includes(w.toLowerCase())).join(" ");
    return `${brand} ${ordered} Review`;
  }
  return `${brand} Paddle Review`;
}

// ── Group paddles by video, fetch real publish dates, sort newest-first ────────
// manualDates  = reviewDates map from paddles.ts (fallback / manual corrections)
// API dates override manual dates when youtubeApiKey is configured
export async function getReviewGroups(
  paddles: Paddle[],
  manualDates: Record<string, string>
): Promise<ReviewGroup[]> {
  // Collect unique video IDs across all paddles with a review
  const videoIds = Array.from(
    new Set(
      paddles
        .filter((p) => p.reviewUrl || p.manualVideoId)
        .map((p) => (p.reviewUrl ? extractYouTubeId(p.reviewUrl) : null) ?? p.manualVideoId ?? "")
        .filter(Boolean) as string[]
    )
  );

  const [apiDates, viewCounts] = await Promise.all([
    fetchVideoPublishDates(videoIds),
    fetchVideoViewCounts(videoIds),
  ]);
  // API dates win; non-empty manual dates act as fallback / correction
  const dates: Record<string, string> = { ...manualDates };
  for (const [id, d] of Object.entries(apiDates)) {
    if (d) dates[id] = d;
  }

  // Group: videoId → { brand, name→slug map, top paddle, latest addedAt }
  type Entry = { brand: string; paddleMap: Map<string, string>; topSlug: string; topScore: number; latestAddedAt: string };
  const map = new Map<string, Entry>();

  for (const p of paddles) {
    if (!p.reviewUrl && !p.manualVideoId) continue;
    const vid = (p.reviewUrl ? extractYouTubeId(p.reviewUrl) : null) ?? p.manualVideoId ?? "";
    if (!vid) continue;
    if (!map.has(vid)) {
      map.set(vid, { brand: p.brand, paddleMap: new Map(), topSlug: p.slug, topScore: -1, latestAddedAt: "" });
    }
    const entry = map.get(vid)!;
    entry.paddleMap.set(p.name, p.slug);
    if (p.trendingScore > entry.topScore) {
      entry.topScore = p.trendingScore;
      entry.topSlug = p.slug;
    }
    // Track the most recent addedAt among paddles sharing this video
    if (p.addedAt && p.addedAt > entry.latestAddedAt) {
      entry.latestAddedAt = p.addedAt;
    }
  }

  return Array.from(map.entries())
    .map(([videoId, { brand, paddleMap, topSlug, latestAddedAt }]) => {
      const paddleList = Array.from(paddleMap.entries()).map(([name, slug]) => ({ name, slug }));
      // Priority: YouTube API date > manual reviewDates entry > paddle's addedAt (automatic fallback)
      const reviewDate = dates[videoId] || latestAddedAt;
      return {
        videoId,
        brand,
        title: buildGroupTitle(brand, paddleList.map((p) => p.name)),
        paddles: paddleList,
        primarySlug: topSlug,
        reviewDate,
        viewCount: viewCounts[videoId],
      };
    })
    .sort((a, b) => {
      if (!a.reviewDate && !b.reviewDate) return 0;
      if (!a.reviewDate) return 1;
      if (!b.reviewDate) return -1;
      return b.reviewDate.localeCompare(a.reviewDate);
    });
}

// ── Get latest N videos from the playlist (for Latest Reviews section) ────────
export function getLatestVideos(
  videos: YouTubeVideo[],
  count: number
): YouTubeVideo[] {
  return [...videos]
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, count);
}
