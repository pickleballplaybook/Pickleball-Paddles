/**
 * Centralizes Google OAuth + YouTube API config.
 * Throws on first read if anything is missing.
 */
export function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not set");
  if (!clientSecret) throw new Error("GOOGLE_CLIENT_SECRET is not set");
  if (!redirectUri) throw new Error("GOOGLE_REDIRECT_URI is not set");

  return { clientId, clientSecret, redirectUri };
}

// youtube.force-ssl gives us read AND write (post replies). The single scope
// covers everything we need.
export const YOUTUBE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/youtube.force-ssl",
  "https://www.googleapis.com/auth/userinfo.email",
] as const;

export const GOOGLE_OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
