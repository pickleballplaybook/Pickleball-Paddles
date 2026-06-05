import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh the Supabase auth session on every middleware pass.
 *
 * This is the canonical pattern from @supabase/ssr docs — without it,
 * server components don't see fresh sessions and tokens can expire
 * silently. Call from src/middleware.ts and pass the request/response
 * through. Always returns the (possibly updated) response.
 *
 * IMPORTANT: don't mutate the response between calling this and returning.
 * The Set-Cookie headers Supabase writes are what keeps auth alive.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touch getUser() to force token refresh if needed. The result itself
  // isn't used here — it's the side-effect (refreshed cookies) we want.
  await supabase.auth.getUser();

  return response;
}
