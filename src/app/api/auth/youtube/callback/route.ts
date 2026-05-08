import { NextRequest, NextResponse } from "next/server";
import { getGoogleConfig, GOOGLE_OAUTH_TOKEN_URL } from "@/lib/youtube/googleConfig";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/youtube/callback?code=...
 *
 * Google redirects here after the user approves OAuth. We exchange the
 * one-time code for an access_token + refresh_token, fetch the channel
 * details, and save everything to social_connections.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const dashboardUrl = "/admin/auto-reply/connections";

  if (error) {
    return NextResponse.redirect(
      new URL(
        `${dashboardUrl}?status=error&message=${encodeURIComponent(error)}`,
        url.origin
      )
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`${dashboardUrl}?status=error&message=missing_code`, url.origin)
    );
  }

  const cfg = getGoogleConfig();

  try {
    // Step 1: exchange code for tokens
    const tokenRes = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        redirect_uri: cfg.redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      throw new Error(`token exchange failed: ${txt.slice(0, 200)}`);
    }

    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
      token_type: string;
    };

    if (!tokens.refresh_token) {
      // This usually means the user has previously authorized this app
      // without prompt=consent. We force consent in /start so this should
      // always come through, but we double-check.
      throw new Error(
        "no refresh_token received - try revoking app access and reconnecting"
      );
    }

    // Step 2: fetch channel info using the new access_token
    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    if (!channelRes.ok) {
      const txt = await channelRes.text();
      throw new Error(`channel fetch failed: ${txt.slice(0, 200)}`);
    }

    const channelData = (await channelRes.json()) as {
      items: Array<{
        id: string;
        snippet: { title: string; customUrl?: string };
      }>;
    };

    if (!channelData.items?.length) {
      throw new Error("no YouTube channel found on this Google account");
    }

    const channel = channelData.items[0];
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Step 3: upsert into social_connections
    const supabase = getSupabaseAdmin();
    const { error: dbError } = await supabase
      .from("social_connections")
      .upsert(
        {
          platform: "youtube",
          account_id: channel.id,
          account_name: channel.snippet.customUrl
            ? (channel.snippet.customUrl.startsWith("@") ? channel.snippet.customUrl : `@${channel.snippet.customUrl}`)
            : channel.snippet.title,
          page_id: null,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt,
          metadata: {
            channel_title: channel.snippet.title,
            scope: tokens.scope,
          },
          is_active: true,
        },
        { onConflict: "platform,account_id" }
      );

    if (dbError) {
      throw new Error(`db upsert failed: ${dbError.message}`);
    }

    return NextResponse.redirect(
      new URL(
        `${dashboardUrl}?status=ok&message=youtube_connected`,
        url.origin
      )
    );
  } catch (err: any) {
    console.error("[youtube oauth callback]", err);
    return NextResponse.redirect(
      new URL(
        `${dashboardUrl}?status=error&message=${encodeURIComponent(
          err?.message || "unknown_error"
        )}`,
        url.origin
      )
    );
  }
}
