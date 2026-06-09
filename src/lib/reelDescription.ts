/**
 * reelDescription
 * ---------------
 * Shared builder for reel/short descriptions used by both:
 *   - /admin/shorts        (Shorts Generator's per-clip description preview)
 *   - /admin/publish       (auto-fill when picking a Shorts clip to publish)
 *
 * Extracted so both pages produce identical descriptions and any future
 * tweak only needs to happen here.
 */

export interface ClipForDescription {
  title?: string;
  reason?: string;
}

// Curated pickleball-only hashtags. Each entry: the hashtag itself plus the
// content keywords that, when present in a clip's title/reason, mark it as
// relevant. Tags without `keywords` are general-purpose fillers used to
// round out a description that didn't match enough content-specific tags.
const PICKLEBALL_HASHTAGS: Array<{ tag: string; keywords?: string[] }> = [
  { tag: "pickleballtips",         keywords: ["tip", "tips", "improve", "better", "guide", "how", "advice"] },
  { tag: "pickleballinstruction",  keywords: ["instruction", "lesson", "lessons", "learn", "teach", "tutorial"] },
  { tag: "pickleballdrills",       keywords: ["drill", "drills", "practice", "exercise", "warmup"] },
  { tag: "pickleballtechnique",    keywords: ["technique", "form", "stance", "grip", "swing", "footwork", "mechanic"] },
  { tag: "pickleballskills",       keywords: ["skill", "skills", "shot", "shots", "serve", "return", "dink", "drop", "lob", "smash", "volley", "reset"] },
  { tag: "pickleballstrategy",     keywords: ["strategy", "tactic", "tactics", "play", "position", "stack", "doubles", "singles"] },
  { tag: "pickleballspin",         keywords: ["spin", "topspin", "backspin", "slice"] },
  { tag: "pickleballpower",        keywords: ["power", "smash", "drive", "putaway"] },
  { tag: "pickleballcontrol",      keywords: ["control", "soft", "touch", "placement", "accuracy"] },
  { tag: "pickleballpaddles",      keywords: ["paddle", "paddles", "selkirk", "joola", "paddletek", "honolulu", "gear", "equipment", "weight", "moi", "tuning", "core"] },
  { tag: "pickleballreview",       keywords: ["review", "reviews", "comparison", "vs", "versus", "test", "tested"] },
  { tag: "pickleballtournament",   keywords: ["tournament", "championship", "competition", "tour", "ppa", "app"] },
  { tag: "pickleballcoach",        keywords: ["coach", "pro", "training"] },
  // Always-on baseline
  { tag: "pickleball" },
  // Generic fillers (no keywords)
  { tag: "pickleballislife" },
  { tag: "pickleballaddict" },
  { tag: "pickleballnation" },
  { tag: "pickleballcommunity" },
  { tag: "pickleballlife" },
];

export function buildHashtagLine(clip: ClipForDescription): string {
  const MAX = 5;
  const text = ((clip.title || "") + " " + (clip.reason || "")).toLowerCase();
  // #pickleball is always first.
  const tags: string[] = ["pickleball"];

  // Add content-matched hashtags by keyword presence.
  for (const { tag, keywords } of PICKLEBALL_HASHTAGS) {
    if (tags.length >= MAX) break;
    if (!keywords || keywords.length === 0) continue;
    if (tags.includes(tag)) continue;
    if (keywords.some((k) => text.includes(k))) tags.push(tag);
  }

  // Fill any remaining slots with general-purpose pickleball tags.
  for (const { tag, keywords } of PICKLEBALL_HASHTAGS) {
    if (tags.length >= MAX) break;
    if (keywords && keywords.length > 0) continue;
    if (tags.includes(tag)) continue;
    tags.push(tag);
  }

  return tags.map((t) => "#" + t).join(" ");
}

export function buildReelDescription(
  clip: ClipForDescription,
  youtubeUrl: string | undefined,
  enabledHandles: string[] = [],
): string {
  const lines: string[] = [];
  if (clip.title) lines.push(clip.title);
  if (clip.reason) lines.push("", clip.reason);
  lines.push("", "Full video on YouTube: " + (youtubeUrl || "(unknown)"));
  if (enabledHandles.length > 0) {
    lines.push("", enabledHandles.map((h) => "@" + h).join(" "));
  }
  lines.push("", buildHashtagLine(clip));
  return lines.join("\n");
}
