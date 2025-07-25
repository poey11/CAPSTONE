import { NextRequest, NextResponse } from "next/server";
import { ref, getDownloadURL } from "firebase/storage";
import {storage} from "@/app/db/firebase";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { location, body, purpose, boldWords } = data;

  try {
    const pdfRef = ref(storage, `/DocumentTemplates/${location}`);
    const pdfUrl = await getDownloadURL(pdfRef);
    const pdfResponse = await fetch(pdfUrl);
    const pdfData = await pdfResponse.arrayBuffer();

    const pdfDoc = await PDFDocument.load(pdfData);
    const page = pdfDoc.getPage(0);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let fontSize = 12;
    let lineHeight = 20;
    const { width: pageWidth } = page.getSize();
    let yPosition = 525;
    let marginLeft = 70;
    let marginRight = 120;

    if (purpose === "Oath Of Undertaking") {
      fontSize = 10;
      lineHeight = 15;
      marginLeft = 50;
      marginRight = 100;
      yPosition = 670;
    }

    const maxWidth = pageWidth - marginLeft - marginRight;

    const normalizedBody = body
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, '     '); // handle tab spacing

    const bodyLines = normalizedBody.split('\n');

    // Sort bold phrases by length descending to match longer phrases first
    const sortedBoldPhrases = [...boldWords].sort((a, b) => b.length - a.length);

    // Helper to draw a line with bold phrases applied
    function drawTextWithBoldPhrases(line: string, xStart: number, y: number) {
      let cursorX = xStart;
      let remaining = line;

      while (remaining.length > 0) {
        let matched = false;

        for (const phrase of sortedBoldPhrases) {
          if (remaining.startsWith(phrase)) {
            page.drawText(phrase, {
              x: cursorX,
              y,
              size: fontSize,
              font: boldFont,
              color: rgb(0, 0, 0),
            });
            cursorX += boldFont.widthOfTextAtSize(phrase, fontSize);
            remaining = remaining.slice(phrase.length);
            matched = true;
            break;
          }
        }

        if (!matched) {
          const char = remaining[0];
          page.drawText(char, {
            x: cursorX,
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
          cursorX += font.widthOfTextAtSize(char, fontSize);
          remaining = remaining.slice(1);
        }
      }
    }

    // Process each line for wrapping, indenting, and bold styling
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
          drawTextWithBoldPhrases(currentLine, isFirstLine ? marginLeft + 40 : marginLeft, yPosition);
          yPosition -= lineHeight;
          currentLine = word;
          isFirstLine = false;
        }
      }

      if (currentLine) {
        drawTextWithBoldPhrases(currentLine, isFirstLine ? marginLeft + 40 : marginLeft, yPosition);
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
