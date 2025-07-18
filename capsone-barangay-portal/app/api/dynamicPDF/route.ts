import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { storage } from '@/app/db/firebase';
import { ref, getDownloadURL } from 'firebase/storage';


export async function POST(req: NextRequest, res:NextResponse) {
    const data = await req.json();
    const {title, body} = data;

    try{
        
        const pdfRef = ref(storage, `/ServiceRequests/templates/otherdoc/template.pdf`);
        const pdfUrl = await getDownloadURL(pdfRef);
        const pdfResponse = await fetch(pdfUrl);
        const pdfData = await pdfResponse.arrayBuffer();

        const pdfDoc = await PDFDocument.load(pdfData);
        const page = pdfDoc.getPage(0);
        
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontSize = 12;
        const titleWidth = font.widthOfTextAtSize(title, 30);

        const pageWidth = page.getWidth();

        const titleX = (pageWidth - titleWidth) / 2;
        

        page.drawText(title, {
            x: titleX,
            y: 550,
            size:25,
            font: font,
            color: rgb(0, 0, 0),
            lineHeight: 14,
            maxWidth: 500,
        })

        page.drawText(body, {
            x: 55,
            y: 460,
            size:fontSize,
            font: font,
            color: rgb(0, 0, 0),
            lineHeight: 14,
            maxWidth: 500,
        });

        const pdfBytes = await pdfDoc.save();
        return new NextResponse(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=document.pdf',
            },
        });
    }
    catch (error) {
        console.error("Error in PDF generation:", error);
        return NextResponse.json({ success: false, message: "Error generating PDF" }, { status: 500 });
    }


}