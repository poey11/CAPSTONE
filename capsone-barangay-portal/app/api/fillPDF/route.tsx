import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFTextField, TextAlignment } from "pdf-lib";
import { storage } from '@/app/db/firebase';
import { ref, getDownloadURL } from 'firebase/storage';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { location, pdfTemplate, data,centerField = []} = body;
        
        if (!location || !pdfTemplate || !data) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }
            try {
                // Fetch PDF from Firebase Storage
                const pdfRef = ref(storage, `${location}/${pdfTemplate}`);
                const pdfUrl = await getDownloadURL(pdfRef);
                const pdfResponse = await fetch(pdfUrl);
                const pdfData = await pdfResponse.arrayBuffer();

                // Load and modify the PDF
                const pdfDoc = await PDFDocument.load(pdfData);
                if (!pdfDoc.getForm()) {
                    throw new Error("No AcroForm found in the PDF. Ensure the PDF contains form fields.");
                }
            
                const form = pdfDoc.getForm();
            
                for (const key in data) {
                    const field = form.getField(key);
                
                    if (!field) {
                        console.warn(`⚠️ Warning: PDF form field '${key}' not found.`);
                        continue;
                    }
                
                    if (field instanceof PDFTextField) {
                        field.setText(data[key]);
                        
                        if (centerField.includes(key)) {
                            field.setAlignment(TextAlignment.Center);
                        }
                        field.enableReadOnly(); // ✅ Make this field uneditable

                    } else {
                        console.warn(`⚠️ Skipping non-text field: ${key} (Type: ${field.constructor.name})`);
                    }
                }
                //form.flatten(); causes an issue with the PDF, so we will not use it (4 0 R error)
                  
                

                const pdfBytes = await pdfDoc.save();
                const buffer = Buffer.from(pdfBytes);

                return new NextResponse(buffer, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment; filename=filled_form.pdf',
                },
            });
            }catch (error) {
                    console.error("Error processing PDF:", error);
                    return NextResponse.json({ message: "An error occurred while generating the PDF" }, { status: 501 });
                }
        
        
    } catch (error) {
        console.error("Error processing PDF:", error);
        return NextResponse.json({ message: "An error occurred while generating the PDF" }, { status: 500 });
    }
}
