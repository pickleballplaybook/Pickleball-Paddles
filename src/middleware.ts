import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const SHORTS_COOKIE = "shorts_auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin gating ──────────────────────────────────────────────────────
  const isShortsApi = pathname.startsWith("/api/admin/shorts/");
  const isShortsPage = pathname.startsWith("/admin/shorts");
  const isPublishApi = pathname.startsWith("/api/admin/publish/");
  const isPublishPage = pathname.startsWith("/admin/publish");
  const isPublishOAuth =
    pathname.startsWith("/auth/youtube") || pathname.startsWith("/auth/meta");
  // Newsletter admin export — uses the same shorts_auth cookie gating.
  const isNewsletterApi  = pathname.startsWith("/api/admin/newsletter-emails");
  const isNewsletterPage = pathname.startsWith("/admin/newsletter-emails");
  // Drills upload — same shorts_auth cookie gating.
  const isDrillsApi  = pathname.startsWith("/api/admin/drills");
  const isDrillsPage = pathname.startsWith("/admin/drills");
  // Email automation — trial signup CSV export, drip log, FAQ auto-reply.
  const isEmailApi  = pathname.startsWith("/api/admin/email");
  const isEmailPage = pathname.startsWith("/admin/email");
  // Churn reasons — Firestore-backed cancellation reason capture from the
  // Pickleball Drills Flutter app's cancel flow.
  const isChurnApi  = pathname.startsWith("/api/admin/churn");
  const isChurnPage = pathname.startsWith("/admin/churn");
  // Acquisition attribution — Firestore-backed "How did you hear about us?"
  // capture from the Pickleball Drills onboarding flow.
  const isAcquisitionApi  = pathname.startsWith("/api/admin/acquisition");
  const isAcquisitionPage = pathname.startsWith("/admin/acquisition");
  // Community challenges — Firestore-backed weekly/rolling challenges surfaced
  // in the Pickleball Drills Flutter app.
  const isChallengesApi  = pathname.startsWith("/api/admin/challenges");
  const isChallengesPage = pathname.startsWith("/admin/challenges");
  // Scheduled posts viewer — the page reads from /api/admin/publish/scheduled*
  // (already gated as part of isPublishApi). Just the page itself needs gating.
  const isScheduledPage = pathname.startsWith("/admin/scheduled");
  // Stripe backfill + mirror diagnostics + one-shot maintenance endpoints.
  // Bucketing them under a single `/api/admin/*` catch-all so future admin
  // routes don't leak by default.
  const isAdminMaintenanceApi =
    pathname.startsWith("/api/admin/stripe-backfill") ||
    pathname.startsWith("/api/admin/mirror-diagnostic") ||
    pathname.startsWith("/api/admin/hide-test-accounts") ||
    pathname.startsWith("/api/admin/winback-diagnostic") ||
    pathname.startsWith("/api/admin/send-test-comeback-email") ||
    pathname.startsWith("/api/admin/sync-substack");
  const isApiGated = isShortsApi || isPublishApi || isNewsletterApi || isDrillsApi || isEmailApi || isChurnApi || isAcquisitionApi || isChallengesApi || isAdminMaintenanceApi;
  const isGated =
    isShortsPage || isShortsApi || isPublishPage || isPublishApi || isPublishOAuth ||
    isNewsletterApi || isNewsletterPage || isDrillsApi || isDrillsPage ||
    isEmailApi || isEmailPage ||
    isChurnApi || isChurnPage ||
    isAcquisitionApi || isAcquisitionPage ||
    isChallengesApi || isChallengesPage ||
    isScheduledPage ||
    isAdminMaintenanceApi;

  if (isGated) {
    const isLoginPage = pathname === "/admin/shorts/login";
    const isAuthApi =
      pathname === "/api/admin/shorts/login" ||
      pathname === "/api/admin/shorts/logout";
    const hasCookie = request.cookies.get(SHORTS_COOKIE)?.value === "ok";

    if (!hasCookie && !isLoginPage && !isAuthApi) {
      if (isApiGated) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const url = request.nextUrl.clone();
      url.pathname = "/admin/shorts/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (hasCookie && isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/shorts";
      url.searchParams.delete("next");
      return NextResponse.redirect(url);
    }
  }

  // ── Supabase user-auth session refresh ────────────────────────────────
  // Refresh auth cookies on every request so /match/* and other user-
  // scoped routes see the live session. Must run on the response we
  // return so Set-Cookie headers from Supabase are preserved.
  const response = await updateSession(request);
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
