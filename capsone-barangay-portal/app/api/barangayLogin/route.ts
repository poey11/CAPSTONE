import { NextResponse } from "next/server";
import { bAuthOptions } from "@/app/api/auth/route";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
    try{
        const body = await req.json();
        const {userid, password} = body;
        

        const URL = `/api/auth/=/credentials`;
        console.log("URL: "+ URL);

        const response = await fetch(URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ userid, password }),
        });
        console.log("response: "+ response.status, response.statusText);

        let data;
        try {
            data = await response.json();
        } catch (error) {
            console.error("Error parsing JSON:", error);
            return NextResponse.json({ error: "Failed to parse response" }, { status: 500 });
        }


        if(!response.ok){
            return NextResponse.json({error: "Invalid Credentials"}, {status: 401});
        }
        console.log("response: "+ response);


        const session = await getServerSession(bAuthOptions);
        console.log("session: "+ session);
        if(!session){
            return NextResponse.json({error: "Failed to create session"}, {status: 500});
        }

        return NextResponse.json({
            message: "Successfully logged in",
            user: session.user,
        });

    }
    catch(e:any){
        return NextResponse.error();
    }
}