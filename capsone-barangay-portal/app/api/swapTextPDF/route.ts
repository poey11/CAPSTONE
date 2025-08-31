import { NextRequest, NextResponse } from "next/server";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/app/db/firebase";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { location, body, purpose, boldWords } = data;
  console.log("Request data:", data);

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
    else if (purpose === "Letter of Refailure") {
      yPosition = 712;
    }

    const maxWidth = pageWidth - marginLeft - marginRight;

    const normalizedBody = body
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, '     '); // retain tab spacing

    const bodyLines = normalizedBody.split('\n');

    const sortedBoldPhrases = [...boldWords].sort((a, b) => b.length - a.length);
    const normalize = (text: string) =>
      text.trim().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').toLowerCase();
    const normalizedBoldPhrases = sortedBoldPhrases.map(normalize);

    function tokenizeParagraph(paragraph: string) {
      const tokens: { text: string; isBold: boolean }[] = [];
      let remaining = paragraph;

      while (remaining.length > 0) {
        let matched = false;

        for (let i = 0; i < sortedBoldPhrases.length; i++) {
          const phrase = sortedBoldPhrases[i];
          if (remaining.startsWith(phrase)) {
            tokens.push({ text: phrase, isBold: true });
            remaining = remaining.slice(phrase.length);
            matched = true;
            break;
          }
        }

        if (!matched) {
          const match = remaining.match(/^\s+|^\S+/);
          if (match) {
            tokens.push({ text: match[0], isBold: false });
            remaining = remaining.slice(match[0].length);
          } else {
            break;
          }
        }
      }

      return tokens;
    }

    function drawJustifiedLine(
      line: { text: string; isBold: boolean }[],
      isLastLine: boolean,
      x: number,
      y: number,
      fontSize: number
    ) {
      // Compute total width and space count
      let totalWidth = 0;
      let spaceCount = 0;
      for (const segment of line) {
        const segmentFont = segment.isBold ? boldFont : font;
        totalWidth += segmentFont.widthOfTextAtSize(segment.text, fontSize);
        if (!segment.isBold && /^\s+$/.test(segment.text)) {
          spaceCount += 1;
        }
      }

      let extraSpacePerGap = 0;
      if (!isLastLine && spaceCount > 0) {
        extraSpacePerGap = (maxWidth - totalWidth) / spaceCount;
      }

      let cursorX = x;

      for (const segment of line) {
        const segmentFont = segment.isBold ? boldFont : font;
        page.drawText(segment.text, {
          x: cursorX,
          y,
          size: fontSize,
          font: segmentFont,
          color: rgb(0, 0, 0),
        });

        const segmentWidth = segmentFont.widthOfTextAtSize(segment.text, fontSize);
        cursorX += segmentWidth;

        if (!segment.isBold && /^\s+$/.test(segment.text)) {
          cursorX += extraSpacePerGap;
        }
      }
    }

    for (const paragraph of bodyLines) {
      if (paragraph.trim() === '') {
        yPosition -= lineHeight;
        continue;
      }

      const tokens = tokenizeParagraph(paragraph);
      let currentLine: { text: string; isBold: boolean }[] = [];
      let currentLineWidth = 0;
      let isFirstLineOfParagraph = true;

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const tokenFont = token.isBold ? boldFont : font;
        const tokenWidth = tokenFont.widthOfTextAtSize(token.text, fontSize);

        if (currentLineWidth + tokenWidth > maxWidth && currentLine.length > 0) {
          const indentX = isFirstLineOfParagraph ? marginLeft + 40 : marginLeft;
          drawJustifiedLine(currentLine, false, indentX, yPosition, fontSize);
          yPosition -= lineHeight;

          currentLine = [token];
          currentLineWidth = tokenWidth;
          isFirstLineOfParagraph = false;
        } else {
          currentLine.push(token);
          currentLineWidth += tokenWidth;
        }
      }

      // Draw final line (not justified)
      if (currentLine.length > 0) {
        // const indentX = isFirstLineOfParagraph ? marginLeft + 40 : marginLeft;
        const indentX =
          isFirstLineOfParagraph && purpose !== "Letter of Refailure"
            ? marginLeft + 40
            : marginLeft;
        drawJustifiedLine(currentLine, true, indentX, yPosition, fontSize);
        yPosition -= lineHeight;
      }
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    return new NextResponse(pdfBuffer, {
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
