import { NextResponse } from "next/server";
import ConvertAPI from "convertapi";
import fetch from "node-fetch";

export async function POST(req: Request) {
  try {
    const { fileUrl } = await req.json();
    if (!fileUrl) return NextResponse.json({ error: "Missing file URL" }, { status: 400 });

    // Initialize ConvertAPI
    const convertapi = new ConvertAPI(process.env.CONVERTAPI_KEY || "");

    // Convert Excel to PDF
    const result = await convertapi.convert("pdf", { File: fileUrl }, "xlsx");

    if (!result || !result.file) throw new Error("Conversion failed");

    // Get the PDF file URL from ConvertAPI
    const pdfUrl = result.file.url;

    // Fetch the PDF file as a buffer
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) throw new Error("Failed to download converted PDF");

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Return the PDF file to the frontend
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Kasambahay_Report.pdf"',
      },
    });
  } catch (error) {
    console.error("Error in PDF conversion:", error);
    return NextResponse.json({ error: "Conversion failed" }, { status: 500 });
  }
}
