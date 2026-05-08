import { NextRequest, NextResponse } from "next/server";
import { getMetaConfig } from "@/lib/autoReply/metaConfig";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRAPH = "https://graph.facebook.com/v21.0";

/**
 * GET /api/auth/meta/callback?code=...&state=...
 *
 * Step-by-step:
 *  1. Verify CSRF state cookie
 *  2. Exchange the short-lived code for a short-lived user access token
 *  3. Exchange short-lived token for a LONG-lived user token (~60 days)
 *  4. Fetch user's Pages with their page-scoped access tokens
 *  5. For each Page, look up its connected IG Business Account
 *  6. Subscribe the Page to webhooks (so comments fire to our endpoint)
 *  7. Upsert rows in social_connections for FB Page + IG account
 *  8. Redirect back to admin connections page
 */
export async function GET(req: NextRequest) {
  let cfg;
  try {
    cfg = getMetaConfig();
  } catch (err: any) {
    return new NextResponse(`config error: ${err.message}`, { status: 500 });
  }

  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");
  const errorReason = params.get("error_reason");

  if (error) {
    return redirectToConnections(req, {
      status: "error",
      message: `${error}: ${errorReason || params.get("error_description") || ""}`,
    });
  }

  if (!code || !state) {
    return redirectToConnections(req, {
      status: "error",
      message: "missing code or state from Meta callback",
    });
  }

  // 1. CSRF check
  const cookieState = req.cookies.get("meta_oauth_state")?.value;
  if (!cookieState || cookieState !== state) {
    return redirectToConnections(req, {
      status: "error",
      message: "csrf state mismatch - try connecting again",
    });
  }

  try {
    // 2. Short-lived user token
    const shortToken = await exchangeCodeForToken(code, cfg);

    // 3. Long-lived user token (~60 days)
    const longToken = await exchangeForLongLivedToken(shortToken, cfg);

    // 4. Get user's Pages (each Page has its own access_token)
    const pages = await fetchUserPages(longToken);
    if (pages.length === 0) {
      return redirectToConnections(req, {
        status: "error",
        message:
          "no Facebook Pages found - connect your IG to a Facebook Page first",
      });
    }

    const supabase = getSupabaseAdmin();
    const savedPages: string[] = [];
    const savedIg: string[] = [];

    // 5+6+7: For each Page, save FB connection, look up IG, subscribe webhook
    for (const page of pages) {
      // Save the Page connection itself
      await upsertConnection(supabase, {
        platform: "facebook",
        account_id: page.id,
        account_name: page.name,
        access_token: page.access_token,
        page_id: page.id,
        metadata: {
          category: page.category,
          tasks: page.tasks,
        },
      });
      savedPages.push(page.name);

      // Subscribe the Page to comment webhooks
      await subscribePageToWebhooks(page.id, page.access_token);

      // Look up linked IG Business Account
      const igAccount = await fetchPageInstagramAccount(
        page.id,
        page.access_token
      );

      if (igAccount) {
        await upsertConnection(supabase, {
          platform: "instagram",
          account_id: igAccount.id,
          account_name: igAccount.username
            ? `@${igAccount.username}`
            : "Instagram",
          // For IG, we use the Page access token - that's how Meta authorizes
          // IG Graph API calls when the IG account is linked to a Page.
          access_token: page.access_token,
          page_id: page.id,
          metadata: {
            ig_business_account_id: igAccount.id,
            ig_username: igAccount.username,
            ig_name: igAccount.name,
            linked_page_id: page.id,
          },
        });
        savedIg.push(`@${igAccount.username || igAccount.id}`);
      }
    }

    // 8. Clear the state cookie + redirect home
    const res = redirectToConnections(req, {
      status: "ok",
      message: `Connected: ${savedPages.length} Page(s), ${savedIg.length} IG account(s)`,
    });
    res.cookies.delete("meta_oauth_state");
    return res;
  } catch (err: any) {
    console.error("[meta oauth callback] failed:", err);
    return redirectToConnections(req, {
      status: "error",
      message: err?.message || String(err),
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function exchangeCodeForToken(
  code: string,
  cfg: ReturnType<typeof getMetaConfig>
): Promise<string> {
  const url = `${GRAPH}/oauth/access_token?${new URLSearchParams({
    client_id: cfg.appId,
    client_secret: cfg.oauthSecret,
    redirect_uri: cfg.redirectUri,
    code,
  })}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(
      `code exchange failed: ${data.error?.message || res.statusText}`
    );
  }
  return data.access_token as string;
}

async function exchangeForLongLivedToken(
  shortToken: string,
  cfg: ReturnType<typeof getMetaConfig>
): Promise<string> {
  const url = `${GRAPH}/oauth/access_token?${new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: cfg.appId,
    client_secret: cfg.oauthSecret,
    fb_exchange_token: shortToken,
  })}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(
      `long-lived exchange failed: ${data.error?.message || res.statusText}`
    );
  }
  return data.access_token as string;
}

type FBPage = {
  id: string;
  name: string;
  access_token: string; // page-scoped, never expires for live mode
  category?: string;
  tasks?: string[];
};

async function fetchUserPages(userToken: string): Promise<FBPage[]> {
  const url = `${GRAPH}/me/accounts?fields=id,name,access_token,category,tasks&access_token=${encodeURIComponent(
    userToken
  )}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(
      `failed to fetch pages: ${data.error?.message || res.statusText}`
    );
  }
  return (data.data || []) as FBPage[];
}

type IGAccount = { id: string; username?: string; name?: string };

async function fetchPageInstagramAccount(
  pageId: string,
  pageToken: string
): Promise<IGAccount | null> {
  // Step 1: get instagram_business_account.id off the Page
  const r1 = await fetch(
    `${GRAPH}/${pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(
      pageToken
    )}`
  );
  const d1 = await r1.json();
  if (!r1.ok || d1.error || !d1.instagram_business_account?.id) return null;

  const igId = d1.instagram_business_account.id;

  // Step 2: get the IG account's username + name
  const r2 = await fetch(
    `${GRAPH}/${igId}?fields=id,username,name&access_token=${encodeURIComponent(
      pageToken
    )}`
  );
  const d2 = await r2.json();
  if (!r2.ok || d2.error) return { id: igId };
  return d2 as IGAccount;
}

async function subscribePageToWebhooks(pageId: string, pageToken: string) {
  // Subscribe Page to feed events (covers Page comments).
  // For IG, the comments subscription is at the app level (already done in
  // the Meta dashboard).
  const url = `${GRAPH}/${pageId}/subscribed_apps`;
  const body = new URLSearchParams({
    subscribed_fields: "feed",
    access_token: pageToken,
  });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.warn("[meta oauth] page webhook subscribe failed:", data);
    // don't throw - the connection itself still works for sending replies
  }
}

async function upsertConnection(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  row: {
    platform: "instagram" | "facebook";
    account_id: string;
    account_name: string;
    access_token: string;
    page_id?: string;
    metadata: Record<string, any>;
  }
) {
  // Long-lived tokens last ~60 days. Save expiry as 50 days out so we have buffer.
  const expiresAt = new Date(
    Date.now() + 50 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error } = await supabase
    .from("social_connections")
    .upsert(
      {
        platform: row.platform,
        account_id: row.account_id,
        account_name: row.account_name,
        access_token: row.access_token,
        token_expires_at: expiresAt,
        page_id: row.page_id ?? null,
        metadata: row.metadata,
        is_active: true,
      },
      { onConflict: "platform,account_id" }
    );

  if (error) {
    console.error(`[meta oauth] upsert failed for ${row.platform}:`, error);
    throw new Error(`failed to save ${row.platform} connection: ${error.message}`);
  }
}

function redirectToConnections(
  req: NextRequest,
  q: { status: "ok" | "error"; message: string }
) {
  const url = new URL("/admin/auto-reply/connections", req.url);
  url.searchParams.set("status", q.status);
  url.searchParams.set("message", q.message);
  return NextResponse.redirect(url);
}
