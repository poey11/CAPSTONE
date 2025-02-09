// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  // Only check if the current path is within the account setup page.
  if (req.nextUrl.pathname.startsWith("/dashboard/accountSetup")) {
    // Retrieve the NextAuth token from the request. Make sure your NextAuth callbacks
    // include the "firstTimelogin" flag in the token.
    const token = await getToken({ req });

    // If a token exists and the account setup is already completed (firstTimelogin is false),
    // redirect the user to the dashboard.
    if (token && token.firstTimelogin === false) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // If there's no token (i.e. the user is not authenticated), redirect to the home page.
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
  // For any other path under /dashboard (or if none of the conditions above are met),
  // allow the request to proceed.
  return NextResponse.next();
}

export const config = { 
  matcher: ["/dashboard/:path*"],
};
