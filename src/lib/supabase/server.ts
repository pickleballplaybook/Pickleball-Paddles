import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Supabase client (auth-aware) for use inside Server Components,
 * Route Handlers, and Server Actions.
 *
 * Reads + writes auth cookies through next/headers so a user signed in
 * via the browser client is recognized server-side automatically.
 *
 * Note: in Server Components we can only READ cookies (Next.js limitation) —
 * Supabase calls setAll() but it noops there. Session refresh actually
 * happens in middleware (see src/lib/supabase/middleware.ts).
 */
export function getSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components can't set cookies — the middleware refresh handles it.
          }
        },
      },
    },
  );
}
