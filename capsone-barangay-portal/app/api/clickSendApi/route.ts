import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { to, message } = await req.json();
 
        const apiUsername = process.env.CLICKSEND_USERNAME;
        const apiKey = process.env.CLICKSEND_API_KEY;

        const response = await fetch("https://rest.clicksend.com/v3/sms/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Basic " + Buffer.from(`${apiUsername}:${apiKey}`).toString("base64"),
            },
            body: JSON.stringify({
                messages: [{ to, body: message || "SenderID" }]
            })
        });

        const data = await response.json();
        console.log("📩 SMS Response:", data);

        if (!response.ok) {
            throw new Error(`Failed to send SMS: ${JSON.stringify(data)}`);
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error("❌ SMS Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

