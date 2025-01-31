import { NextResponse } from "next/server";

export async function POST(){
    const response = NextResponse.json({message: "Logout Successful"}, {status: 200});

    response.headers.set(
        "Set-Cookie",
        "barangayToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict"
    )

    return response;
}