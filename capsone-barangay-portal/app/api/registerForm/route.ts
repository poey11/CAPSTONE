import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { captchaToken } = body;
   
    const secretKey = process.env.NEXT_PUBLIC_CAPTCHA_SECRET_KEY;
  
    
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;
  
    const response = await fetch(verificationUrl, { method: "POST" });
    const captchaData = await response.json();
    
    
    if (!captchaData.success) {
      return NextResponse.json({ success: false, message: "CAPTCHA verification failed" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "CAPTCHA verification successful!" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
