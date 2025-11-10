import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const PUBLIC_PATHS = ["/login"];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

    if (isPublicPath && req.nextauth.token) {
      return NextResponse.redirect(new URL("/collections", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname;
        const isPublicPath = PUBLIC_PATHS.some((path) =>
          pathname.startsWith(path),
        );

        if (isPublicPath) {
          return true;
        }

        return !!token;
      },
    },
  },
);

export const config = {
  matcher: ["/collections/:path*", "/login"],
};

