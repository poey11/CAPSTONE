// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";


export async function middleware(req: NextRequest) {

  
  return NextResponse.next();
}

export const config = { 
  matcher: ['/dashboard/:path*'],
};
