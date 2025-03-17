import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFTextField } from "pdf-lib";
import { storage } from '@/app/db/firebase';
import { ref, getDownloadURL } from 'firebase/storage';



const getTextFieldCoordinates = async (pdfBytes: Uint8Array, fieldName: string) => {
    
};

const addTextField = async (pdfBytes: Uint8Array) => {
   
};



export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { location, pdfTemplate, data, method } = body;
        
        if (!location || !pdfTemplate || !data) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }
        if( method == true ){
            try {
                // Fetch PDF from Firebase Storage
                const pdfRef = ref(storage, `${location}/${pdfTemplate}`);
                const pdfUrl = await getDownloadURL(pdfRef);
                const pdfResponse = await fetch(pdfUrl);
                const pdfData = await pdfResponse.arrayBuffer();
                console.log("📂 PDF Data Length:", pdfData.byteLength); // Should be > 0

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
                    } else {
                        console.warn(`⚠️ Skipping non-text field: ${key} (Type: ${field.constructor.name})`);
                    }
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
        }else{
            try {
                
            } catch (error) {
                console.error("Error processing PDF:", error);
                return NextResponse.json({ message: "An error occurred while generating the PDF" }, { status: 502 });
            }
        
        }
    } catch (error) {
        console.error("Error processing PDF:", error);
        return NextResponse.json({ message: "An error occurred while generating the PDF" }, { status: 500 });
    }
}
