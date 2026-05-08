import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getGoogleConfig, GOOGLE_OAUTH_TOKEN_URL } from "./googleConfig";

export interface YoutubeConnection {
  id: string;
  account_id: string;
  account_name: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
}

/**
 * Returns a valid access_token for a YouTube connection.
 * If the stored token is expired or about to expire (within 5 min),
 * uses the refresh_token to fetch a new one and updates the DB.
 */
export async function getValidAccessToken(conn: YoutubeConnection): Promise<string> {
  const fiveMinFromNow = Date.now() + 5 * 60 * 1000;
  const expiresAt = new Date(conn.token_expires_at).getTime();

  if (expiresAt > fiveMinFromNow) {
    return conn.access_token;
  }

  // Token expired or about to expire - refresh it.
  const cfg = getGoogleConfig();
  const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: conn.refresh_token,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`token refresh failed: ${txt.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope?: string;
  };

  console.log(`[tokenRefresh] conn=${conn.id} got token first=${data.access_token?.slice(0,25)} last=${data.access_token?.slice(-10)} len=${data.access_token?.length} scope=${data.scope || "none"}`);
  try {
    const sb = getSupabaseAdmin();
    await sb.from("auto_reply_logs").insert({
      platform: "youtube",
      comment_id: `debug_refresh_${Date.now()}`,
      post_id: "debug",
      commenter_id: "debug",
      commenter_username: "debug",
      comment_text: `REFRESH: first=${data.access_token?.slice(0,25)} last=${data.access_token?.slice(-10)} len=${data.access_token?.length} scope=${data.scope || "none"} CID_first10=${process.env.GOOGLE_CLIENT_ID?.slice(0,10)} CID_last20=${process.env.GOOGLE_CLIENT_ID?.slice(-20)} CS_first6=${process.env.GOOGLE_CLIENT_SECRET?.slice(0,6)} CS_len=${process.env.GOOGLE_CLIENT_SECRET?.length} REDIRECT=${process.env.GOOGLE_REDIRECT_URI}`,
      reply_status: "skipped",
      reply_error: "debug_refresh",
    });
  } catch {}

  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
  const supabase = getSupabaseAdmin();
  await supabase
    .from("social_connections")
    .update({
      access_token: data.access_token,
      token_expires_at: newExpiresAt,
    })
    .eq("id", conn.id);

  return data.access_token;
}
