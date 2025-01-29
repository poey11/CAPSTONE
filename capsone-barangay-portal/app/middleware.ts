import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const barangayToken = req.cookies.get("barangayToken");

    if (!barangayToken) {
        return NextResponse.redirect("/official");
    }
 
    return NextResponse.next();
}

export const config = { 
    matcher: ["/dashboard/:path*"],
};