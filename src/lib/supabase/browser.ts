"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client (auth-aware).
 *
 * Use this in client components for anything that touches auth or
 * RLS-protected data. Cookies are managed automatically so the session
 * survives page reloads and is readable by the server client.
 *
 * The older src/lib/supabaseClient.ts plain client is intentionally
 * left in place — it powers hearts/views/ratings (RLS-free reads) and
 * has no auth context. Don't mix the two for the same query.
 */
export function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
