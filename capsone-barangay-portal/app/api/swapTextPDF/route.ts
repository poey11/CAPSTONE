import { NextRequest, NextResponse } from "next/server";
import { ref, getDownloadURL } from "firebase/storage";
import {storage} from "@/app/db/firebase";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { location,body, purpose } = data;

  try {
    const pdfRef = ref(storage, `/DocumentTemplates/${location}`);
    const pdfUrl = await getDownloadURL(pdfRef);
    const pdfResponse = await fetch(pdfUrl);
    const pdfData = await pdfResponse.arrayBuffer();

    const pdfDoc = await PDFDocument.load(pdfData);
    const page = pdfDoc.getPage(0);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    let fontSize = 12;
    let  lineHeight = 20;
    const { width: pageWidth } = page.getSize();
    let yPosition = 525;
    let marginLeft = 70;
    let marginRight = 120;

    if(purpose === "Oath Of Undertaking") {
      fontSize = 10; 
      lineHeight = 15; 
      marginLeft = 50; 
      marginRight = 100; 
      yPosition = 670;

    }
    const maxWidth = pageWidth - marginLeft - marginRight;

    const normalizedBody = body
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, '     '); // Optional tab handling

    const bodyLines = normalizedBody.split('\n');


    for (const line of bodyLines) {
  if (line.trim() === '') {
    yPosition -= lineHeight;
    continue;
  }

  const words = line.trim().split(' ');
  let currentLine = '';
  let isFirstLine = true;

  for (const word of words) {
    const spacer = currentLine === '' ? '' : ' ';
    const testLine = currentLine + spacer + word;
    const testLineWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testLineWidth < maxWidth) {
      currentLine = testLine;
    } else {
      page.drawText(currentLine, {
        x: isFirstLine ? marginLeft + 40 : marginLeft,
        y: yPosition,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
      currentLine = word;
      isFirstLine = false;
    }
    }

    if (currentLine) {
        page.drawText(currentLine, {
          x: isFirstLine ? marginLeft + 40 : marginLeft,
          y: yPosition,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }
    }


    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=document.pdf',
      },
    });

  } catch (error) {
    console.error("Error in PDF generation:", error);
    return NextResponse.json(
      { success: false, message: "Error generating PDF" },
      { status: 500 }
    );
  }
}
