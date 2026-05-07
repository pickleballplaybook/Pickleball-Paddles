import type { SupabaseClient } from "@supabase/supabase-js";

export type Platform = "instagram" | "facebook" | "youtube";

export type CampaignRow = {
  id: string;
  name: string;
  keywords: string[];
  platforms: Platform[];
  target_mode: "all" | "specific";
  target_post_ids: string[];
  reply_text: string;
  dm_text: string | null;
  cta_link: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  match_once_per_user: boolean;
};

/**
 * Find the FIRST active campaign that matches a comment.
 * Returns null if nothing matches.
 *
 * Matching rules:
 *  - campaign must be active
 *  - campaign must include this platform
 *  - now must be within starts_at/ends_at window (if set)
 *  - if target_mode = 'specific', post_id must be in target_post_ids
 *  - comment text must contain at least one keyword (case-insensitive, substring)
 *  - the matched keyword is returned
 */
export async function findMatchingCampaign(
  supabase: SupabaseClient,
  opts: {
    platform: Platform;
    postId: string;
    commentText: string;
  }
): Promise<{ campaign: CampaignRow; matchedKeyword: string } | null> {
  const { platform, postId, commentText } = opts;
  const lowerText = commentText.toLowerCase();
  const now = new Date().toISOString();

  const { data: campaigns, error } = await supabase
    .from("auto_reply_campaigns")
    .select("*")
    .eq("is_active", true)
    .contains("platforms", [platform]);

  if (error) {
    console.error("[findMatchingCampaign] query failed:", error);
    return null;
  }

  if (!campaigns || campaigns.length === 0) return null;

  for (const c of campaigns as CampaignRow[]) {
    // Schedule window
    if (c.starts_at && c.starts_at > now) continue;
    if (c.ends_at && c.ends_at < now) continue;

    // Targeting
    if (c.target_mode === "specific") {
      if (!c.target_post_ids?.includes(postId)) continue;
    }

    // Keywords - longest first so "sixzero coral" beats "coral"
    const sortedKeywords = [...c.keywords].sort((a, b) => b.length - a.length);
    const hit = sortedKeywords.find((kw) => lowerText.includes(kw.toLowerCase()));
    if (!hit) continue;

    return { campaign: c, matchedKeyword: hit };
  }

  return null;
}

/**
 * Has this user already triggered this campaign? Used when
 * match_once_per_user is true.
 */
export async function userAlreadyTriggered(
  supabase: SupabaseClient,
  campaignId: string,
  platform: Platform,
  commenterId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("auto_reply_logs")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("platform", platform)
    .eq("commenter_id", commenterId)
    .limit(1);

  if (error) {
    console.error("[userAlreadyTriggered] query failed:", error);
    return false; // fail open - better to risk a duplicate than miss a reply
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Render templates: replace {{name}} tokens.
 */
export function renderTemplate(
  template: string | null | undefined,
  vars: { name?: string }
): string {
  if (!template) return "";
  return template.replace(/\{\{\s*name\s*\}\}/g, vars.name?.split(" ")[0] || "there");
}
