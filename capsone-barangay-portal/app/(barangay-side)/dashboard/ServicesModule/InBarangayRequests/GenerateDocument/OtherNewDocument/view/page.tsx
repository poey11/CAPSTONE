"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useState,useEffect } from 'react';
import { getDownloadURL, ref } from "firebase/storage";
import {storage,db} from "@/app/db/firebase";
import { collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { useSession } from "next-auth/react";
import { getSpecificDocument } from '@/app/helpers/firestorehelper';

interface dataFields {
    name?: string;
    value?: string;
}

interface  data {
    purpose?: string;
    fields?: dataFields[];
    body?: string;
    docType?: string;
}


export default function view() {
    const { data: session } = useSession();
    const user = session?.user;
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);
    const [data, setData] = useState<data>({}) 
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    console.log(id);

    useEffect(() => {
        if(!id) return
        getSpecificDocument("ServiceRequests", id, setData);
        setLoading(false);   
        console.log(id);    
    }, [id]);
    

    console.log(data);

    useEffect(() => {
      if (!data?.docType || !data?.body) return; // only run when data is ready
        
      const handlePrintDocument = async () => {
        try {
          const response = await fetch('/api/dynamicPDF', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: data.docType,
              body: data.body,
            }),
          });
      
          if (!response.ok) {
            console.error("Failed to generate PDF");
            return;
          }
      
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        } catch (error) {
          console.error("Error generating or previewing PDF:", error);
        }
      };
  
      handlePrintDocument();
  
      // Optional: cleanup URL when component unmounts or data changes
      return () => {
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      };
    }, [data]);

    if (loading) {
        return <div className="w-full h-screen flex items-center justify-center">Loading...</div>;
    }   


    const handdlePrintDocument = async () => {
        const response = await fetch('/api/dynamicPDF', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: data.docType,
                body: data.body,
            }),
        });
        if (!response.ok) {
            console.error("Failed to generate PDF");
            return;
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download=`${data?.docType}${`_${data?.purpose}` || ""}_certificate.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        link.remove();
    }

    return(
        <div className="w-full h-screen bg-[#f9f9f9] z-10 ml-8 p-[30px]">
            <div className="flex items-center mb-6">
                <button 
                    onClick={() => router.back()}
                className="bg-gray-600 text-white mr-2 px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-300">
                    Back
                </button>
                <button
                    className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-300'
                    onClick={handdlePrintDocument}
                    >
                   Print Document
                </button>
                <h1 className="text-2xl font-bold mb-4 max-w-lg">View Document Details </h1>
            </div>           
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Document Type: {data.docType}</h2>
                <p className="mb-2"><strong>Purpose:</strong> {data.purpose}</p>
                <p className="mb-4"><strong>Body:</strong> {data.body}</p>
                <h3 className="text-lg font-semibold mb-2">Fields:</h3>
                <ul className="list-disc pl-5">
                    {data.fields?.map((field, index) => (
                        <li key={index} className="mb-1">
                            <strong>{field.name}:</strong> {field.value}
                        </li>
                    ))}
                </ul>

                
            </div>
            {pdfUrl && (
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Generated PDF:</h3>
                    <iframe
                        src={pdfUrl}
                        width="100%"
                        height="1150px"
                        className="border border-gray-300 rounded-lg"
                        title="Generated PDF"
                        
                    />
                </div>
                )}
        </div>
    )

}