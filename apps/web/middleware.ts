import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";

const PUBLIC_PATHS = ["/login"];

async function hasValidSession(request: NextRequest) {
  const response = await fetch(new URL("/api/auth/verify", request.url), {
    headers: {
      cookie: request.headers.get("cookie") ?? "",
    },
    cache: "no-store",
  }).catch(() => null);

  return response?.ok ?? false;
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  const response = NextResponse.redirect(url);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);

  if (isPublic) {
    if (pathname === "/login" && hasSessionCookie && (await hasValidSession(request))) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const response = NextResponse.next();
    if (hasSessionCookie) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (!hasSessionCookie || !(await hasValidSession(request))) {
    return redirectToLogin(request, pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
