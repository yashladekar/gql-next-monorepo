import { getSessionCookie } from "better-auth/cookies"
import { NextResponse, type NextRequest } from "next/server"

// Proxy (Next.js 16's rename of middleware) does ONE thing: optimistic
// authentication gating based on the presence of the session cookie. It is not
// an authorization layer — real authorization always happens in the data layer
// (GraphQL -> AuthorizationService -> OpenFGA).
const PUBLIC_ROUTES = ["/sign-in", "/forbidden"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = getSessionCookie(request)
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  if (!sessionCookie && !isPublic) {
    const url = new URL("/sign-in", request.url)
    if (pathname !== "/") url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  if (sessionCookie && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Run on everything except API routes, Next internals and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|css|js|woff2?)).*)"],
}
