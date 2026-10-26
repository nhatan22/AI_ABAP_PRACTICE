import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Coarse gate: no valid session cookie -> login. Fine-grained checks (user still exists,
// not disabled, admin-only) happen in the pages / route handlers via lib/auth.ts.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = pathname === "/login" || pathname.startsWith("/api/auth/");
  const userId = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (userId && pathname === "/login") return NextResponse.redirect(new URL("/", req.url));
  if (userId || isPublic) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  const url = new URL("/login", req.url);
  if (pathname !== "/") url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|css|js)$).*)"],
};
