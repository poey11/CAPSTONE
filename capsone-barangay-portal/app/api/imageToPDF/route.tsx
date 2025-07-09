import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFTextField, TextAlignment, rgb } from "pdf-lib";
import { storage } from '@/app/db/firebase';
import { ref, getDownloadURL } from 'firebase/storage';

export async function POST(req: NextRequest, res: NextResponse) {
    try {
        const body = await req.json();
        const { location, pdfTemplate, data, imageUrl, centerField = [] } = body;

        if (!location || !pdfTemplate || !data) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        try {
            // Load PDF
            const pdfRef = ref(storage, `${location}/${pdfTemplate}`);
            const pdfUrl = await getDownloadURL(pdfRef);
            const pdfResponse = await fetch(pdfUrl);
            const pdfData = await pdfResponse.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfData);

            const form = pdfDoc.getForm();

            // Fill text fields
            for (const key in data) {
                const field = form.getFieldMaybe(key);
                if (!field) continue;

                if (field instanceof PDFTextField) {
                    field.setText(data[key]);
                    if (centerField.includes(key)) {
                        field.setAlignment(TextAlignment.Center);
                    }
                    field.enableReadOnly();
                }
            }

            // 🔽 Embed PNG from imageUrl (Firebase Storage public link)
            if (imageUrl) {
                const imageResponse = await fetch(imageUrl);
                const imageBytes = await imageResponse.arrayBuffer();
                const pngImage = await pdfDoc.embedPng(imageBytes);

                const page = pdfDoc.getPages()[0]; // or choose specific page

                page.drawImage(pngImage, {
                    x: 25,
                    y: 108, // Adjust placement as needed
                    width:130,
                    height:105,
                });
            }

            const pdfBytes = await pdfDoc.save();

            return new NextResponse(pdfBytes, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment; filename=filled_form.pdf',
                },
            });
        } catch (error) {
            console.error("Error processing PDF:", error);
            return NextResponse.json({ message: "An error occurred while generating the PDF" }, { status: 501 });
        }

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ message: "An error occurred while generating the PDF" }, { status: 500 });
    }
}
