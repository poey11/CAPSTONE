import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/app/db/firebase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, res: NextResponse) {
  const data = await req.json();
  const { title, body, boldWords } = data;

  try {
    const pdfRef = ref(storage, `/ServiceRequests/templates/otherdoc/template.pdf`);
    const pdfUrl = await getDownloadURL(pdfRef);
    const pdfResponse = await fetch(pdfUrl);
    const pdfData = await pdfResponse.arrayBuffer();

    const pdfDoc = await PDFDocument.load(pdfData);
    const page = pdfDoc.getPage(0);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 12;

    const pageWidth = page.getWidth();
    const titleFontSize = 25;
    const titleWidth = font.widthOfTextAtSize(title, titleFontSize);
    const titleX = (pageWidth - titleWidth) / 2;

    const normalizedBody = body.replace(/\r\n/g, '\n');

    // Draw centered title
    page.drawText(title, {
      x: titleX,
      y: 570,
      size: titleFontSize,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Prepare for body text
    const lineHeight = 20;
    let yPosition = 465;
    const marginLeft = 100;
    const marginRight = 90;
    const maxWidth = pageWidth - marginLeft - marginRight;

    const bodyLines = normalizedBody.split('\n');

    // Normalize bold phrases for easier matching
    const normalize = (text: string) =>
      text.trim().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').toLowerCase();

    const normalizedBoldPhrases = boldWords.map(normalize);

    for (const line of bodyLines) {
      const originalWords = line.trim().split(/\s+/);
      const sanitizedWords = originalWords.map((word: string) =>
        word.replace(/[.,!?;:]/g, '')
      );
    
      const chunks: { text: string; isBold: boolean }[] = [];
      let i = 0;
      while (i < sanitizedWords.length) {
        let matched = false;
        for (let j = sanitizedWords.length; j > i; j--) {
          const candidateWords = sanitizedWords.slice(i, j);
          const candidateText = candidateWords.join(' ').toLowerCase();
          if (normalizedBoldPhrases.includes(candidateText)) {
            const originalText = originalWords.slice(i, j).join(' ');
            chunks.push({ text: originalText, isBold: true });
            i = j;
            matched = true;
            break;
          }
        }
        if (!matched) {
          chunks.push({ text: originalWords[i], isBold: false });
          i += 1;
        }
      }
    
      const spaceWidth = font.widthOfTextAtSize(' ', fontSize);
      const indentWidth = font.widthOfTextAtSize('           ', fontSize);
    
      let currentLine: { text: string; isBold: boolean }[] = [];
      let currentLineWidth = 0;
      let isFirstLine = true;
    
      for (const chunk of chunks) {
        const usedFont = chunk.isBold ? boldFont : font;
        const chunkWidth = usedFont.widthOfTextAtSize(chunk.text, fontSize);
      
        const lineMaxWidth = isFirstLine
          ? maxWidth - indentWidth
          : maxWidth;
      
        if (currentLineWidth + chunkWidth > lineMaxWidth && currentLine.length > 0) {
          // Draw the current line
          let drawX = marginLeft;
          if (isFirstLine) drawX += indentWidth;
        
          for (const part of currentLine) {
            const partFont = part.isBold ? boldFont : font;
            page.drawText(part.text, {
              x: drawX,
              y: yPosition,
              size: fontSize,
              font: partFont,
              color: rgb(0, 0, 0),
            });
            drawX += partFont.widthOfTextAtSize(part.text, fontSize) + spaceWidth;
          }
        
          yPosition -= lineHeight;
          currentLine = [];
          currentLineWidth = 0;
          isFirstLine = false;
        }
      
        currentLine.push(chunk);
        currentLineWidth += chunkWidth + spaceWidth;
      }
    
      // Draw last line of paragraph
      if (currentLine.length > 0) {
        let drawX = marginLeft;
        if (isFirstLine) drawX += indentWidth;
      
        for (const part of currentLine) {
          const partFont = part.isBold ? boldFont : font;
          page.drawText(part.text, {
            x: drawX,
            y: yPosition,
            size: fontSize,
            font: partFont,
            color: rgb(0, 0, 0),
          });
          drawX += partFont.widthOfTextAtSize(part.text, fontSize) + spaceWidth;
        }
      
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
    return NextResponse.json({ success: false, message: "Error generating PDF" }, { status: 500 });
  }
}
