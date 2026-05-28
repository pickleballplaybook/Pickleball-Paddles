import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SHORTS_COOKIE = "shorts_auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isShortsApi = pathname.startsWith("/api/admin/shorts/");
  const isShortsPage = pathname.startsWith("/admin/shorts");
  const isPublishApi = pathname.startsWith("/api/admin/publish/");
  const isPublishPage = pathname.startsWith("/admin/publish");
  const isPublishOAuth =
    pathname.startsWith("/auth/youtube") || pathname.startsWith("/auth/meta");
  const isApiGated = isShortsApi || isPublishApi;
  const isGated =
    isShortsPage || isShortsApi || isPublishPage || isPublishApi || isPublishOAuth;

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

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
