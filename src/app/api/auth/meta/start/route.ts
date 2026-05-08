import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getMetaConfig, META_OAUTH_SCOPES } from "@/lib/autoReply/metaConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/meta/start
 *
 * Generates a CSRF state token, stashes it in an httpOnly cookie, and
 * redirects the browser to Facebook's OAuth dialog. After the user approves,
 * Facebook redirects back to /api/auth/meta/callback with a code+state.
 *
 * Even though we're connecting Instagram, we use the *Facebook* OAuth dialog
 * because IG Business accounts authenticate through the linked Page.
 */
export async function GET(req: NextRequest) {
  let cfg;
  try {
    cfg = getMetaConfig();
  } catch (err: any) {
    return new NextResponse(`config error: ${err.message}`, { status: 500 });
  }

  // CSRF protection: random state we'll verify on callback
  const state = crypto.randomBytes(32).toString("hex");

  const params = new URLSearchParams({
    client_id: cfg.appId,
    redirect_uri: cfg.redirectUri,
    state,
    scope: META_OAUTH_SCOPES.join(","),
    response_type: "code",
    auth_type: "rerequest", // forces dialog even if already approved
  });

  const dialogUrl = `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;

  const res = NextResponse.redirect(dialogUrl);
  res.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });
  return res;
}
