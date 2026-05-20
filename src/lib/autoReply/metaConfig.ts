/**
 * Centralizes server-side env access for the Meta OAuth flow.
 * Throws on first read if anything is missing.
 *
 * Note: META_APP_SECRET is the Instagram app secret (used for webhook
 * signature verification). META_APP_SECRET_OAUTH is the main Pickleball
 * Drills app secret (used for the Facebook Login token exchange).
 * They are different values for the same parent app.
 */

export function getMetaConfig() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET; // Instagram secret (webhook HMAC)
  const oauthSecret = process.env.META_APP_SECRET_OAUTH; // Main app secret (OAuth)
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!appId) throw new Error("META_APP_ID is not set");
  if (!appSecret) throw new Error("META_APP_SECRET is not set");
  if (!oauthSecret) throw new Error("META_APP_SECRET_OAUTH is not set");
  if (!verifyToken) throw new Error("META_WEBHOOK_VERIFY_TOKEN is not set");
  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is not set (e.g. https://playbookpaddles.com)"
    );
  }

  return {
    appId,
    appSecret,        // for webhook signatures
    oauthSecret,      // for OAuth code exchange
    verifyToken,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    redirectUri: `${baseUrl.replace(/\/+$/, "")}/api/auth/meta/callback`,
  };
}

/**
 * Permissions we request during OAuth.
 * Removed deprecated scopes that Meta no longer accepts standalone.
 */
export const META_OAUTH_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",   // required to subscribe the Page to webhooks
  "pages_manage_engagement", // required to post FB comment replies
  "pages_read_user_content", // implicit dependency of pages_manage_engagement
  "instagram_basic",
  "instagram_manage_comments",
  "instagram_manage_messages",
  "business_management",
] as const;
