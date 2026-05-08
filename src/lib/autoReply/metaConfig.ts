/**
 * Centralizes server-side env access for the Meta OAuth flow.
 * Throws on first read if anything is missing.
 */

export function getMetaConfig() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!appId) throw new Error("META_APP_ID is not set");
  if (!appSecret) throw new Error("META_APP_SECRET is not set");
  if (!verifyToken) throw new Error("META_WEBHOOK_VERIFY_TOKEN is not set");
  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is not set (e.g. https://pickleballplaybook.app)"
    );
  }

  return {
    appId,
    appSecret,
    verifyToken,
    baseUrl: baseUrl.replace(/\/+$/, ""), // trim trailing slash
    redirectUri: `${baseUrl.replace(/\/+$/, "")}/api/auth/meta/callback`,
  };
}

/**
 * Permissions we request during OAuth.
 *
 * Removed deprecated scopes (pages_manage_metadata, pages_messaging) which
 * Meta no longer accepts as standalone permissions. Tradeoff:
 *   - We can't auto-subscribe Pages to webhooks via API (do it manually in
 *     the Meta dashboard for FB Pages instead).
 *   - We can't send FB Page DMs (IG DMs still work fine).
 */
export const META_OAUTH_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_manage_comments",
  "instagram_manage_messages",
  "business_management",
] as const;
