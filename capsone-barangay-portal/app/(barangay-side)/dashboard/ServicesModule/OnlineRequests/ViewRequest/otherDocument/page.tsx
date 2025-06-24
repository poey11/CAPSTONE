"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import { useSession } from "next-auth/react";


interface fieldsProps {
  name?: string;
  value?: string; // or `file?: File` if used before uploading
}

interface ServiceRequest {
    accID?: string;
    createdAt?: string; // or `Date` if you're storing actual Date objects
    docType?: string;
    fields?: fieldsProps[];
    imageFields?: fieldsProps[];
    purpose?: string;
    requestId?: string;
    requestor?: string;
    status?: string; // you can also make this: "Pending" | "Completed" | "Rejected" | etc.
    type?: string; // could be enum-like: "OtherDocument" | ...
    body?: string;
}   


export default function OtherDocument() {
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const user = session?.user;
    const router = useRouter();
    const id = searchParams.get("id");
    const [documentData, setDocumentData] = useState<ServiceRequest>({});
    const [newBody, setNewBody] = useState<string>("");
    const [day, setDay] = useState<string>("");
    const [month, setMonth] = useState<string>("");
    const [year, setYear] = useState<string>("");
    const extraData = {
        day: day,
        month: month,
        year: year,
    };
    useEffect(() =>{    
        const fetchDocumentData = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, "ServiceRequests", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setDocumentData({
                        ...data,
                    });
                } else {
                    console.error("No such document!");
                }
            } catch (error) {
                console.error("Error fetching document data:", error);
            }
        };

        fetchDocumentData();

    },[id])

    
    const getMonthName = (monthNumber:number) => {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
    
      if (monthNumber >= 1 && monthNumber <= 12) {
        return monthNames[monthNumber - 1];
      } else {
        return "Invalid month number";
      }
    }

    function getOrdinal(n: number): string {
      const suffixes = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
    }
    const today = new Date();
    
    
    useEffect(() => {
        const day = getOrdinal(today.getDate());
        const month = getMonthName(today.getMonth() + 1);
        const year = today.getFullYear();
        setDay(day);
        setMonth(month);
        setYear(year.toString());
    }, []);
    


    function replacePlaceholders(
      body: string,
      fields: fieldsProps[] = [],
      extra: Record<string, string> = {}
    ): string {
      return body.replace(/\{(\w+)\}/g, (_, key) => {
        const fromFields = fields.find(f => f.name === key)?.value;
        const fromExtra = extra[key];
        return fromFields || fromExtra || `{${key}}`; // fallback to placeholder
      });
    }

    useEffect(() => {
        if (documentData.body) {
            const replacedBody = replacePlaceholders(documentData.body, documentData.fields, extraData);
            setNewBody(replacedBody);
        }
    }, [documentData.body]);

    const handleGenerateDocument = async() => {
        console.log("Generating document with body:", newBody);
        const response = await fetch('/api/dynamicPDF', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: documentData.docType,
                body: newBody,
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
        link.download=`${documentData?.docType}${`_${documentData?.purpose}` || ""}_certificate.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        link.remove();
        
    }

    
    return(
        <div className="flex flex-col items-center  bg-[#f9f9f9] z-10 ml-8 p-[30px]">
            <h1 className="text-2xl font-bold mb-4">Other Document Request</h1>
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
                <h2 className="text-xl font-semibold mb-4">Request Details</h2>
                <p><strong>Request ID:</strong> {documentData.requestId}</p>
                <p><strong>Requestor:</strong> {documentData.requestor || user?.name}</p>
                <p><strong>Document Type:</strong> {documentData.docType}</p>
                <p><strong>Purpose:</strong> {documentData.purpose}</p>
                <p><strong>Status:</strong> {documentData.status}</p>
                <p><strong>Created At:</strong> {new Date(documentData.createdAt || '').toLocaleDateString()}</p>

                {documentData.fields && documentData.fields.length > 0 && (
                    <div className="mt-4">
                        <h3 className="font-semibold">Additional Fields</h3>
                        <ul className="list-disc pl-5">
                            {documentData.fields.map((field, index) => (
                                <li key={index}>
                                    <strong>{field.name}:</strong> {field.value}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {documentData.imageFields && documentData.imageFields.length > 0 && (
                    <div className="mt-4">
                        <h3 className="font-semibold">Image Fields</h3>
                        <ul className="list-disc pl-5">
                            {documentData.imageFields.map((imageField, index) => (
                                <li key={index}>
                                    <strong>{imageField.name}:</strong> {imageField.value ? (
                                        <img
                                            src={imageField.value}
                                            alt={imageField.name}
                                            className="max-w-xs max-h-48 object-cover"
                                        />
                                    ) : "No image provided"}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
        </div>   
        <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => router.back()}
        >
            Back
        </button>
        <button
            className="mt-4 ml-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={handleGenerateDocument}
        >
            Generate Document
        </button>
        </div> 
    )
}