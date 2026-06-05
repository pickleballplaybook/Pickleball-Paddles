import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Auth callback — handles the redirect from Supabase after a magic
 * link click or OAuth provider flow.
 *
 * Supabase appends ?code=... ; we exchange that for a session, which
 * sets the auth cookies via the server client, then redirect to the
 * `next` query param (or /match/history by default).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/match/history";

  if (code) {
    const supabase = getSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
    // Surface auth errors to the login page rather than failing silently.
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
}
