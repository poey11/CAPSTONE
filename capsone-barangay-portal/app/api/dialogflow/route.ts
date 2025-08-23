import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

const PROJECT_ID = process.env.GCP_PROJECT_ID!;
const LOCATION   = process.env.DF_LOCATION!;     // e.g., "asia-southeast1"
const AGENT_ID   = process.env.DF_AGENT_ID!;
const SA_B64     = process.env.DIALOGFLOW_SA_BASE64!;

async function getAccessToken() {
  // Decode the base64 SA json
  const json = JSON.parse(Buffer.from(SA_B64, "base64").toString("utf8"));

  // Build a client from that JSON
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.fromJSON(json);
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse || !tokenResponse.token) throw new Error("No GCP access token");
  return tokenResponse.token;
}

export async function POST(req: NextRequest) {
  const { text, sessionId, languageCode = "en" } = await req.json();

  if (!text || !sessionId) {
    return NextResponse.json({ error: "text and sessionId required" }, { status: 400 });
  }

  try {
    const accessToken = await getAccessToken();
    const url = `https://${LOCATION}-dialogflow.googleapis.com/v3/projects/${PROJECT_ID}/locations/${LOCATION}/agents/${AGENT_ID}/sessions/${sessionId}:detectIntent`;

    const body = {
      queryInput: {
        text: { text },
        languageCode,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Dialogflow error" }, { status: 500 });
  }
}
