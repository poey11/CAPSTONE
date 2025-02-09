// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";


export async function middleware(req: NextRequest) {

  // Retrieve the NextAuth token from the request.
  const token = await getToken({ req });
  console.log("middleware: "+token);
  // If no token is found, redirect to the home page.
  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const { pathname, search } = req.nextUrl;
  
  
  if (token.firstTimelogin === true && !pathname.startsWith("/dashboard/accountSetup")) {
    const returnUrl = encodeURIComponent(pathname + search);
    console.log("middleware");
    console.log("pathname: "+pathname);
    console.log("search: "+search);
    console.log("returnUrl: "+returnUrl);
    return NextResponse.redirect(new URL(`/dashboard/accountSetup?returnUrl=${returnUrl}`, req.url));
  }

 
  if (pathname.startsWith("/dashboard/accountSetup") && token.firstTimelogin === false) {
    const returnUrl = req.nextUrl.searchParams.get("returnUrl") || "/dashboard";
    console.log("middleware");
    console.log("pathname: "+pathname);
    console.log("search: "+search);
    console.log("returnUrl: "+returnUrl);
    return NextResponse.redirect(new URL(returnUrl, req.url));
  }

  // Otherwise, allow the request to proceed.
  return NextResponse.next();
}

export const config = { 
  matcher: ['dashboard/:path*', 'dashboard/accountSetup'],
};
