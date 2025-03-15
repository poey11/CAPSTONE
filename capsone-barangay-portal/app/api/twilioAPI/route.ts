import { NextApiRequest, NextApiResponse } from "next";
import twilio from "twilio";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method !== "POST") {
        return res.status(405).json({ success: false, message: "Method Not Allowed" });
    }
    const { to,message} = req.body;


    try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const response = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to
        });
        console.log(response);

        res.status(200).json({ success: true, response });
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
}