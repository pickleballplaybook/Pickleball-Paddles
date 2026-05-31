import { NextResponse } from "next/server";
import { getGoogleConfig, GOOGLE_OAUTH_AUTH_URL, YOUTUBE_OAUTH_SCOPES } from "@/lib/youtube/googleConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/youtube/start
 *
 * Redirects the user to Google's OAuth consent screen.
 * After approval, Google redirects back to /api/auth/youtube/callback.
 */
export async function GET() {
  const cfg = getGoogleConfig();

  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: YOUTUBE_OAUTH_SCOPES.join(" "),
    // access_type=offline gets us a refresh_token. Without it, the access
    // token expires after 1 hour and we'd have to re-auth manually.
    access_type: "offline",
    // select_account: show Google's account chooser even when one is signed
    // in, so the user can pick a different channel than last time (needed
    // for adding a second YouTube channel like @playbookreviews alongside
    // @pickleballplaybook). consent: still force the consent screen so we
    // always get a fresh refresh_token.
    prompt: "select_account consent",
  });

  return NextResponse.redirect(`${GOOGLE_OAUTH_AUTH_URL}?${params.toString()}`);
}
